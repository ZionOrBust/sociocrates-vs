import authLogin from "./auth/login.js";
import authMe from "./auth/me.js";
import circles from "./circles.js";
import proposals from "./proposals.js";
import proposalById from "./proposals/[id].js";
import circleProposals from "./circles/[id]/proposals.js";
import adminUserUpdate from "./admin/users/[id].js";
import ping from "./ping.js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
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
  "/circles": { GET: circles, POST: circles },
  "/proposals": { GET: proposals },
  "/proposals/_id": { GET: proposalById },
  "/circles/_id/proposals": { GET: circleProposals },
  "/admin/users/_id": { PUT: adminUserUpdate },
  "/ping": { GET: ping },
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

  // Attach dynamic params expected by downstream handlers
  const q = { ...(req.query || {}) };
  if (key === "/proposals/_id") q.id = parts[1];
  if (key === "/admin/users/_id") q.id = parts[2];
  if (key === "/circles/_id/proposals") q.id = parts[1];
  req.query = q;

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

  return methodMap[method](req, res);
}
