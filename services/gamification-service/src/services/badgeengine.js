import { pool } from "../db.js";

//atualiza o progresso qd uma task eh concluida (chamado pelo consumidor de eventos)
export async function onTaskCompleted(task) {
  const userId = task.user_id;

  //att stats agregados
  const today = new Date().toISOString().slice(0, 10);

  const { rows: statsRows } = await pool.query(
    `SELECT total_completed, current_streak, longest_streak, last_activity_date
     FROM user_stats WHERE user_id = $1`,
    [userId],
  );

  let current = 1,
    longest = 1,
    total = 1;
  if (statsRows.length > 0) {
    const s = statsRows[0];
    total = s.total_completed + 1;

    if (s.last_activity_date) {
      //daysbetween p pegar a streak
      const last = s.last_activity_date.toISOString().slice(0, 10);
      const diff = daysBetween(last, today);
      current =
        diff === 0 ? s.current_streak : diff === 1 ? s.current_streak + 1 : 1;
    }
    longest = Math.max(s.longest_streak, current);
  }

  await pool.query(
    `INSERT INTO user_stats (user_id, total_completed, current_streak, longest_streak, last_activity_date, updated_at)
     VALUES ($1,$2,$3,$4,$5, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       total_completed   = EXCLUDED.total_completed,
       current_streak    = EXCLUDED.current_streak,
       longest_streak    = EXCLUDED.longest_streak,
       last_activity_date= EXCLUDED.last_activity_date,
       updated_at        = NOW()`,
    [userId, total, current, longest, today],
  );

  //avaliar cada conquista
  const onTime =
    task.actual_min != null && task.actual_min <= task.estimated_min;
  const earlyHour =
    task.completed_at && new Date(task.completed_at).getHours() < 8;
  const isHard = task.difficulty === "dificil";
  const accurate =
    task.actual_min != null &&
    Math.abs(task.actual_min - task.estimated_min) <= task.estimated_min * 0.1;

  //conquistas do sistema
  await bumpAchievement(userId, "FIRST_STEP", 1);
  await setAchievement(userId, "WEEK_STREAK", current);
  if (onTime) await bumpAchievement(userId, "FOCUS_20", 1);
  if (earlyHour) await bumpAchievement(userId, "EARLY_BIRD", 1);
  if (accurate) await bumpAchievement(userId, "CALIBRATED", 1);
  if (isHard) await bumpAchievement(userId, "TIME_MASTER", 1);
}

async function bumpAchievement(userId, code, delta) {
  await pool.query(
    `INSERT INTO user_achievements (user_id, code, progress)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, code) DO UPDATE SET progress = user_achievements.progress + $3`,
    [userId, code, delta],
  );
  await lockIfReached(userId, code);
}

async function setAchievement(userId, code, value) {
  //set
  await pool.query(
    `INSERT INTO user_achievements (user_id, code, progress)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, code) DO UPDATE SET progress = GREATEST(user_achievements.progress, $3)`,
    [userId, code, value],
  );
  await lockIfReached(userId, code);
}

async function lockIfReached(userId, code) {
  await pool.query(
    //lock se tiver alcancado
    `UPDATE user_achievements ua
     SET unlocked_at = NOW()
     FROM achievements a
     WHERE ua.user_id = $1
       AND ua.code = $2
       AND ua.code = a.code
       AND ua.progress >= a.goal
       AND ua.unlocked_at IS NULL`,
    [userId, code],
  );
}

function daysBetween(a, b) {
  //distancia em dias
  const ms = new Date(b) - new Date(a);
  return Math.floor(ms / 86400000);
}
