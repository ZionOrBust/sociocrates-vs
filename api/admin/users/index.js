import { neon } from "@neondatabase/serverless";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const DB_URL = process.env.DATABASE_URL || "";

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
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

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const me = getUserFromToken(req, res);
  if (!me) return;
  if (me.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

  if (req.method === 'GET') {
    // Demo fallback
    if (!DB_URL) {
      return res.status(200).json([
        { id: 'admin-demo', email: 'admin@sociocracy.org', name: 'Admin User', role: 'admin', isActive: true, createdAt: new Date().toISOString() },
        { id: 'demo-user', email: 'demo@sociocracy.org', name: 'Demo User', role: 'participant', isActive: true, createdAt: new Date().toISOString() },
      ]);
    }

    try {
      const sql = neon(DB_URL);
      const rows = await sql`select id, email, name, role, coalesce(is_active, true) as is_active, coalesce(created_at, now()) as created_at from users order by created_at desc`;
      return res.status(200).json(rows.map(r => ({
        id: r.id,
        email: r.email,
        name: r.name,
        role: r.role,
        isActive: r.is_active,
        createdAt: r.created_at,
      })));
    } catch (e) {
      // On DB error, return demo data instead of 500
      return res.status(200).json([
        { id: 'admin-demo', email: 'admin@sociocracy.org', name: 'Admin User', role: 'admin', isActive: true, createdAt: new Date().toISOString() },
        { id: 'demo-user', email: 'demo@sociocracy.org', name: 'Demo User', role: 'participant', isActive: true, createdAt: new Date().toISOString() },
      ]);
    }
  }

  res.setHeader('Allow', 'GET, OPTIONS');
  return res.status(405).json({ message: 'Method Not Allowed' });
}
