import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../../../api/lib/cors";
import { authenticateToken, requireAuth, type AuthenticatedRequest } from "../../../../api/lib/auth";
import { storage } from "../../../../api/lib/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const authenticatedReq = req as AuthenticatedRequest;

  const isAuthenticated = await authenticateToken(authenticatedReq);
  if (!isAuthenticated) {
    return res.status(401).json({ message: "Access token required" });
  }

  const authCheck = requireAuth(authenticatedReq);
  if (!authCheck.isAuthenticated) {
    return res.status(401).json({ message: authCheck.error });
  }

  // Folder is [id], so the dynamic param is "id"
  const raw = (req.query as Record<string, string | string[]>)["id"];
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id) {
    return res.status(400).json({ message: "Missing proposal id" });
  }

  if (req.method === "GET") {
    try {
      // If your storage method is named differently, swap it here.
      const proposal = await storage.getProposalById(id);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      return res.json(proposal);
    } catch (error) {
      console.error("Error fetching proposal:", error);
      return res.status(500).json({ message: "Failed to fetch proposal" });
    }
  }

  res.setHeader("Allow", "GET");
  return res.status(405).json({ message: "Method not allowed" });
}
