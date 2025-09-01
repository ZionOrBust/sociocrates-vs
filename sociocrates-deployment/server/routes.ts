import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

// Middleware to verify JWT token
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name, role = 'participant' } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      const user = await storage.createUser({
        email,
        password,
        name,
        role,
        isActive: true
      });
      
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.validateUser(email, password);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });
  
  app.get('/api/auth/me', authenticateToken, async (req, res) => {
    res.json({
      user: { 
        id: req.user!.id, 
        email: req.user!.email, 
        name: req.user!.name, 
        role: req.user!.role 
      }
    });
  });
  
  // Circle routes
  app.get('/api/circles', authenticateToken, async (req, res) => {
    try {
      let circles;
      if (req.user!.role === 'admin') {
        circles = await storage.getAllCircles();
      } else {
        circles = await storage.getUserCircles(req.user!.id);
      }
      res.json(circles);
    } catch (error) {
      console.error('Error fetching circles:', error);
      res.status(500).json({ message: 'Failed to fetch circles' });
    }
  });
  
  app.post('/api/circles', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { name, description } = req.body;
      const circle = await storage.createCircle({
        name,
        description,
        createdBy: req.user!.id,
        isActive: true
      });
      res.json(circle);
    } catch (error) {
      console.error('Error creating circle:', error);
      res.status(500).json({ message: 'Failed to create circle' });
    }
  });
  
  app.get('/api/circles/:id', authenticateToken, async (req, res) => {
    try {
      const circle = await storage.getCircleById(req.params.id);
      if (!circle) {
        return res.status(404).json({ message: 'Circle not found' });
      }
      res.json(circle);
    } catch (error) {
      console.error('Error fetching circle:', error);
      res.status(500).json({ message: 'Failed to fetch circle' });
    }
  });
  
  // Proposal routes
  app.get('/api/circles/:circleId/proposals', authenticateToken, async (req, res) => {
    try {
      const proposals = await storage.getProposalsByCircle(req.params.circleId);
      res.json(proposals);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      res.status(500).json({ message: 'Failed to fetch proposals' });
    }
  });
  
  app.post('/api/proposals', authenticateToken, async (req, res) => {
    try {
      const { title, description, circleId } = req.body;
      const proposal = await storage.createProposal({
        title,
        description,
        circleId,
        createdBy: req.user!.id,
        status: 'draft',
        currentStep: 'proposal_presentation',
        isActive: true
      });
      res.json(proposal);
    } catch (error) {
      console.error('Error creating proposal:', error);
      res.status(500).json({ message: 'Failed to create proposal' });
    }
  });
  
  app.get('/api/proposals/:id', authenticateToken, async (req, res) => {
    try {
      const proposal = await storage.getProposalById(req.params.id);
      if (!proposal) {
        return res.status(404).json({ message: 'Proposal not found' });
      }
      res.json(proposal);
    } catch (error) {
      console.error('Error fetching proposal:', error);
      res.status(500).json({ message: 'Failed to fetch proposal' });
    }
  });
  
  app.put('/api/proposals/:id', authenticateToken, async (req, res) => {
    try {
      const proposal = await storage.updateProposal(req.params.id, req.body);
      if (!proposal) {
        return res.status(404).json({ message: 'Proposal not found' });
      }
      res.json(proposal);
    } catch (error) {
      console.error('Error updating proposal:', error);
      res.status(500).json({ message: 'Failed to update proposal' });
    }
  });
  
  // Process step routes
  app.post('/api/proposals/:proposalId/questions', authenticateToken, async (req, res) => {
    try {
      const { question } = req.body;
      const questionData = await storage.addClarifyingQuestion({
        proposalId: req.params.proposalId,
        userId: req.user!.id,
        question
      });
      res.json(questionData);
    } catch (error) {
      console.error('Error adding question:', error);
      res.status(500).json({ message: 'Failed to add question' });
    }
  });
  
  app.get('/api/proposals/:proposalId/questions', authenticateToken, async (req, res) => {
    try {
      const questions = await storage.getClarifyingQuestions(req.params.proposalId);
      res.json(questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ message: 'Failed to fetch questions' });
    }
  });
  
  app.post('/api/proposals/:proposalId/reactions', authenticateToken, async (req, res) => {
    try {
      const { reaction } = req.body;
      const reactionData = await storage.addQuickReaction({
        proposalId: req.params.proposalId,
        userId: req.user!.id,
        reaction
      });
      res.json(reactionData);
    } catch (error) {
      console.error('Error adding reaction:', error);
      res.status(500).json({ message: 'Failed to add reaction' });
    }
  });
  
  app.get('/api/proposals/:proposalId/reactions', authenticateToken, async (req, res) => {
    try {
      const reactions = await storage.getQuickReactions(req.params.proposalId);
      res.json(reactions);
    } catch (error) {
      console.error('Error fetching reactions:', error);
      res.status(500).json({ message: 'Failed to fetch reactions' });
    }
  });
  
  app.post('/api/proposals/:proposalId/objections', authenticateToken, async (req, res) => {
    try {
      const { objection, severity } = req.body;
      const objectionData = await storage.addObjection({
        proposalId: req.params.proposalId,
        userId: req.user!.id,
        objection,
        severity,
        isResolved: false
      });
      res.json(objectionData);
    } catch (error) {
      console.error('Error adding objection:', error);
      res.status(500).json({ message: 'Failed to add objection' });
    }
  });
  
  app.get('/api/proposals/:proposalId/objections', authenticateToken, async (req, res) => {
    try {
      const objections = await storage.getObjections(req.params.proposalId);
      res.json(objections);
    } catch (error) {
      console.error('Error fetching objections:', error);
      res.status(500).json({ message: 'Failed to fetch objections' });
    }
  });
  
  app.post('/api/proposals/:proposalId/consent', authenticateToken, async (req, res) => {
    try {
      const { choice, reason } = req.body;
      const consentData = await storage.addConsentResponse({
        proposalId: req.params.proposalId,
        userId: req.user!.id,
        choice,
        reason
      });
      res.json(consentData);
    } catch (error) {
      console.error('Error adding consent response:', error);
      res.status(500).json({ message: 'Failed to add consent response' });
    }
  });
  
  app.get('/api/proposals/:proposalId/consent', authenticateToken, async (req, res) => {
    try {
      const responses = await storage.getConsentResponses(req.params.proposalId);
      res.json(responses);
    } catch (error) {
      console.error('Error fetching consent responses:', error);
      res.status(500).json({ message: 'Failed to fetch consent responses' });
    }
  });
  
  // Admin routes
  app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
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
  });
  
  app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { role, isActive } = req.body;
      const user = await storage.updateUser(req.params.id, { role, isActive });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
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
  }
}
