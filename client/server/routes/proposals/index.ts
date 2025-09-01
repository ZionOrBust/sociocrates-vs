import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../../api/lib/cors";
import { authenticateToken, requireAuth, type AuthenticatedRequest } from "../../../api/lib/auth";
import { storage } from "../../../api/lib/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const authenticatedReq = req as AuthenticatedRequest;
  
  const isAuthenticated = await authenticateToken(authenticatedReq);
  if (!isAuthenticated) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const authCheck = requireAuth(authenticatedReq);
  if (!authCheck.isAuthenticated) {
    return res.status(401).json({ message: authCheck.error });
  }

  try {
    const { title, description, circleId } = req.body;
    const proposal = await storage.createProposal({
      title,
      description,
      circleId,
      createdBy: authenticatedReq.user!.id,
      status: 'draft',
      currentStep: 'proposal_presentation',
      isActive: true
    });
    res.json(proposal);
  } catch (error) {
    console.error('Error creating proposal:', error);
    res.status(500).json({ message: 'Failed to create proposal' });
  }
}
