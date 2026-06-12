import jwt from 'jsonwebtoken';
import { Router } from 'express';
import { pool } from '../db.js';

const SECRET = process.env.JWT_SECRET || 'planly-dev-secret-change-in-prod';

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'token ausente' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { return res.status(401).json({ error: 'token inválido' }); }
}

const router = Router();
router.use(requireAuth);

// Lista todas as conquistas com o progresso do usuário atual
router.get('/achievements', async (req, res) => {
  const userId = req.user.sub;
  const { rows } = await pool.query(
    `SELECT a.code, a.name, a.description, a.icon, a.rarity, a.goal, a.metric,
            COALESCE(ua.progress, 0) AS progress,
            ua.unlocked_at
     FROM achievements a
     LEFT JOIN user_achievements ua
       ON ua.code = a.code AND ua.user_id = $1
     ORDER BY a.rarity, a.code`,
    [userId]
  );
  res.json(rows.map(r => ({
    ...r,
    unlocked: !!r.unlocked_at,
  })));
});

// Estatísticas agregadas do usuário
router.get('/stats', async (req, res) => {
  const userId = req.user.sub;
  const { rows } = await pool.query(
    `SELECT total_completed, current_streak, longest_streak, last_activity_date
     FROM user_stats WHERE user_id = $1`,
    [userId]
  );
  const stats = rows[0] || { total_completed: 0, current_streak: 0, longest_streak: 0, last_activity_date: null };

  const { rows: cnt } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE unlocked_at IS NOT NULL)::int AS unlocked,
       (SELECT COUNT(*) FROM achievements)::int AS total
     FROM user_achievements WHERE user_id = $1`,
    [userId]
  );

  res.json({
    ...stats,
    achievements_unlocked: cnt[0].unlocked,
    achievements_total:    cnt[0].total,
  });
});

export default router;
