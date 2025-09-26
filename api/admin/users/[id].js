import { neon } from "@neondatabase/serverless";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const DB_URL = process.env.DATABASE_URL || "";

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
}

function getUserFromToken(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return null;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.user || { id: decoded.userId, role: 'participant' };
  } catch {
    res.status(403).json({ message: 'Invalid token' });
    return null;
  }
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

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const me = getUserFromToken(req, res);
  if (!me) return;
  if (me.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

  if (req.method === 'PUT') {
    try {
      const { role, isActive } = await readJson(req);

      // Demo fallback: acknowledge without persistence
      if (!DB_URL) {
        return res.status(200).json({ ok: true });
      }

      const sql = neon(DB_URL);
      if (role !== undefined) {
        await sql`update users set role = ${role} where id = ${req.query.id}`;
      }
      if (isActive !== undefined) {
        await sql`update users set is_active = ${!!isActive} where id = ${req.query.id}`;
      }
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ message: 'Failed to update user' });
    }
  }

  res.setHeader('Allow', 'PUT, OPTIONS');
  return res.status(405).json({ message: 'Method Not Allowed' });
}
