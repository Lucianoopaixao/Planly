import bcrypt from 'bcrypt'; // hash e comparação de senhas
import { pool } from '../db.js';
import { signToken } from '../utils/jwt.js'; // gerar tokens jwt

const SALT_ROUNDS = 10; // rounds usados para gerar o hash da senha

// colunas padrão de retorno para evitar repetição nas queries
const USER_COLS = 'id, name, email, role, wake_time, sleep_time, notifications_enabled, daily_limit_min, reminder_minutes, created_at';

// registrando um novo user
export async function register(req, res) {
  const { name, email, password, role, wake_time, sleep_time } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email e password são obrigatórios' });
  }

  // validação do tamanho minimo da senha
  if (password.length < 6) {
    return res.status(400).json({ error: 'senha deve ter ao menos 6 caracteres' });
  }

  try {
    // verificando se ja existe um user com aquele email
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rowCount > 0) {
      return res.status(409).json({ error: 'e-mail já cadastrado' });
    }

    // gerando o hash da senha
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    // inserindo usuario no banco
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, wake_time, sleep_time) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING ${USER_COLS}`,
      [name, email, hash, role || 'estudante', wake_time || '07:00', sleep_time || '23:00']
    );

    const user = rows[0];

    // gerando token jwt para autenticação
    const token = signToken({ sub: user.id, email: user.email, name: user.name });

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ error: 'erro ao registrar' });
  }
}

// login
export async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email e password são obrigatórios' });
  }

  try {
    // buscando o usuario pelo email
    const { rows } = await pool.query(
      `SELECT ${USER_COLS}, password_hash FROM users WHERE email = $1`,
      [email]
    );

    // caso o usuario não exista no banco
    if (rows.length === 0) {
      return res.status(401).json({ error: 'credenciais inválidas' });
    }

    const u = rows[0];

    // comparando a senha com o hash armazenado
    const ok = await bcrypt.compare(password, u.password_hash);

    if (!ok) return res.status(401).json({ error: 'credenciais inválidas' });

    // gerando token jwt
    const token = signToken({ sub: u.id, email: u.email, name: u.name });

    // removendo o hash da senha antes de retornar ao cliente
    delete u.password_hash;

    return res.json({ user: u, token });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ error: 'erro ao autenticar' });
  }
}

// retornando dados do usuario autenticado
export async function me(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT ${USER_COLS} FROM users WHERE id = $1`,
      [req.user.sub]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'usuário não encontrado' });

    return res.json(rows[0]);
  } catch (err) {
    console.error('[me]', err);
    return res.status(500).json({ error: 'erro ao buscar perfil' });
  }
}

// atualizando dados do perfil e configurações
export async function updateProfile(req, res) {
  const allowed = ['name', 'email', 'wake_time', 'sleep_time', 'notifications_enabled', 'daily_limit_min', 'reminder_minutes'];
  const sets = [];
  const params = [];

  // filtrando e mapeando apenas as colunas enviadas na requisição
  for (const key of allowed) {
    if (req.body[key] !== undefined && req.body[key] !== null) {
      params.push(req.body[key]);
      sets.push(`${key} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    return res.status(400).json({ error: 'nada para atualizar' });
  }

  // se o e-mail for alterado, verifica conflito com outros usuários
  if (req.body.email !== undefined) {
    const conflict = await pool.query(
      'SELECT 1 FROM users WHERE email = $1 AND id <> $2',
      [req.body.email, req.user.sub]
    );
    if (conflict.rowCount > 0) {
      return res.status(409).json({ error: 'e-mail já está em uso por outra conta' });
    }
  }

  params.push(req.user.sub);

  try {
    // executando a query de atualização dinâmica
    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING ${USER_COLS}`,
      params
    );

    if (rows.length === 0) return res.status(404).json({ error: 'usuário não encontrado' });

    return res.json(rows[0]);
  } catch (err) {
    console.error('[updateProfile]', err);
    return res.status(500).json({ error: 'erro ao atualizar perfil' });
  }
}

// alterando a senha do usuário de forma segura (função nova)
export async function updatePassword(req, res) {
  const { current_password, new_password } = req.body || {};

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'senha atual e nova são obrigatórias' });
  }

  // validação do tamanho mínimo da nova senha
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'nova senha deve ter ao menos 6 caracteres' });
  }

  try {
    // buscando o hash atual do usuário
    const { rows } = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.sub]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'usuário não encontrado' });

    // comparando a senha atual digitada com o hash salvo
    const ok = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'senha atual incorreta' });

    // gerando o hash da nova senha
    const hash = await bcrypt.hash(new_password, SALT_ROUNDS);
    
    // atualizando a senha criptografada no banco
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.sub]);

    return res.json({ ok: true });
  } catch (err) {
    console.error('[updatePassword]', err);
    return res.status(500).json({ error: 'erro ao atualizar senha' });
  }
}