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

// Health check
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
    log(`Login error: ${error.message}`);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/api/auth/me', (req, res) => {
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
    
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
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
