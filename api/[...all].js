import loginHandler from "./auth/login.js";
import jwt from "jsonwebtoken";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function authMe(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Access token required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = decoded.user || null;
    if (user) {
      const requiresSetup = user.role === 'admin';
      return res.status(200).json({ user, org: null, requiresSetup });
    }
    if (decoded.userId) {
      return res.status(200).json({ user: { id: decoded.userId, email: '', name: 'User', role: 'participant' }, org: null, requiresSetup: false });
    }
    return res.status(401).json({ message: 'Invalid token' });
  } catch {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

function normalize(parts) {
  const p = Array.isArray(parts) ? parts : [];
  if (p.length === 0) return "/";
  if (p[0] === "auth" && p[1] === "login") return "/auth/login";
  if (p[0] === "auth" && p[1] === "me") return "/auth/me";
  if (p[0] === "orgs" && p[1] === "me") return "/orgs/me";
  if (p[0] === "circles" && p.length === 1) return "/circles";
  return "/" + p.join("/");
}

function getUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.user || (decoded.userId ? { id: decoded.userId, role: 'participant' } : null);
  } catch {
    return null;
  }
}

function orgsMe(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  const u = getUser(req);
  if (!u) return res.status(401).json({ message: 'Access token required' });
  const requiresSetup = u.role === 'admin';
  return res.status(200).json({ user: u, org: null, requiresSetup });
}

function circlesList(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  // Demo: return empty list regardless of auth to avoid dashboard hard-fail
  return res.status(200).json([]);
}

async function circlesCreate(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  const parseBody = () => new Promise((resolve, reject) => {
    if (req.body) {
      try { return resolve(typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body); } catch { return reject(new Error('Invalid JSON')); }
    }
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
  try {
    const body = await parseBody();
    const name = (body?.name || '').trim();
    const description = body?.description || '';
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const u = getUser(req) || { id: 'demo-user', role: 'admin' };
    const now = new Date().toISOString();
    return res.status(201).json({ id: 'demo-' + Math.random().toString(36).slice(2, 10), name, description, createdBy: u.id, isActive: true, createdAt: now, updatedAt: now });
  } catch (e) {
    return res.status(400).json({ message: 'Invalid JSON' });
  }
}

const routes = {
  "/auth/login": { POST: loginHandler },
  "/auth/me": { GET: authMe },
  "/orgs/me": { GET: orgsMe },
  "/circles": { GET: circlesList, POST: circlesCreate },
};

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const parts = Array.isArray(req.query?.all)
    ? req.query.all
    : typeof req.query?.all === "string"
      ? [req.query.all]
      : [];

  const key = normalize(parts);
  const method = (req.method || "GET").toUpperCase();
  const methodMap = routes[key];

  // No dynamic params required for auth routes
  req.query = req.query || {};

  if (!methodMap) {
    res.setHeader("X-Debug-Route", key);
    return res.status(404).json({ message: "Not found", route: key });
  }

  if (!methodMap[method]) {
    const allow = Object.keys(methodMap);
    res.setHeader("Allow", allow.join(", "));
    res.setHeader("X-Debug-Route", key);
    return res.status(405).json({ message: "Method not allowed", route: key, got: method, allow });
  }

  try {
    return await methodMap[method](req, res);
  } catch (e) {
    console.error("[ROUTER_ERROR]", { route: key, method, error: e && e.message ? e.message : String(e) });
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({ message: "Server error", route: key });
    }
  }
}
