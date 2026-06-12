//basicamente a msm coisa do auth do user-service, que foi escrito primeiro, e tbm por mim

import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'planly-dev-secret-change-in-prod';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'token ausente' });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'token inválido' });
  }
}
