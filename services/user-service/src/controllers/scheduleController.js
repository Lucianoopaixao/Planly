// conectando com banco de dados
import { pool } from '../db.js';

// lista os blocos fixos do usuario, ordenados por dia da semana e hora
export async function listFixed(req, res) {
  const { rows } = await pool.query(
    `SELECT id, label, weekday, start_time, end_time, kind
     FROM fixed_blocks WHERE user_id = $1 ORDER BY weekday, start_time`,
    [req.user.sub] // vem do token de autenticação, pra poder filtrar pelo id do usuário

  );

  res.json(rows); // array dos blocos
}

// cria um novo bloco fixo atrelado ao usuario
export async function createFixed(req, res) {
  const { label, weekday, start_time, end_time, kind } = req.body || {};

  // valida os campos obrigatórios
  if (!label || weekday == null || !start_time || !end_time) {
    return res.status(400).json({ error: 'campos obrigatórios faltando' });
  }

  const { rows } = await pool.query(

    // inserindo e retornando os dados
    `INSERT INTO fixed_blocks (user_id, label, weekday, start_time, end_time, kind)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, label, weekday, start_time, end_time, kind`,
    [req.user.sub, label, weekday, start_time, end_time, kind || 'fixed']
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
    'DELETE FROM fixed_blocks WHERE id = $1 AND user_id = $2',
    [id, req.user.sub]
  );

  if (result.rowCount === 0) return res.status(404).json({ error: 'não encontrado' });

  // status 204 = "No Content"
  res.status(204).send();
}