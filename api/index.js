import express from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

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

const app = express();

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
// Normalize Vercel /api prefix so '/auth/login' works when called as '/api/auth/login'
app.use((req, _res, next) => {
  if (req.url.startsWith('/api/')) {
    req.url = req.url.slice(4);
  } else if (req.url === '/api') {
    req.url = '/';
  }
  next();
});

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
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth endpoints
app.post('/auth/login', async (req, res) => {
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
    res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/auth/me', authenticateToken, (req, res) => {
  res.json({
    user: { id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role }
  });
});

// Circles endpoints
app.get('/circles', authenticateToken, (req, res) => {
  res.json(circles);
});

app.post('/circles', authenticateToken, (req, res) => {
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
});

app.get('/circles/:id', authenticateToken, (req, res) => {
  const circle = circles.find(c => c.id === req.params.id);
  if (!circle) {
    return res.status(404).json({ message: 'Circle not found' });
  }
  res.json(circle);
});

// Proposals endpoints  
app.get('/circles/:circleId/proposals', authenticateToken, (req, res) => {
  const circleProposals = proposals.filter(p => p.circleId === req.params.circleId);
  res.json(circleProposals);
});

app.get('/proposals', authenticateToken, (req, res) => {
  res.json(proposals);
});

app.post('/proposals', authenticateToken, (req, res) => {
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
});

app.get('/proposals/:id', authenticateToken, (req, res) => {
  const proposal = proposals.find(p => p.id === req.params.id);
  if (!proposal) {
    return res.status(404).json({ message: 'Proposal not found' });
  }
  res.json(proposal);
});

// Proposal process endpoints (simplified)
app.get('/proposals/:proposalId/questions', authenticateToken, (req, res) => {
  res.json([]);
});

app.post('/proposals/:proposalId/questions', authenticateToken, (req, res) => {
  const { question } = req.body;
  res.json({ id: '1', proposalId: req.params.proposalId, userId: req.user.id, question, createdAt: new Date().toISOString() });
});

app.get('/proposals/:proposalId/reactions', authenticateToken, (req, res) => {
  res.json([]);
});

app.post('/proposals/:proposalId/reactions', authenticateToken, (req, res) => {
  const { reaction } = req.body;
  res.json({ id: '1', proposalId: req.params.proposalId, userId: req.user.id, reaction, createdAt: new Date().toISOString() });
});

app.get('/proposals/:proposalId/objections', authenticateToken, (req, res) => {
  res.json([]);
});

app.post('/proposals/:proposalId/objections', authenticateToken, (req, res) => {
  const { objection, severity } = req.body;
  res.json({ id: '1', proposalId: req.params.proposalId, userId: req.user.id, objection, severity, isResolved: false, createdAt: new Date().toISOString() });
});

app.get('/proposals/:proposalId/consent', authenticateToken, (req, res) => {
  res.json([]);
});

app.post('/proposals/:proposalId/consent', authenticateToken, (req, res) => {
  const { choice, reason } = req.body;
  res.json({ id: '1', proposalId: req.params.proposalId, userId: req.user.id, choice, reason, createdAt: new Date().toISOString() });
});

// Admin endpoints
app.get('/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  res.json(users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role })));
});

app.get('/admin/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

app.put('/admin/users/:id', authenticateToken, (req, res) => {
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
});

app.delete('/admin/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const userIndex = users.findIndex(u => u.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  users.splice(userIndex, 1);
  res.json({ message: 'User deleted' });
});

// Catch-all for unknown API routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

export default app;
