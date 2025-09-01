import jwt from "jsonwebtoken";
import type { VercelRequest } from "@vercel/node";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

export interface AuthenticatedRequest extends VercelRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'participant' | 'observer';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export async function authenticateToken(req: AuthenticatedRequest): Promise<boolean> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return false;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return false;
    }
    
    req.user = user;
    return true;
  } catch (error) {
    return false;
  }
}

export function requireAuth(req: AuthenticatedRequest): { isAuthenticated: boolean; error?: string } {
  if (!req.user) {
    return { isAuthenticated: false, error: 'Access token required' };
  }
  return { isAuthenticated: true };
}

export function requireAdmin(req: AuthenticatedRequest): { isAuthorized: boolean; error?: string } {
  const authCheck = requireAuth(req);
  if (!authCheck.isAuthenticated) {
    return { isAuthorized: false, error: authCheck.error };
  }
  
  if (req.user?.role !== 'admin') {
    return { isAuthorized: false, error: 'Admin access required' };
  }
  
  return { isAuthorized: true };
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}
