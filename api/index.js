import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { nanoid } from 'nanoid';

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
    user_id: 'userId',
    proposal_id: 'proposalId',
    question_id: 'questionId',
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
  // Only strip if a trailing path exists; keep '/' as is
  if (req.url.startsWith('/api/index.js/')) {
    req.url = req.url.slice('/api/index.js'.length);
  } else if (req.url.startsWith('/api/')) {
    req.url = req.url.slice('/api'.length);
  }
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

// Admin: set proposal step explicitly
app.put('/proposals/:id/step', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  try {
    const { step } = req.body;
    const valid = ['proposal_presentation','clarifying_questions','quick_reactions','objections_round','resolve_objections','consent_round','record_outcome'];
    if (!valid.includes(step)) return res.status(400).json({ message: 'Invalid step' });
    const rows = await sql`update proposals set current_step = ${step}, updated_at = now() where id = ${req.params.id} returning *`;
    if (rows.length === 0) return res.status(404).json({ message: 'Proposal not found' });
    res.json(toCamel(rows[0]));
  } catch (err) {
    res.status(500).json({ message: 'Failed to update step' });
  }
});

// Admin: advance to next step in sequence
app.post('/proposals/:id/advance', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  try {
    const seq = ['proposal_presentation','clarifying_questions','quick_reactions','objections_round','resolve_objections','consent_round','record_outcome'];
    const currRows = await sql`select id, current_step from proposals where id = ${req.params.id} limit 1`;
    if (currRows.length === 0) return res.status(404).json({ message: 'Proposal not found' });
    const current = currRows[0].current_step;
    const idx = seq.indexOf(current);
    const next = idx >= 0 && idx < seq.length - 1 ? seq[idx + 1] : seq[seq.length - 1];
    const rows = await sql`update proposals set current_step = ${next}, updated_at = now() where id = ${req.params.id} returning *`;
    res.json(toCamel(rows[0]));
  } catch (err) {
    res.status(500).json({ message: 'Failed to advance step' });
  }
});

// Ensure answers table exists (id text to avoid uuid extension dependency)
async function ensureAnswersTable() {
  try {
    await sql`create table if not exists clarifying_question_answers (
      id text primary key,
      question_id uuid not null references clarifying_questions(id) on delete cascade,
      user_id uuid not null references users(id),
      answer text not null,
      created_at timestamp default now() not null
    )`;
  } catch (e) { /* noop */ }
}
ensureAnswersTable();

// Questions with answers embedded
app.get('/proposals/:proposalId/questions', authenticateToken, async (req, res) => {
  try {
    const qs = await sql`select id, proposal_id, user_id, question, created_at from clarifying_questions where proposal_id = ${req.params.proposalId} order by created_at asc`;
    const questions = qs.map(toCamel);
    if (questions.length === 0) return res.json(questions);
    const ids = questions.map(q => q.id);
    // Neon expands arrays in templates
    const ansRows = await sql`select id, question_id, user_id, answer, created_at from clarifying_question_answers where question_id = any(${ids}::uuid[]) order by created_at asc`.catch(async () => {
      // Fallback per-question if array casting not supported
      const out = [];
      for (const q of questions) {
        const r = await sql`select id, question_id, user_id, answer, created_at from clarifying_question_answers where question_id = ${q.id} order by created_at asc`;
        out.push(...r);
      }
      return out;
    });
    const answers = (ansRows || []).map(toCamel);
    const byQ = new Map();
    for (const a of answers) {
      if (!byQ.has(a.questionId)) byQ.set(a.questionId, []);
      byQ.get(a.questionId).push(a);
    }
    const withAnswers = questions.map(q => ({ ...q, answers: byQ.get(q.id) || [] }));
    res.json(withAnswers);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
});
app.post('/proposals/:proposalId/questions', authenticateToken, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string') return res.status(400).json({ message: 'Question is required' });
    const rows = await sql`insert into clarifying_questions (proposal_id, user_id, question) values (${req.params.proposalId}, ${req.user.id}, ${question}) returning id, proposal_id, user_id, question, created_at`;
    res.json(toCamel(rows[0]));
  } catch (err) {
    res.status(500).json({ message: 'Failed to add question' });
  }
});

