import pkg from 'pg';

const { Pool } = pkg;

// Configuração do pool de conexões com o banco de dados
export const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  user:     process.env.DB_USER     || 'planly',
  password: process.env.DB_PASSWORD || 'planly',
  database: process.env.DB_NAME     || 'planly_planning',
});

/**
 * Aguarda o PostgreSQL estar pronto para receber queries antes de iniciar o app.
 * Evita que o microsserviço quebre se o banco ainda estiver subindo.
 */
export async function waitForDb(retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      // Executa uma query simples de teste para validar a conexão
      await pool.query('SELECT 1');
      console.log('[planning-service] conectado ao PostgreSQL');
      return; // Conectado com sucesso, encerra a função
    } catch (e) {
      console.log(`[planning-service] aguardando PostgreSQL... (${i + 1}/${retries})`);
      // Aguarda 1.5 segundos antes de tentar novamente
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  // Se esgotar as tentativas, lança um erro para derrubar o processo do Node
  throw new Error('PostgreSQL indisponível');
}