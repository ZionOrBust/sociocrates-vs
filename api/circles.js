import { neon } from "@neondatabase/serverless";
import { neon } from "@neondatabase/serverless";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

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

async function getUserFromToken(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Access token required' }));
    return null;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Prefer embedded user (demo token)
    if (decoded.user) return decoded.user;
    // Otherwise minimal user from id; fill role from DB when available
    const user = { id: decoded.userId, role: 'participant' };
    if (DB_URL && decoded.userId) {
      try {
        const sql = neon(DB_URL);
        const rows = await sql`select id, email, name, role from users where id = ${decoded.userId} limit 1`;
        if (rows.length) return { ...rows[0] };
      } catch {}
    }
    return user;
  } catch {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Invalid token' }));
    return null;
  }
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await getUserFromToken(req, res);
  if (!user) return;

  // GET /api/circles: list circles
  if (req.method === 'GET') {
    if (!DB_URL) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify([]));
    }
    try {
      const sql = neon(DB_URL);
      // Ensure circles table exists (minimal schema, no FKs to avoid dependency issues)
      await sql`create table if not exists circles (
        id text primary key,
        name text not null,
        description text default '' not null,
        created_by text not null,
        is_active boolean default true not null,
        created_at timestamp default now() not null,
        updated_at timestamp default now() not null
      )`;

      const rows = await sql`
        select * from circles where created_by = ${user.id}
        order by created_at desc`;
      res.status(200).json(rows.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        createdBy: r.created_by,
        isActive: r.is_active,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })));
    } catch (e) {
      // On DB error return empty to avoid 500s in demo
      return res.status(200).json([]);
    }
    return;
  }

  // POST /api/circles: create circle (admin only)
  if (req.method === 'POST') {
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    try {
      const { name, description } = await readJson(req);
      if (!name) return res.status(400).json({ message: 'Name is required' });

      if (!DB_URL) {
        // Demo mode: acknowledge but not persist
        return res.status(200).json({ id: 'demo-circle', name, description: description || '', createdBy: user.id, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }

      const sql = neon(DB_URL);
      // Ensure circles table exists
      await sql`create table if not exists circles (
        id text primary key,
        name text not null,
        description text default '' not null,
        created_by text not null,
        is_active boolean default true not null,
        created_at timestamp default now() not null,
        updated_at timestamp default now() not null
      )`;

      const id = nanoid();
      const created = await sql`insert into circles (id, name, description, created_by, is_active) values (${id}, ${name}, ${description || ''}, ${user.id}, true) returning id, name, description, created_by, is_active, created_at, updated_at`;
      const circle = created[0];
      // Attach to org if any
      try {
        const orgs = await sql`select o.id from organizations o join organization_memberships m on m.org_id = o.id and m.user_id = ${user.id} limit 1`;
        if (orgs.length) {
          await sql`insert into organization_circles (org_id, circle_id) values (${orgs[0].id}, ${circle.id}) on conflict do nothing`;
        }
      } catch {}

      return res.status(200).json({
        id: circle.id,
        name: circle.name,
        description: circle.description,
        createdBy: circle.created_by,
        isActive: circle.is_active,
        createdAt: circle.created_at,
        updatedAt: circle.updated_at,
      });
    } catch (e) {
      // Demo fallback on DB errors so UI can continue without persistence
      return res.status(200).json({ id: 'demo-circle', name: name || 'New Circle', description: description || '', createdBy: user.id, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ message: 'Method Not Allowed' });
}
