//configs do db

import pkg from "pg";

const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "planly",
  password: process.env.DB_PASSWORD || "planly",
  database: process.env.DB_NAME || "planly_users",
});

// wait (c retries)
export async function waitForDb(retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query("SELECT 1");
      console.log("[user-service] conectado ao PostgreSQL");
      return;
    } catch (e) {
      console.log(
        `[user-service] aguardando PostgreSQL... (${i + 1}/${retries})`,
      );
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error("PostgreSQL indisponível");
}
