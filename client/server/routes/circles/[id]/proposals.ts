import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../../../api/lib/cors";
import { authenticateToken, requireAuth, type AuthenticatedRequest } from "../../../../api/lib/auth";
import { storage } from "../../../../api/lib/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const authenticatedReq = req as AuthenticatedRequest;

  const isAuthenticated = await authenticateToken(authenticatedReq);
  if (!isAuthenticated) {
    return res.status(401).json({ message: "Access token required" });
  }

  const authCheck = requireAuth(authenticatedReq);
  if (!authCheck.isAuthenticated) {
    return res.status(401).json({ message: authCheck.error });
  }

  try {
    // folder is [id], so the dynamic param is "id"
    const raw = (req.query as Record<string, string | string[]>)["id"];
    const circleId = Array.isArray(raw) ? raw[0] : raw;

    const proposals = await storage.getProposalsByCircle(circleId as string);
    return res.json(proposals);
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return res.status(500).json({ message: "Failed to fetch proposals" });
  }
}
