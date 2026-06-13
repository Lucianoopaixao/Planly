/**
 * Smoke test E2E — testa o fluxo completo do Planly via HTTP.
 * Roda contra os microsserviços de verdade (docker compose up rodando).
 *
 * Uso: node tests/e2e/smoke.js
 */

const USER_API = process.env.USER_API || 'http://localhost:4001';
const PLAN_API = process.env.PLAN_API || 'http://localhost:4002';
const GAME_API = process.env.GAME_API || 'http://localhost:4003';
const ANLY_API = process.env.ANLY_API || 'http://localhost:4004';

let passed = 0;
let failed = 0;

// ─── Helpers ──────────────────────────────────────────────────────
const c = {
  green: '\x1b[32m', red: '\x1b[31m', gold: '\x1b[33m',
  bold: '\x1b[1m', reset: '\x1b[0m', dim: '\x1b[2m'
};

function log(symbol, color, text) {
  console.log(`  ${color}${symbol}${c.reset} ${text}`);
}

async function step(description, fn) {
  try {
    await fn();
    log('✓', c.green, description);
    passed++;
  } catch (err) {
    log('✗', c.red, `${description}\n     ${c.dim}${err.message}${c.reset}`);
    failed++;
    throw err;
  }
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const body = res.status === 204 ? null : await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${url} → ${res.status} ${JSON.stringify(body)}`);
  }
  return body;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ─── Fluxo do teste ───────────────────────────────────────────────
async function run() {
  console.log(`\n${c.bold}🧪  Planly — Smoke Test E2E${c.reset}\n`);

  const email = `e2e-${Date.now()}@planly.app`;
  const senha = 'senhaSegura123';
  let token, taskId;

  // ─── 1. CADASTRO ─────────────────────────────────────────────────
  console.log(`${c.gold}1. Cadastro e autenticação${c.reset}`);

  await step('Health check do user-service', async () => {
    const res = await fetch(`${USER_API}/health`);
    assert(res.ok, 'user-service não respondeu /health');
  });

  await step('Registrar novo usuário', async () => {
    const data = await request(`${USER_API}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'E2E Tester',
        email,
        password: senha,
        wake_time: '07:00',
        sleep_time: '23:00'
      })
    });
    assert(data.token, 'token não retornado no registro');
    token = data.token;
  });

  await step('Fazer login com a conta criada', async () => {
    const data = await request(`${USER_API}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password: senha })
    });
    assert(data.token, 'token não retornado no login');
    token = data.token;
  });

  await step('Buscar perfil em /me', async () => {
    const data = await request(`${USER_API}/api/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(data.email === email, 'email não confere');
  });

  // ─── 2. HORÁRIOS FIXOS ───────────────────────────────────────────
  console.log(`\n${c.gold}2. Horários fixos${c.reset}`);

  await step('Criar horário fixo (aulas)', async () => {
    await request(`${USER_API}/api/fixed-blocks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        label: 'Aulas E2E',
        weekday: 1,
        start_time: '08:00',
        end_time: '12:00'
      })
    });
  });

  await step('Listar horários fixos', async () => {
    const blocks = await request(`${USER_API}/api/fixed-blocks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(Array.isArray(blocks), 'resposta não é array');
    assert(blocks.length > 0, 'nenhum bloco retornado');
  });

  // ─── 3. TAREFAS ──────────────────────────────────────────────────
  console.log(`\n${c.gold}3. Tarefas${c.reset}`);

  await step('Criar tarefa de estudo', async () => {
    const data = await request(`${PLAN_API}/api/tasks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Estudar para a prova de Cálculo',
        priority: 'alta',
        difficulty: 'dificil',
        estimated_min: 90,
        category: 'estudo',
        scheduled_for: new Date().toISOString()
      })
    });
    assert(data.task?.id, 'tarefa não retornou id');
    taskId = data.task.id;
  });

  await step('Listar tarefas do usuário', async () => {
    const tasks = await request(`${PLAN_API}/api/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(tasks.length > 0, 'nenhuma tarefa encontrada');
  });

  await step('Concluir a tarefa criada', async () => {
    const data = await request(`${PLAN_API}/api/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ actual_min: 105 })
    });
    assert(data.task?.status === 'concluida', 'status não é concluida');
  });

  // ─── 4. GAMIFICATION (espera evento) ─────────────────────────────
  console.log(`\n${c.gold}4. Gamification${c.reset}`);

  await step('Aguardar 2s para RabbitMQ processar...', async () => {
    await new Promise(r => setTimeout(r, 2000));
  });

  await step('Consultar conquistas — "Primeiro Passo" desbloqueada', async () => {
    const achievements = await request(`${GAME_API}/api/achievements`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const primeiroPasso = achievements.find(a =>
      a.code === 'primeiro_passo' || a.name?.toLowerCase().includes('primeiro')
    );
    assert(primeiroPasso, '"Primeiro Passo" não encontrada no catálogo');
    assert(primeiroPasso.achieved || primeiroPasso.unlocked,
      `"Primeiro Passo" não foi desbloqueada após concluir tarefa`);
  });

  await step('Consultar stats — total_completed >= 1', async () => {
    const stats = await request(`${GAME_API}/api/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(stats.total_completed >= 1, `total_completed deveria ser ≥1, é ${stats.total_completed}`);
  });

  // ─── 5. ANALYTICS ────────────────────────────────────────────────
  console.log(`\n${c.gold}5. Analytics${c.reset}`);

  await step('Consultar overview de produtividade', async () => {
    const overview = await request(`${ANLY_API}/api/analytics/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(overview.precision !== undefined || overview.precision_score !== undefined,
      'overview não retornou precision');
  });

  await step('Consultar sugestões de calibração', async () => {
    const data = await request(`${ANLY_API}/api/analytics/suggestions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(Array.isArray(data.suggestions ?? data), 'sugestões não é array');
  });

  // ─── 6. CLEANUP ──────────────────────────────────────────────────
  console.log(`\n${c.gold}6. Cleanup${c.reset}`);

  await step('Deletar tarefa criada', async () => {
    await request(`${PLAN_API}/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  });
}

// ─── Runner ───────────────────────────────────────────────────────
(async () => {
  const start = Date.now();
  try {
    await run();
  } catch {
    // erro já logado em step()
  }
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`${c.bold}Resultado:${c.reset} ${c.green}${passed} passou${c.reset}, ${c.red}${failed} falhou${c.reset} em ${elapsed}s`);

  if (failed === 0) {
    console.log(`${c.green}${c.bold}✓ Todos os testes E2E passaram!${c.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${c.red}${c.bold}✗ Alguns testes falharam.${c.reset}\n`);
    process.exit(1);
  }
})();
