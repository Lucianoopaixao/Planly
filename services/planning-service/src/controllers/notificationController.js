import { pool } from "../db.js";

/**
 * Helper para criar uma notificação no banco.
 * Pode ser chamado por outros controllers (ex: taskController quando detecta sobrecarga).
 */
export async function createNotification({ userId, kind, title, message, metadata }) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, kind, title, message, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, kind, title, message, metadata, read_at, created_at`,
    [userId, kind, title, message, metadata ? JSON.stringify(metadata) : null],
  );
  return rows[0];
}

// GET /api/notifications — lista as notificações do usuário
export async function listNotifications(req, res) {
  const userId = req.user.sub;
  try {
    const { rows } = await pool.query(
      `SELECT id, kind, title, message, metadata, read_at, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId],
    );
    res.json(rows);
  } catch (err) {
    console.error("[listNotifications]", err);
    res.status(500).json({ error: "erro ao listar notificações" });
  }
}

// POST /api/notifications/:id/read — marca uma como lida
export async function markRead(req, res) {
  const userId = req.user.sub;
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      `UPDATE notifications
       SET read_at = NOW()
       WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
      [id, userId],
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "notificação não encontrada" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[markRead]", err);
    res.status(500).json({ error: "erro ao marcar como lida" });
  }
}

// POST /api/notifications/read-all — marca todas como lidas
export async function markAllRead(req, res) {
  const userId = req.user.sub;
  try {
    await pool.query(
      `UPDATE notifications
       SET read_at = NOW()
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[markAllRead]", err);
    res.status(500).json({ error: "erro ao marcar todas como lidas" });
  }
}

// DELETE /api/notifications/:id — apaga uma notificação
export async function removeNotification(req, res) {
  const userId = req.user.sub;
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: "notificação não encontrada" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[removeNotification]", err);
    res.status(500).json({ error: "erro ao remover notificação" });
  }
}