// Proposer (or admin) answers a question
app.post('/proposals/:proposalId/questions/:questionId/answers', authenticateToken, async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer || typeof answer !== 'string') return res.status(400).json({ message: 'Answer is required' });
    const rows = await sql`select p.created_by from proposals p join clarifying_questions q on q.id = ${req.params.questionId} and q.proposal_id = p.id limit 1`;
    if (rows.length === 0) return res.status(404).json({ message: 'Question not found' });
    const isOwner = rows[0].created_by === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Only proposer or admin can answer' });
    const id = nanoid(12);
    const inserted = await sql`insert into clarifying_question_answers (id, question_id, user_id, answer) values (${id}, ${req.params.questionId}, ${req.user.id}, ${answer}) returning id, question_id, user_id, answer, created_at`;
    res.json(toCamel(inserted[0]));
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit answer' });
  }
});
app.get('/proposals/:proposalId/reactions', authenticateToken, async (req, res) => {
  try {
    const rows = await sql`select id, proposal_id, user_id, reaction, created_at from quick_reactions where proposal_id = ${req.params.proposalId} order by created_at asc`;
    res.json(rows.map(toCamel));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reactions' });
  }
});
app.post('/proposals/:proposalId/reactions', authenticateToken, async (req, res) => {
  try {
    const { reaction } = req.body;
    if (!reaction || typeof reaction !== 'string' || reaction.length > 300) {
      return res.status(400).json({ message: 'Reaction is required (max 300 chars)' });
    }
    const rows = await sql`insert into quick_reactions (proposal_id, user_id, reaction) values (${req.params.proposalId}, ${req.user.id}, ${reaction}) returning id, proposal_id, user_id, reaction, created_at`;
    res.json(toCamel(rows[0]));
  } catch (err) {
    res.status(500).json({ message: 'Failed to add reaction' });
  }
});
app.get('/proposals/:proposalId/objections', authenticateToken, async (req, res) => {
  try {
    const rows = await sql`select id, proposal_id, user_id, objection, severity, is_resolved, created_at from objections where proposal_id = ${req.params.proposalId} order by created_at asc`;
    res.json(rows.map(toCamel));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch objections' });
  }
});
app.post('/proposals/:proposalId/objections', authenticateToken, async (req, res) => {
  try {
    const { objection, severity } = req.body;
    if (!objection || typeof objection !== 'string') return res.status(400).json({ message: 'Objection is required' });
    const validSev = ['minor_concern','major_concern','deal_breaker'];
    if (!validSev.includes(severity)) return res.status(400).json({ message: 'Invalid severity' });
    const rows = await sql`insert into objections (proposal_id, user_id, objection, severity) values (${req.params.proposalId}, ${req.user.id}, ${objection}, ${severity}) returning id, proposal_id, user_id, objection, severity, is_resolved, created_at`;
    res.json(toCamel(rows[0]));
  } catch (err) {
    res.status(500).json({ message: 'Failed to add objection' });
  }
});
app.get('/proposals/:proposalId/consent', authenticateToken, async (req, res) => {
  try {
    const rows = await sql`select id, proposal_id, user_id, choice, reason, created_at from consent_responses where proposal_id = ${req.params.proposalId} order by created_at asc`;
    res.json(rows.map(toCamel));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch consent responses' });
  }
});
app.post('/proposals/:proposalId/consent', authenticateToken, async (req, res) => {
  try {
    const { choice, reason } = req.body;
    const valid = ['consent','consent_with_reservations','withhold_consent'];
    if (!valid.includes(choice)) return res.status(400).json({ message: 'Invalid choice' });
    const rows = await sql`insert into consent_responses (proposal_id, user_id, choice, reason) values (${req.params.proposalId}, ${req.user.id}, ${choice}, ${reason || null}) returning id, proposal_id, user_id, choice, reason, created_at`;
    res.json(toCamel(rows[0]));
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit consent' });
  }
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
