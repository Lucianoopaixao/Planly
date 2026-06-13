# run-tests.ps1
# Roda todos os testes do projeto Planly em sequência

$ErrorActionPreference = "Continue"

function Header($texto) {
  Write-Host ""
  Write-Host "════════════════════════════════════════════════════════" -ForegroundColor DarkCyan
  Write-Host "  $texto" -ForegroundColor Cyan
  Write-Host "════════════════════════════════════════════════════════" -ForegroundColor DarkCyan
}

function Check($servico, $url) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -eq 200) {
      Write-Host "  ✓ $servico está respondendo" -ForegroundColor Green
      return $true
    }
  } catch {
    Write-Host "  ✗ $servico não está respondendo em $url" -ForegroundColor Red
    return $false
  }
}

# ─── Verificar se docker compose está rodando ───
Header "Verificando serviços"
$todosOk = $true
$todosOk = (Check "user-service"          "http://localhost:4001/health") -and $todosOk
$todosOk = (Check "planning-service"      "http://localhost:4002/health") -and $todosOk
$todosOk = (Check "gamification-service"  "http://localhost:4003/health") -and $todosOk
$todosOk = (Check "analytics-service"     "http://localhost:4004/health") -and $todosOk

if (-not $todosOk) {
  Write-Host ""
  Write-Host "Rode primeiro: docker compose up -d" -ForegroundColor Yellow
  exit 1
}

$resultados = @{}

# ─── 1. Testes unitários e de integração do back ───
Header "User Service — Jest"
Push-Location services/user-service
npm test
$resultados["user-service"] = $LASTEXITCODE
Pop-Location

Header "Planning Service — Jest"
Push-Location services/planning-service
npm test
$resultados["planning-service"] = $LASTEXITCODE
Pop-Location

Header "Gamification Service — Jest"
Push-Location services/gamification-service
npm test
$resultados["gamification-service"] = $LASTEXITCODE
Pop-Location

# ─── 2. Analytics — Pytest ───
Header "Analytics Service — Pytest"
Push-Location services/analytics-service
pytest -v
$resultados["analytics-service"] = $LASTEXITCODE
Pop-Location

# ─── 3. Frontend — Vitest ───
Header "Frontend — Vitest"
Push-Location frontend
npm test -- --run
$resultados["frontend"] = $LASTEXITCODE
Pop-Location

# ─── 4. E2E ───
Header "E2E — Smoke Test"
node tests/e2e/smoke.js
$resultados["e2e"] = $LASTEXITCODE

# ─── Sumário ───
Header "Sumário"
$totalFalhas = 0
foreach ($k in $resultados.Keys) {
  if ($resultados[$k] -eq 0) {
    Write-Host "  ✓ $k" -ForegroundColor Green
  } else {
    Write-Host "  ✗ $k (exit code: $($resultados[$k]))" -ForegroundColor Red
    $totalFalhas++
  }
}

Write-Host ""
if ($totalFalhas -eq 0) {
  Write-Host "✅  Todos os testes passaram!" -ForegroundColor Green
  exit 0
} else {
  Write-Host "❌  $totalFalhas suite(s) falharam." -ForegroundColor Red
  exit 1
}
