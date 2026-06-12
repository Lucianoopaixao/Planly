"""
Analytics Service — Planly

Consome tarefas do planning-service via REST e expõe métricas
calculadas para o frontend. Não armazena dados próprios; todo o
estado vive nos outros serviços.
"""
import os
import jwt
import httpx
import logging
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware

from analyzers.productivity import (
    precision_score, by_category,
    weekly_planned_vs_actual, monthly_precision_trend
)
from analyzers.calibration import calibration_suggestions, workload_health

logging.basicConfig(level=logging.INFO, format="[analytics-service] %(message)s")
log = logging.getLogger()

JWT_SECRET       = os.getenv("JWT_SECRET",       "planly-dev-secret-change-in-prod")
PLANNING_URL     = os.getenv("PLANNING_SERVICE_URL", "http://localhost:4002")

app = FastAPI(title="Planly Analytics", version="1.0.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"],
    allow_methods=["*"], allow_headers=["*"],
)


def current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "token ausente")
    token = authorization[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload  # {sub, email, name}
    except jwt.PyJWTError:
        raise HTTPException(401, "token inválido")


async def fetch_user_tasks(token: str):
    """Busca todas as tarefas do usuário no planning-service."""
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{PLANNING_URL}/api/tasks", headers=headers)
        if r.status_code != 200:
            raise HTTPException(502, "falha ao consultar planning-service")
        return r.json()


@app.get("/health")
def health():
    return {"service": "analytics-service", "status": "ok"}


@app.get("/api/analytics/overview")
async def overview(user=Depends(current_user), authorization: str = Header(None)):
    """
    Métricas consolidadas para o dashboard de progresso.
    """
    token = authorization[7:]
    tasks = await fetch_user_tasks(token)

    return {
        "precision_pct":         precision_score(tasks),
        "by_category":           by_category(tasks),
        "weekly":                weekly_planned_vs_actual(tasks),
        "monthly_trend":         monthly_precision_trend(tasks),
        "workload":              workload_health(tasks),
        "total_tasks":           len(tasks),
        "completed_tasks":       sum(1 for t in tasks if t.get("status") == "concluida"),
    }


@app.get("/api/analytics/suggestions")
async def suggestions(user=Depends(current_user), authorization: str = Header(None)):
    """
    Sugestões de recalibragem baseadas no histórico.
    """
    token = authorization[7:]
    tasks = await fetch_user_tasks(token)
    return {"suggestions": calibration_suggestions(tasks)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "4004")))
