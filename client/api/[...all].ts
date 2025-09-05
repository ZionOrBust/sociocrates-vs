// api/[...all].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

// --- import your real handlers (adjust paths as you have them now) ---
import authLogin from "../server/routes/auth/login";
import authMe from "../server/routes/auth/me";

import circlesIndex from "../server/routes/circles/index";
import circleById from "../server/routes/circles/_id/index";
import circleProposals from "../server/routes/circles/_id/proposals";

import proposalsIndex from "../server/routes/proposals/index";
import proposalById from "../server/routes/proposals/_id/index";
import proposalConsent from "../server/routes/proposals/_id/consent";
import proposalObjections from "../server/routes/proposals/_id/objections";
import proposalQuestions from "../server/routes/proposals/_id/questions";
import proposalReactions from "../server/routes/proposals/_id/reactions";

// Utility: CORS headers (safe for same-origin too)
function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
}

type Handler = (req: VercelRequest, res: VercelResponse) => any;

// Router table: path -> method -> handler
const routes: Record<string, Partial<Record<string, Handler>>> = {
  // ---- AUTH ----
  "/auth/login": {
    POST: authLogin,

    // TEMP: accept GET too and tell us if the client is (accidentally) using GET.
    // Remove this once we confirm the method.
    GET: (req, res) => {
      setCors(res);
      return res.status(200).json({
        _debug: "Login hit via GET (client should POST). This is a TEMP debug shim.",
        query: req.query,
      });
    },
  },
  "/auth/me": { GET: authMe },

  // ---- CIRCLES ----
  "/circles": { GET: circlesIndex },
  "/circles/_id": { GET: circleById },
  "/circles/_id/proposals": { GET: circleProposals },

  // ---- PROPOSALS ----
  "/proposals": { GET: proposalsIndex },
  "/proposals/_id": { GET: proposalById },
  "/proposals/_id/consent": { GET: proposalConsent, POST: proposalConsent },
  "/proposals/_id/objections": { GET: proposalObjections, POST: proposalObjections },
  "/proposals/_id/questions": { GET: proposalQuestions, POST: proposalQuestions },
  "/proposals/_id/reactions": { GET: proposalReactions, POST: proposalReactions },
};

function normalizePath(parts: string[]): { key: string } {
  // You already parse [...all]; convert ["auth","login"] -> "/auth/login"
  const key = "/" + parts.join("/");
  return { key };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  // Preflight short-circuit (prevents 405 on OPTIONS)
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Basic router logger (shows up in Vercel Function logs)
  console.log("[ROUTER]", {
    method: req.method,
    url: req.url,
    path: req.query?.all,
    headers: {
      // trim down noise; add more if needed
      "content-type": req.headers["content-type"],
      "user-agent": req.headers["user-agent"],
      origin: req.headers["origin"],
    },
  });

  const parts = Array.isArray(req.query.all) ? (req.query.all as string[]) : [];
  const { key } = normalizePath(parts);

  const methodMap = routes[key];

  // If route exists but method not allowed, send a detailed 405
  if (methodMap && !methodMap[req.method!]) {
    const allow = Object.keys(methodMap);
    res.setHeader("Allow", allow.join(", "));
    res.setHeader("X-Debug-Route", key);
    return res.status(405).json({
      message: "Method not allowed",
      route: key,
      got: req.method,
      allow,
    });
  }

  // No route at all?
  if (!methodMap) {
    res.setHeader("X-Debug-Route", key);
    return res.status(404).json({ message: "Not found", route: key });
  }

  // Dispatch
  return methodMap[req.method!]?.(req, res);
}
