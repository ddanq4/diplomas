import jwt from 'jsonwebtoken';

const JWT = process.env.JWT_SECRET || 'dev_secret_replace_me';

export function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const m = hdr.match(/^Bearer\s+(.+)/i);
  if (!m) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  try {
    req.user = jwt.verify(m[1], JWT);
    return next();
  } catch {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ status: 'error', message: 'Forbidden' });
  return next();
}
