import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const DB_URL = process.env.DATABASE_URL || "";

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
}

async function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch (e) { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

const demoUsers = {
  'admin@sociocracy.org': { id: 'admin-demo', email: 'admin@sociocracy.org', name: 'Admin User', role: 'admin', password: 'password' },
  'demo@sociocracy.org': { id: 'demo-user', email: 'demo@sociocracy.org', name: 'Demo User', role: 'participant', password: 'password' },
};

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { email, password } = await readJson(req);
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    // Try DB-backed auth if configured; fall back to demo on any failure
    if (DB_URL) {
      try {
        const sql = neon(DB_URL);
        const rows = await sql`select id, email, name, role, password from users where email = ${email} limit 1`;
        let user = rows[0];
        if (!user && (email in demoUsers)) {
          const hash = await bcrypt.hash('password', 10);
          const created = await sql`insert into users (email, password, name, role) values (${email}, ${hash}, ${demoUsers[email].name}, ${demoUsers[email].role}) returning id, email, name, role, password`;
          user = created[0];
        }
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
      } catch (e) {
        // fall through to demo-mode below
      }
    }

    // Demo-mode fallback (no DB or DB error)
    const demo = demoUsers[email];
    if (demo && password === demo.password) {
      const { password: _omit, ...u } = demo;
      const token = jwt.sign({ userId: u.id, user: u }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({ user: u, token });
    }
    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed' });
  }
}
