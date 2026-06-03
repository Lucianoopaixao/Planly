//sistema funcional das tarefas
import { pool } from "../db.js";
import { publish } from "../events/publisher.js";
import { checkOverload } from "../services/overloadChecker.js";

//colunas referentes as tasks

const TASK_COLUMNS = `id, user_id, title, description, category, priority, difficulty,
  estimated_min, actual_min, scheduled_for, deadline, status, completed_at, created_at`;

//listas tasks
export async function listTasks(req, res) {
  const userId = req.user.sub;
  const { status, from, to } = req.query;

  const where = ["user_id = $1"];
  const params = [userId];

  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (from) {
    params.push(from);
    where.push(`scheduled_for >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    where.push(`scheduled_for <= $${params.length}`);
  }
  //query p puxar as tarefas

  const sql = `SELECT ${TASK_COLUMNS} FROM tasks
               WHERE ${where.join(" AND ")}
               ORDER BY scheduled_for ASC NULLS LAST, created_at DESC`;
  const { rows } = await pool.query(sql, params);
  res.json(rows);
}

//criar task
export async function createTask(req, res) {
  const userId = req.user.sub;
  //campos necessarios
  const {
    title,
    description,
    category,
    priority,
    difficulty,
    estimated_min,
    scheduled_for,
    deadline,
  } = req.body || {};

  //campos obrigatorios
  if (!title || !estimated_min) {
    return res
      .status(400)
      .json({ error: "title e estimated_min sao obrigatorios" });
  }

  //try p fazer a insercao da task
  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks
        (user_id, title, description, category, priority, difficulty,
         estimated_min, scheduled_for, deadline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING ${TASK_COLUMNS}`,
      //algns valores base
      [
        userId,
        title,
        description || null,
        category || "estudo",
        priority || "media",
        difficulty || "media",
        estimated_min,
        scheduled_for || null,
        deadline || null,
      ],
    );

    const task = rows[0];

    //publica evento
    publish("task.created", { task });

    //verifica sobrecarga se tiver data planejada
    if (task.scheduled_for) {
      try {
        const overload = await checkOverload(userId, task.scheduled_for);
        if (overload.overloaded) {
          const day = (
            task.scheduled_for instanceof Date
              ? task.scheduled_for
              : new Date(task.scheduled_for)
          )
            .toISOString()
            .slice(0, 10);

          await pool.query(
            `INSERT INTO overload_alerts (user_id, alert_date, total_min, available_min)
             VALUES ($1, $2, $3, $4)`,
            [userId, day, overload.total_min, overload.available_min],
          );
          publish("overload.detected", {
            user_id: userId,
            date: day,
            ...overload,
          });
          return res.status(201).json({ task, overload_warning: overload });
        }
      } catch (overloadErr) {
        console.error(
          "[createTask] erro ao verificar sobrecarga:",
          overloadErr.message,
        );
        //nao impede a criacao da tarefa
      }
    }

    res.status(201).json({ task });
  } catch (err) {
    console.error("[createTask]", err);
    res.status(500).json({ error: "erro ao criar tarefa" });
  }
}

//att uma tarefa (vai seguir uma estrutura similar a criacao)
export async function updateTask(req, res) {
  const userId = req.user.sub;
  const { id } = req.params;
  const allowed = [
    "title",
    "description",
    "category",
    "priority",
    "difficulty",
    "estimated_min",
    "actual_min",
    "scheduled_for",
    "deadline",
    "status",
  ];

  const sets = [];
  const params = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      params.push(req.body[k]);
      sets.push(`${k} = $${params.length}`);
    }
  }
  if (sets.length === 0)
    return res.status(400).json({ error: "nada para atualizar" });
  sets.push(`updated_at = NOW()`);

  params.push(id, userId);
  const { rows } = await pool.query(
    `UPDATE tasks SET ${sets.join(", ")}
     WHERE id = $${params.length - 1} AND user_id = $${params.length}
     RETURNING ${TASK_COLUMNS}`,
    params,
  );
  if (rows.length === 0)
    return res.status(404).json({ error: "tarefa nao encontrada" });
  res.json(rows[0]);
}

//completar a task
export async function completeTask(req, res) {
  const userId = req.user.sub;
  const { id } = req.params;
  const { actual_min } = req.body || {};

  const { rows } = await pool.query(
    //status concluida
    `UPDATE tasks SET
       status = 'concluida',
       actual_min = COALESCE($1, actual_min, estimated_min),
       completed_at = NOW(),
       updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING ${TASK_COLUMNS}`,
    [actual_min || null, id, userId],
  );

  if (rows.length === 0)
    return res.status(404).json({ error: "tarefa nao encontrada" });
  const task = rows[0];

  publish("task.completed", { task });

  res.json(task);
}

//deletar uma task
export async function deleteTask(req, res) {
  const userId = req.user.sub;
  const { id } = req.params;
  const result = await pool.query(
    //query p deletar
    "DELETE FROM tasks WHERE id = $1 AND user_id = $2",
    [id, userId],
  );
  if (result.rowCount === 0)
    return res.status(404).json({ error: "tarefa nao encontrada" });
  res.status(204).send();
}

//func p pegar se tem overload
export async function getOverload(req, res) {
  const userId = req.user.sub;
  const date = req.query.date || new Date().toISOString();
  const result = await checkOverload(userId, date);
  res.json(result);
}
