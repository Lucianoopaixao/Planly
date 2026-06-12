import { verifyToken } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null; // pega o token do header no formato "Bearer <token>"

  if (!token) return res.status(401).json({ error: 'token ausente' });

  try {
    req.user = verifyToken(token); // sub: userId, email, name
    next();
  } catch (e) {
    return res.status(401).json({ error: 'token inválido' });
  }
}
