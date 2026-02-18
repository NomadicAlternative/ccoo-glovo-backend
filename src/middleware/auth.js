const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'JWT secret not configured' });
    const payload = jwt.verify(token, secret);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(allowed = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!allowed.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

module.exports = { authMiddleware, requireRole };
