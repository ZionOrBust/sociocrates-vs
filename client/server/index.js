import express from "express";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

const app = express();

// Simple logging
function log(message) {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  console.log(`${timestamp} [express] ${message}`);
}

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple request logging
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    log(`${req.method} ${req.path}`);
  }
  next();
});

// Simple demo data store (in-memory)
const users = [
  { id: '1', email: 'admin@sociocracy.org', password: 'password', name: 'Admin User', role: 'admin' },
  { id: '2', email: 'demo@sociocracy.org', password: 'password', name: 'Demo User', role: 'participant' }
];

// Demo circles data
const circles = [
  {
    id: '1',
    name: 'Main Circle',
    description: 'Primary decision-making circle for our community',
    createdBy: '1',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2', 
    name: 'Housing Circle',
    description: 'Decisions related to housing and infrastructure',
    createdBy: '1',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Demo proposals data
const proposals = [
  {
    id: '1',
    title: 'Community Garden Proposal',
    description: 'Create a shared organic garden space for all residents',
    circleId: '1',
    createdBy: '1',
    status: 'draft',
    currentStep: 'proposal_presentation',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Health check
app.get('/api/ping', (req, res) => {
  try {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    log(`Error in ping: ${error.message}`);
    res.status(500).json({ message: 'Health check failed' });
  }
});

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token
    });
  } catch (error) {
    log(`Error in login: ${error.message}`);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    res.json({
      user: { id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role }
    });
  } catch (error) {
    log(`Error fetching user profile: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

// Circles endpoints
app.get('/api/circles', authenticateToken, (req, res) => {
  try {
    res.json(circles);
  } catch (error) {
    log(`Error fetching circles: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch circles' });
  }
});

app.post('/api/circles', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, description } = req.body;
    const newCircle = {
      id: String(circles.length + 1),
      name,
      description,
      createdBy: req.user.id,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    circles.push(newCircle);
    res.json(newCircle);
  } catch (error) {
    log(`Error creating circle: ${error.message}`);
    res.status(500).json({ message: 'Failed to create circle' });
  }
});

app.get('/api/circles/:id', authenticateToken, (req, res) => {
  try {
    const circle = circles.find(c => c.id === req.params.id);
    if (!circle) {
      return res.status(404).json({ message: 'Circle not found' });
    }
    res.json(circle);
  } catch (error) {
    log(`Error fetching circle: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch circle' });
  }
});

// Proposals endpoints  
app.get('/api/circles/:circleId/proposals', authenticateToken, (req, res) => {
  try {
    const circleProposals = proposals.filter(p => p.circleId === req.params.circleId);
    res.json(circleProposals);
  } catch (error) {
    log(`Error fetching proposals: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch proposals' });
  }
});

app.get('/api/proposals', authenticateToken, (req, res) => {
  try {
    res.json(proposals);
  } catch (error) {
    log(`Error fetching proposals: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch proposals' });
  }
});

app.post('/api/proposals', authenticateToken, (req, res) => {
  try {
    const { title, description, circleId } = req.body;
    const newProposal = {
      id: String(proposals.length + 1),
      title,
      description,
      circleId,
      createdBy: req.user.id,
      status: 'draft',
      currentStep: 'proposal_presentation',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    proposals.push(newProposal);
    res.json(newProposal);
  } catch (error) {
    log(`Error creating proposal: ${error.message}`);
    res.status(500).json({ message: 'Failed to create proposal' });
  }
});

app.get('/api/proposals/:id', authenticateToken, (req, res) => {
  try {
    const proposal = proposals.find(p => p.id === req.params.id);
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    res.json(proposal);
  } catch (error) {
    log(`Error fetching proposal: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch proposal' });
  }
});

// Proposal process endpoints (simplified)
app.get('/api/proposals/:proposalId/questions', authenticateToken, (req, res) => {
  res.json([]); // Return empty array for now
});

app.post('/api/proposals/:proposalId/questions', authenticateToken, (req, res) => {
  const { question } = req.body;
  res.json({ id: '1', proposalId: req.params.proposalId, userId: req.user.id, question, createdAt: new Date().toISOString() });
});

app.get('/api/proposals/:proposalId/reactions', authenticateToken, (req, res) => {
  res.json([]); // Return empty array for now
});

app.post('/api/proposals/:proposalId/reactions', authenticateToken, (req, res) => {
  const { reaction } = req.body;
  res.json({ id: '1', proposalId: req.params.proposalId, userId: req.user.id, reaction, createdAt: new Date().toISOString() });
});

app.get('/api/proposals/:proposalId/objections', authenticateToken, (req, res) => {
  try {
    res.json([]); // Return empty array for now
  } catch (error) {
    log(`Error fetching objections: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch objections' });
  }
});

app.post('/api/proposals/:proposalId/objections', authenticateToken, (req, res) => {
  const { objection, severity } = req.body;
  res.json({ id: '1', proposalId: req.params.proposalId, userId: req.user.id, objection, severity, isResolved: false, createdAt: new Date().toISOString() });
});

app.get('/api/proposals/:proposalId/consent', authenticateToken, (req, res) => {
  res.json([]); // Return empty array for now
});

app.post('/api/proposals/:proposalId/consent', authenticateToken, (req, res) => {
  const { choice, reason } = req.body;
  res.json({ id: '1', proposalId: req.params.proposalId, userId: req.user.id, choice, reason, createdAt: new Date().toISOString() });
});

// Admin endpoints
app.get('/api/admin/users', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    res.json(users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role })));
  } catch (error) {
    log(`Error fetching users: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

app.get('/api/admin/users/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (error) {
    log(`Error fetching user: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

app.put('/api/admin/users/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const userIndex = users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { name, email, role } = req.body;
    users[userIndex] = { ...users[userIndex], name, email, role };
    
    res.json({ id: users[userIndex].id, email: users[userIndex].email, name: users[userIndex].name, role: users[userIndex].role });
  } catch (error) {
    log(`Error updating user: ${error.message}`);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const userIndex = users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    users.splice(userIndex, 1);
    res.json({ message: 'User deleted' });
  } catch (error) {
    log(`Error deleting user: ${error.message}`);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Static file serving for production
const distPath = path.resolve(__dirname, "../dist");
app.use(express.static(distPath));

// Fallback for SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.sendFile(path.join(distPath, "index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  log(`Error: ${err.message}`);
  res.status(500).json({ message: 'Internal server error' });
});

const server = createServer(app);
const port = parseInt(process.env.PORT || '5000', 10);

// Graceful shutdown
const gracefulShutdown = () => {
  log('Shutting down gracefully...');
  server.close(() => {
    log('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    log('Force closing server');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at ${promise}: ${reason}`);
  gracefulShutdown();
});

server.listen(port, '0.0.0.0', () => {
  log(`🏛️ Sociocratic Server running on port ${port}`);
  log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Keep alive ping
setInterval(() => {
  const memUsage = process.memoryUsage();
  log(`Health check - Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
}, 30000);
