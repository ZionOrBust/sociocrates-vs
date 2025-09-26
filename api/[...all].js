import authLogin from "./auth/login.js";
import authLogin from "./auth/login.js";
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
  if (p[0] === "circles" && p.length === 1) return "/circles";
  if (p[0] === "circles" && p[2] === "proposals") return "/circles/_id/proposals";
  if (p[0] === "proposals" && p.length === 1) return "/proposals";
  if (p[0] === "proposals" && p[1]) return "/proposals/_id";
  if (p[0] === "admin" && p[1] === "users" && p[2]) return "/admin/users/_id";
  if (p[0] === "ping") return "/ping";
  return "/" + p.join("/");
}

const routes = {
  "/auth/login": { POST: authLogin },
  "/auth/me": { GET: authMe },
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
