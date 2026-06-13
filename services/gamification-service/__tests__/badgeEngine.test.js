//testes badgeengine
//mocka o pool do db
//ontaskcompleted recebe um bjeto task e atualiza stats e verifica conquistas por queries no bd

import { describe, test, expect, beforeEach, vi } from "vitest";

//o badgeEngine importa { pool } do db.js
vi.mock("../src/db.js", () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from "../src/db.js";
import { onTaskCompleted } from "../src/services/badgeEngine.js";

describe("badgeEngine.onTaskCompleted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    //padrao, retorna lista vazia em qualquer query
    pool.query.mockResolvedValue({ rows: [] });
  });

  test("processa primeira tarefa sem crashar (usuário sem stats)", async () => {
    //sem stats previos todas as queries retornam vazio
    pool.query.mockResolvedValue({ rows: [] });

    await expect(onTaskCompleted({ user_id: "user-1" })).resolves.not.toThrow();
  });

  test("processa tarefa de usuário que já tem stats", async () => {
    //primeira query(busca stats)retorna stats existentes
    pool.query.mockImplementationOnce(() =>
      Promise.resolve({
        rows: [
          {
            total_completed: 5,
            current_streak: 3,
            longest_streak: 7,
            last_activity_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // ontem
          },
        ],
      }),
    );
    //demais queries retornam vazio(sem conquistas a desbloquear)
    pool.query.mockResolvedValue({ rows: [] });

    await expect(onTaskCompleted({ user_id: "user-2" })).resolves.not.toThrow();
  });

  test("chama pool.query pelo menos uma vez (para buscar stats)", async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await onTaskCompleted({ user_id: "user-3" });

    expect(pool.query).toHaveBeenCalled();
  });
});
