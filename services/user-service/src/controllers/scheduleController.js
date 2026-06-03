// conectando com banco de dados
import { pool } from "../db.js";

// lista os blocos fixos do usuario, ordenados por dia da semana e hora
export async function listFixed(req, res) {
  const { rows } = await pool.query(
    `SELECT id, label, weekday, start_time, end_time, kind
     FROM fixed_blocks WHERE user_id = $1 ORDER BY weekday, start_time`,
    [req.user.sub], // vem do token de autenticação, pra poder filtrar pelo id do usuário
  );

  res.json(rows); // array dos blocos
}

// cria um novo bloco fixo atrelado ao usuario
export async function createFixed(req, res) {
  const { label, weekday, start_time, end_time, kind } = req.body || {};

  // valida os campos obrigatórios
  if (!label || weekday == null || !start_time || !end_time) {
    return res.status(400).json({ error: "campos obrigatórios faltando" });
  }

  const { rows } = await pool.query(
    // inserindo e retornando os dados
    `INSERT INTO fixed_blocks (user_id, label, weekday, start_time, end_time, kind)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, label, weekday, start_time, end_time, kind`,
    [req.user.sub, label, weekday, start_time, end_time, kind || "fixed"],
    // se o campo "kind" nao for enviado, "fixed" é usado como valor padrão
  );

  // status 201 = "Created"
  res.status(201).json(rows[0]);
}

// deleta um bloco
export async function deleteFixed(req, res) {
  const { id } = req.params; // capturando o id da rota

  const result = await pool.query(
    // o 'AND user_id = $2' evita que um usuário delete registros de outro
    "DELETE FROM fixed_blocks WHERE id = $1 AND user_id = $2",
    [id, req.user.sub],
  );

  if (result.rowCount === 0)
    return res.status(404).json({ error: "não encontrado" });

  // status 204 = "No Content"
  res.status(204).send();
}

//endpoint interno q vai ser consumido pelo planning-service

//quanto tempo o user tem realmente livre na semana
export async function availabilityForDay(req, res) {
  const userId = req.params.userId;
  const weekday = Number(req.query.weekday); //dia da semana
  if (Number.isNaN(weekday))
    return res.status(400).json({ error: "weekday invalido" });

  //query pra pegar os times do user
  const userResult = await pool.query(
    "SELECT wake_time, sleep_time FROM users WHERE id = $1",
    [userId],
  );
  if (userResult.rowCount === 0)
    return res.status(404).json({ error: "usuario nao encontrado" });

  //query p puxar do fixed_blocs o start, end time e label
  const fixedResult = await pool.query(
    `SELECT start_time, end_time, label FROM fixed_blocks
     WHERE user_id = $1 AND weekday = $2 ORDER BY start_time`,
    [userId, weekday],
  );

  //res em json
  res.json({
    wake_time: userResult.rows[0].wake_time,
    sleep_time: userResult.rows[0].sleep_time,
    fixed_blocks: fixedResult.rows,
  });
}
