import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../../api/lib/cors";
import { authenticateToken, requireAuth, type AuthenticatedRequest } from "../../../api/lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
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

  res.json({
    user: { 
      id: authenticatedReq.user!.id, 
      email: authenticatedReq.user!.email, 
      name: authenticatedReq.user!.name, 
      role: authenticatedReq.user!.role 
    }
  });
}
