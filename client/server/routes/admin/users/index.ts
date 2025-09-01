import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../../_lib/cors";
import { authenticateToken, requireAdmin, type AuthenticatedRequest } from "../../_lib/auth";
import { storage } from "../../_lib/storage";

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

  const adminCheck = requireAdmin(authenticatedReq);
  if (!adminCheck.isAuthorized) {
    return res.status(403).json({ message: adminCheck.error });
  }

  try {
    const users = await storage.getAllUsers();
    // Remove passwords from response
    const safeUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    res.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
}
