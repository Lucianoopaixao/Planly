import pkg from "pg";

const { Pool } = pkg;

//conexao unica usando a DATABASE_URL do Supabase
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, //supabase exige SSL
});

//sempre que uma nova conexao for criada define o schema padrao SELECT * FROM users encontra users.users automaticamente
pool.on("connect", (client) => {
  client.query("SET search_path TO users, public");
});

export async function waitForDb(retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query("SELECT 1");
      console.log("[user-service] conectado ao Supabase");
      return;
    } catch (e) {
      console.log(`[user-service] aguardando banco... (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error("Banco indisponivel");
}
