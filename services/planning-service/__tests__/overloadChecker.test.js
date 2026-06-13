//testes do overloadchecker, mocka pool do db e fetch do user-service
// a funcao tem assinatura (checkoverload(userid,scheduledfor)) (scheduledfor é uma date ou string iso)

import { describe, test, expect, beforeEach, vi } from "vitest";

//mock global do fetch
global.fetch = vi.fn();

//mock do modulo de banco
vi.mock("../src/db.js", () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from "../src/db.js";
import { checkOverload } from "../src/services/overloadChecker.js";

describe("overloadChecker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("retorna estrutura correta quando há disponibilidade", async () => {
    //user service responde com horarios
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        wake_time: "07:00",
        sleep_time: "23:00",
        fixed_blocks: [{ start_time: "08:00", end_time: "12:00" }],
      }),
    });

    //tarefas ja agendadas somam 180
    pool.query.mockResolvedValueOnce({ rows: [{ total: 180 }] });

    const result = await checkOverload(
      "user-1",
      new Date("2026-06-13T10:00:00Z"),
    );

    expect(result).toBeDefined();
    expect(typeof result.overloaded).toBe("boolean");
  });

  test("detecta sobrecarga quando soma ultrapassa limite saudável", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        wake_time: "08:00",
        sleep_time: "22:00",
        fixed_blocks: [
          { start_time: "08:00", end_time: "16:00" }, // 8h de bloco fixo
        ],
      }),
    });

    //500 min agendado (q ja passa do saudavel )
    pool.query.mockResolvedValueOnce({ rows: [{ total: 500 }] });

    const result = await checkOverload(
      "user-1",
      new Date("2026-06-13T10:00:00Z"),
    );

    expect(result.overloaded).toBe(true);
  });

  test("aceita string ISO no scheduledFor", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        wake_time: "07:00",
        sleep_time: "23:00",
        fixed_blocks: [],
      }),
    });

    pool.query.mockResolvedValueOnce({ rows: [{ total: 0 }] });

    //passando string ao inves de date
    const result = await checkOverload("user-1", "2026-06-13T10:00:00Z");

    expect(result).toBeDefined();
    expect(result.overloaded).toBe(false);
  });

  test("lida com fetch falhando (fallback para 600min disponíveis)", async () => {
    global.fetch.mockRejectedValueOnce(new Error("user-service down"));
    pool.query.mockResolvedValueOnce({ rows: [{ total: 100 }] });

    const result = await checkOverload(
      "user-1",
      new Date("2026-06-13T10:00:00Z"),
    );

    expect(result).toBeDefined();
    //fallback de 600 min e 100 min agendado
    expect(result.overloaded).toBe(false);
  });
});
