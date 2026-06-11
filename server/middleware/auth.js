import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'eccp-2026-secure-jwt-key-change-in-production';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, pf_number: user.pf_number },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export { JWT_SECRET };
