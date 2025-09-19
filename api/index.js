import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const sql = neon(process.env.DATABASE_URL);

const app = express();

function toCamel(row) {
  if (!row) return row;
  const map = {
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    circle_id: 'circleId',
    created_by: 'createdBy',
    current_step: 'currentStep',
    step_start_time: 'stepStartTime',
    step_end_time: 'stepEndTime',
    is_active: 'isActive',
  };
  const out = {};
  for (const k of Object.keys(row)) out[map[k] || k] = row[k];
  return out;
}

async function getUserByEmail(email) {
  const rows = await sql`select id, email, name, role from users where email = ${email} limit 1`;
  return rows[0] || null;
}

async function getUserWithPassword(email) {
  const rows = await sql`select id, email, name, role, password from users where email = ${email} limit 1`;
  return rows[0] || null;
}

async function createUser({ email, password, name, role = 'participant' }) {
  const hash = await bcrypt.hash(password, 10);
  const rows = await sql`insert into users (email, password, name, role) values (${email}, ${hash}, ${name}, ${role}) returning id, email, name, role`;
  return rows[0];
}

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
// Deployment boot time marker for diagnostics
const BOOT_TIME = new Date().toISOString();
// Expose boot time in response header to confirm new deploy
app.use((req, res, next) => { res.setHeader('X-App-Revision', BOOT_TIME); next(); });
// Normalize Vercel prefix so '/api/...'(rewrite) and '/api/index.js/...'(dest) map to our Express routes
app.use((req, _res, next) => {
  const stripPrefix = (url, prefix) => (url.startsWith(prefix) ? url.slice(prefix.length) || '/' : null);
  let newUrl = stripPrefix(req.url, '/api/index.js') || stripPrefix(req.url, '/api');
  if (newUrl) req.url = newUrl;
  next();
});

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const rows = await sql`select id, email, name, role from users where id = ${decoded.userId} limit 1`;
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Health check
app.get('/ping', async (_req, res) => {
  try {
    const rows = await sql`select 1 as ok`;
    const dbOk = rows && rows[0] && rows[0].ok === 1;
    res.json({ status: 'ok', db: dbOk ? 'ok' : 'error', timestamp: new Date().toISOString() });
  } catch (e) {
    res.json({ status: 'ok', db: 'error', error: 'db_unreachable', timestamp: new Date().toISOString() });
  }
});

// Auth endpoints
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const existing = await getUserByEmail(email);
    if (existing) return res.status(400).json({ message: 'User already exists' });
    const user = await createUser({ email, password, name, role: 'participant' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Auto-provision demo users
    const demoUsers = {
      'admin@sociocracy.org': { name: 'Admin User', role: 'admin' },
      'demo@sociocracy.org': { name: 'Demo User', role: 'participant' },
    };

    let user = await getUserWithPassword(email);
    if (!user && demoUsers[email]) {
      user = await createUser({ email, password: 'password', name: demoUsers[email].name, role: demoUsers[email].role });
      user.password = await bcrypt.hash('password', 10); // not used after
    }

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Circles endpoints
app.get('/circles', authenticateToken, async (req, res) => {
  try {
    const rows = await sql`select id, name, description, created_by, is_active, created_at, updated_at from circles order by name`;
    const data = rows.map(toCamel);
    // Seed defaults if empty
    if (data.length === 0 && req.user.role === 'admin') {
      await sql`insert into circles (name, description, created_by, is_active) values ('Main Circle', 'Primary decision-making circle for our community', ${req.user.id}, true), ('Housing Circle', 'Decisions related to housing and infrastructure', ${req.user.id}, true)`;
      const seeded = await sql`select id, name, description, created_by, is_active, created_at, updated_at from circles order by name`;
      return res.json(seeded.map(toCamel));
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch circles' });
  }
});

app.post('/circles', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  try {
    const { name, description } = req.body;
    const rows = await sql`insert into circles (name, description, created_by, is_active) values (${name}, ${description}, ${req.user.id}, true) returning id, name, description, created_by, is_active, created_at, updated_at`;
    res.json(toCamel(rows[0]));
  } catch (err) {
    res.status(500).json({ message: 'Failed to create circle' });
  }
});

app.get('/circles/:id', authenticateToken, async (req, res) => {
  try {
    const rows = await sql`select id, name, description, created_by, is_active, created_at, updated_at from circles where id = ${req.params.id} limit 1`;
    const circle = rows[0];
    if (!circle) return res.status(404).json({ message: 'Circle not found' });
    res.json(toCamel(circle));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch circle' });
  }
});

// Proposals endpoints
app.get('/circles/:circleId/proposals', authenticateToken, async (req, res) => {
  try {
    const rows = await sql`select * from proposals where circle_id = ${req.params.circleId} order by created_at desc`;
    res.json(rows.map(toCamel));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch proposals' });
  }
});

app.get('/proposals', authenticateToken, async (req, res) => {
  try {
    const rows = await sql`select * from proposals order by created_at desc`;
    res.json(rows.map(toCamel));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch proposals' });
  }
});

app.post('/proposals', authenticateToken, async (req, res) => {
  try {
    const { title, description, circleId } = req.body;
    const rows = await sql`insert into proposals (title, description, circle_id, created_by, status, current_step, is_active) values (${title}, ${description}, ${circleId}, ${req.user.id}, 'draft', 'proposal_presentation', true) returning *`;
    res.json(toCamel(rows[0]));
  } catch (err) {
    res.status(500).json({ message: 'Failed to create proposal' });
  }
});

app.get('/proposals/:id', authenticateToken, async (req, res) => {
  try {
    const rows = await sql`select * from proposals where id = ${req.params.id} limit 1`;
    const proposal = rows[0];
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    res.json(toCamel(proposal));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch proposal' });
  }
});

// Proposal process endpoints (simplified stubs for now)
app.get('/proposals/:proposalId/questions', authenticateToken, (_req, res) => res.json([]));
app.post('/proposals/:proposalId/questions', authenticateToken, (req, res) => {
  const { question } = req.body; res.json({ id: '1', proposalId: req.params.proposalId, userId: req.user.id, question, createdAt: new Date().toISOString() });
});
app.get('/proposals/:proposalId/reactions', authenticateToken, (_req, res) => res.json([]));
app.post('/proposals/:proposalId/reactions', authenticateToken, (req, res) => {
  const { reaction } = req.body; res.json({ id: '1', proposalId: req.params.proposalId, userId: req.user.id, reaction, createdAt: new Date().toISOString() });
});
app.get('/proposals/:proposalId/objections', authenticateToken, (_req, res) => res.json([]));
app.post('/proposals/:proposalId/objections', authenticateToken, (req, res) => {
  const { objection, severity } = req.body; res.json({ id: '1', proposalId: req.params.proposalId, userId: req.user.id, objection, severity, isResolved: false, createdAt: new Date().toISOString() });
});
app.get('/proposals/:proposalId/consent', authenticateToken, (_req, res) => res.json([]));
app.post('/proposals/:proposalId/consent', authenticateToken, (req, res) => {
  const { choice, reason } = req.body; res.json({ id: '1', proposalId: req.params.proposalId, userId: req.user.id, choice, reason, createdAt: new Date().toISOString() });
});

// Admin users (read-only list from DB)
app.get('/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  try {
    const rows = await sql`select id, email, name, role from users order by email`;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Catch-all for unknown API routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

export default app;
