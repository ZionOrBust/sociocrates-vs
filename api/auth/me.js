import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Access token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = decoded.user || null;
    if (user) {
      const requiresSetup = user.role === 'admin';
      return res.status(200).json({ user, org: null, requiresSetup });
    }
    // If only userId is present and no embedded user, return minimal shape
    if (decoded.userId) {
      return res.status(200).json({ user: { id: decoded.userId, email: '', name: 'User', role: 'participant' }, org: null, requiresSetup: false });
    }
    return res.status(401).json({ message: 'Invalid token' });
  } catch {
    return res.status(403).json({ message: 'Invalid token' });
  }
}
