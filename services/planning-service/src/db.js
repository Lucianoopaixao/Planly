import pkg from "pg";

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

//o planning precisa enxergar tanto seu proprio schema quanto o de users
pool.on("connect", (client) => {
  client.query("SET search_path TO planning, users, public");
});

export async function waitForDb(retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query("SELECT 1");
      console.log("[planning-service] conectado ao Supabase");
      return;
    } catch (e) {
      console.log(
        `[planning-service] aguardando banco... (${i + 1}/${retries})`,
      );
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error("Banco indisponivel");
}
