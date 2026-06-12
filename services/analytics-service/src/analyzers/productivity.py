"""
Análise de produtividade do Planly.

Este módulo consome as tarefas do planning-service via REST e calcula
métricas que alimentam o dashboard de progresso.
"""

from collections import defaultdict
from datetime import datetime, timedelta
from typing import List, Dict, Any


def precision_score(tasks: List[Dict[str, Any]]) -> float:
    """% de tarefas concluídas dentro do tempo estimado (±10%)."""

    # filtra só tarefas concluídas e que possuem o tempo real preenchido
    completed = [t for t in tasks
                 if t.get("status") == "concluida" and t.get("actual_min") is not None]
    if not completed:
        return 0.0
    
    # conta quantas tarefas ficaram dentro da margem de erro de 10% do tempo estimado
    on_time = sum(1 for t in completed
                  if abs(t["actual_min"] - t["estimated_min"]) <= t["estimated_min"] * 0.10)
    
    return round(on_time / len(completed) * 100, 1)     # retorna o percentual arredondado


def by_category(tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Precisão segmentada por categoria."""

    # agrupa as tarefas validas em um dicionario onde a chave é a categoria
    buckets: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for t in tasks:
        if t.get("status") == "concluida" and t.get("actual_min") is not None:
            buckets[t.get("category", "outros")].append(t)

    result = []
    for cat, items in buckets.items():
        if not items:
            continue

        # calcula a quantidade de tarefas dentro do prazo na categoria atual
        on_time = sum(1 for t in items
                      if abs(t["actual_min"] - t["estimated_min"]) <= t["estimated_min"] * 0.10)
        result.append({
            "category": cat,
            "completed": len(items),
            "precision_pct": round(on_time / len(items) * 100, 1),
            "avg_overrun_pct": round(
                sum((t["actual_min"] - t["estimated_min"]) / t["estimated_min"] * 100
                    for t in items) / len(items), 1
            ),
        })
    result.sort(key=lambda x: -x["precision_pct"])
    return result


def weekly_planned_vs_actual(tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Total previsto/realizado por dia da semana corrente."""

    # define a data de hoje e retrocede até a segunda da semana atual
    today = datetime.utcnow().date()
    week_start = today - timedelta(days=today.weekday())  # segunda

    days = []
    for i in range(7):
        day = week_start + timedelta(days=i)
        label = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"][i]
        previsto = 0
        real = 0
        for t in tasks:
            sched = _parse_date(t.get("scheduled_for"))

            # se a tarefa estiver agendada para o dia em análise, computa as horas
            if sched and sched.date() == day:
                previsto += t.get("estimated_min", 0)
                if t.get("status") == "concluida":
                    # se não houver 'actual_min', assume o 'estimated_min' como fallback
                    real += t.get("actual_min") or t.get("estimated_min", 0)
        days.append({
            "day": label,
            "date": day.isoformat(),
            "previsto_h": round(previsto / 60, 1),
            "real_h":     round(real / 60, 1),
        })
    return days


def monthly_precision_trend(tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Tendência de precisão nas últimas 4 semanas."""
    today = datetime.utcnow().date()
    weeks = []

    # itera de trás para frente (3 semanas atrás até a semana atual)
    for w in range(3, -1, -1):
        wk_start = today - timedelta(days=today.weekday() + 7 * w)
        wk_end   = wk_start + timedelta(days=6)
        wk_tasks = [t for t in tasks
                    if (s := _parse_date(t.get("scheduled_for")))
                       and wk_start <= s.date() <= wk_end]
        weeks.append({
            "wk": f"S{4-w}",
            "precisao": precision_score(wk_tasks)
        })
    return weeks


def _parse_date(iso: str):
    if not iso:
        return None
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except Exception:
        return None
