import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../../api/lib/cors";
import { authenticateToken, requireAuth, requireAdmin, type AuthenticatedRequest } from "../../../api/lib/auth";
import { storage } from "../../../api/lib/storage";

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

  if (req.method === 'GET') {
    try {
      let circles;
      if (authenticatedReq.user!.role === 'admin') {
        circles = await storage.getAllCircles();
      } else {
        circles = await storage.getUserCircles(authenticatedReq.user!.id);
      }
      res.json(circles);
    } catch (error) {
      console.error('Error fetching circles:', error);
      res.status(500).json({ message: 'Failed to fetch circles' });
    }
  } else if (req.method === 'POST') {
    const adminCheck = requireAdmin(authenticatedReq);
    if (!adminCheck.isAuthorized) {
      return res.status(403).json({ message: adminCheck.error });
    }

    try {
      const { name, description } = req.body;
      const circle = await storage.createCircle({
        name,
        description,
        createdBy: authenticatedReq.user!.id,
        isActive: true
      });
      res.json(circle);
    } catch (error) {
      console.error('Error creating circle:', error);
      res.status(500).json({ message: 'Failed to create circle' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
