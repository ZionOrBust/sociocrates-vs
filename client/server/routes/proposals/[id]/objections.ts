import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../../../api/lib/cors";
import { authenticateToken, requireAuth, type AuthenticatedRequest } from "../../../../api/lib/auth";
import { storage } from "../../../../api/lib/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const authenticatedReq = req as AuthenticatedRequest;
  
  const isAuthenticated = await authenticateToken(authenticatedReq);
  if (!isAuthenticated) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const authCheck = requireAuth(authenticatedReq);
  if (!authCheck.isAuthenticated) {
    return res.status(401).json({ message: authCheck.error });
  }

  const { proposalId } = req.query;

  if (req.method === 'GET') {
    try {
      const objections = await storage.getObjections(proposalId as string);
      res.json(objections);
    } catch (error) {
      console.error('Error fetching objections:', error);
      res.status(500).json({ message: 'Failed to fetch objections' });
    }
  } else if (req.method === 'POST') {
    try {
      const { objection, severity } = req.body;
      const objectionData = await storage.addObjection({
        proposalId: proposalId as string,
        userId: authenticatedReq.user!.id,
        objection,
        severity,
        isResolved: false
      });
      res.json(objectionData);
    } catch (error) {
      console.error('Error adding objection:', error);
      res.status(500).json({ message: 'Failed to add objection' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
