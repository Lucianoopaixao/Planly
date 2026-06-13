# Patch de Testes — Como aplicar

Este zip contém os arquivos AJUSTADOS para os testes funcionarem com o
projeto ESM (`"type": "module"`).

## O que mudou e por quê

1. **Trocamos Jest por Vitest** no back-end — Vitest funciona nativamente
   com `import`/`export`. O front já usa Vitest, então fica uniforme.

2. **`server.js` agora exporta o `app`** — só dá `app.listen()` em produção,
   não em testes. Isso é o padrão pra testes de integração funcionarem.

3. **Adicionamos `"test": "vitest run"` em todos os `package.json`** — agora
   `npm test` funciona em qualquer serviço.

## Como aplicar (passo a passo)

### 1. Substituir arquivos

Cada arquivo deste zip substitui o existente no seu projeto. Mantém a
mesma estrutura de pastas, é só sobrescrever:

| Do zip | Vai para |
|--------|----------|
| `user-service/package.json` | `Planly/services/user-service/package.json` |
| `user-service/vitest.config.js` | `Planly/services/user-service/vitest.config.js` |
| `user-service/src/server.js` | `Planly/services/user-service/src/server.js` |
| `user-service/__tests__/*.js` | `Planly/services/user-service/__tests__/*.js` |
| `planning-service/package.json` | `Planly/services/planning-service/package.json` |
| `planning-service/vitest.config.js` | `Planly/services/planning-service/vitest.config.js` |
| `planning-service/src/server.js` | `Planly/services/planning-service/src/server.js` |
| `planning-service/__tests__/overloadChecker.test.js` | `Planly/services/planning-service/__tests__/overloadChecker.test.js` |
| `gamification-service/package.json` | `Planly/services/gamification-service/package.json` |
| `gamification-service/vitest.config.js` | `Planly/services/gamification-service/vitest.config.js` |
| `gamification-service/src/server.js` | `Planly/services/gamification-service/src/server.js` |
| `gamification-service/__tests__/badgeEngine.test.js` | `Planly/services/gamification-service/__tests__/badgeEngine.test.js` |
| `frontend/package.json` | `Planly/frontend/package.json` |

**Pode deletar:** os `jest.config.js` antigos (substituídos pelo `vitest.config.js`).

### 2. Apagar o `tasks.integration.test.js` antigo

Esse teste depende muito de banco real e RabbitMQ. Para começar simples,
deletar ele. Posso recriar depois se quiser.

```powershell
Remove-Item Planly\services\planning-service\__tests__\tasks.integration.test.js
Remove-Item Planly\services\user-service\jest.config.js
Remove-Item Planly\services\planning-service\jest.config.js
Remove-Item Planly\services\gamification-service\jest.config.js
```

### 3. Instalar as dependências novas

```powershell
cd Planly\services\user-service
npm install

cd ..\planning-service
npm install

cd ..\gamification-service
npm install

cd ..\analytics-service
pip install pytest httpx

cd ..\..\frontend
npm install

cd ..
```

### 4. Rodar os testes unitários

Os unitários NÃO precisam do docker compose rodando:

```powershell
# User service
cd Planly\services\user-service
npm test
# Esperado: 6 testes passando (bcrypt + JWT)

# Planning service
cd ..\planning-service
npm test
# Esperado: 3 testes passando (overloadChecker)

# Gamification service
cd ..\gamification-service
npm test
# Esperado: 2 testes passando (badgeEngine)

# Frontend
cd ..\..\frontend
npm test
# Esperado: 8 testes passando (ui + Login)

# Analytics (Python)
cd ..\services\analytics-service
pytest -v
# Esperado: 10 testes passando
```

### 5. Rodar os testes de integração

PRECISA do `docker compose up` rodando:

```powershell
cd Planly
docker compose up -d

# Espera 30 segundos pros serviços ficarem saudáveis
Start-Sleep 30

# Roda integração do user-service
cd services\user-service
$env:NODE_ENV="test"
npm test
# Agora roda tanto unitário quanto integração
```

### 6. Rodar o E2E (smoke test)

```powershell
cd Planly
node tests/e2e/smoke.js
```

## Resumo dos comandos

Tudo de uma vez, com docker subido:

```powershell
.\run-tests.ps1
```
