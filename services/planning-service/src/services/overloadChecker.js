import { pool } from "../db.js";

// url do user service
const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:4001";

const HEALTHY_LIMIT_MIN = 360;

/**
 * Classifica a carga do dia baseado na taxa de ocupação (ratio):
 *   - ratio < 0.5             → "baixa"   (até metade do limite)
 *   - 0.5 ≤ ratio < 0.85      → "media"   (metade a 85% do limite)
 *   - 0.85 ≤ ratio < 1.0      → "alta"    (perto de estourar — alerta amarelo)
 *   - ratio ≥ 1.0             → "critica" (estourou — sobrecarga real)
 */
export function classifyLoad(ratio) {
  if (ratio < 0.5)  return "baixa";
  if (ratio < 0.85) return "media";
  if (ratio < 1.0)  return "alta";
  return "critica";
}

// calculando quantos min o usuario tem disponiveis em um dia
async function getAvailableMinutes(userId, date) {
  const weekday = date.getDay();
  const url = `${USER_SERVICE_URL}/api/internal/users/${userId}/availability?weekday=${weekday}`;

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("availability fail");
    const data = await r.json();

    // convertendo horario hh:mm para minutos
    const toMin = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    // tempo total acordado no dia
    const awake = toMin(data.sleep_time) - toMin(data.wake_time);

    // tempo total gasto em blocos fixos
    const fixed = data.fixed_blocks.reduce(
      (s, b) => s + (toMin(b.end_time) - toMin(b.start_time)),
      0,
    );

    // retornando o tempo livre, garantindo que ele nunca seja neg
    return Math.max(0, awake - fixed);
  } catch (e) {
    console.warn(
      "[overload] nao foi possivel consultar user-service:",
      e.message,
    );
    return 600; // padrao de 10 horas disponiveis
  }
}

// verificar se um usuario ta sobrecarregado em uma data especifica
export async function checkOverload(userId, scheduledFor) {
  const date =
    scheduledFor instanceof Date ? scheduledFor : new Date(scheduledFor);

  const day = date.toISOString().slice(0, 10);

  // soma dos minutos estimados das tarefas pendentes ou em andamento do usuario para aquele dia
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(estimated_min), 0)::int AS total
     FROM tasks
     WHERE user_id = $1
       AND DATE(scheduled_for) = $2
       AND status IN ('pendente', 'em_andamento')`,
    [userId, day],
  );

  const total = rows[0].total; // total do tempo que ele vai gastar com as tarefas agendadas
  const available = await getAvailableMinutes(userId, date); // tempo livre

  // limite diario de tarefas = o menor entre o tempo livre e o limite saudavel (360 min)
  const limit = Math.min(available, HEALTHY_LIMIT_MIN);

  // taxa de ocupacao (ex: 0.5 = 50%)
  const ratio = limit > 0 ? +(total / limit).toFixed(2) : 0;
  const level = classifyLoad(ratio);

  return {
    overloaded: ratio >= 1.0,    // estourou o limite
    level,                        // "baixa" | "media" | "alta" | "critica"
    total_min: total,
    available_min: available,
    healthy_limit_min: limit,
    ratio,
  };
}