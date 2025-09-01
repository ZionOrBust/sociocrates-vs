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
      const responses = await storage.getConsentResponses(id);
      return res.json(responses);
    } catch (error) {
      console.error("Error fetching consent responses:", error);
      return res.status(500).json({ message: "Failed to fetch consent responses" });
    }
  }

  if (req.method === "POST") {
    try {
      const { choice, reason } = (req.body ?? {}) as { choice?: string; reason?: string };
      if (!choice) {
        return res.status(400).json({ message: "Missing 'choice' in request body" });
      }
      const consentData = await storage.addConsentResponse({
        id,
        userId: authenticatedReq.user!.id,
        choice,
        reason,
      });
      return res.json(consentData);
    } catch (error) {
      console.error("Error adding consent response:", error);
      return res.status(500).json({ message: "Failed to add consent response" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ message: "Method not allowed" });
}
