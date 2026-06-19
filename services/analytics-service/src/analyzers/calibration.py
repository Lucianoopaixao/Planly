from collections import defaultdict
from datetime import datetime, date, timedelta
from typing import List, Dict, Any


MIN_SAMPLES = 3

def calibration_suggestions(tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    buckets: Dict[tuple, List[Dict[str, Any]]] = defaultdict(list)
    for t in tasks:
        if t.get("status") != "concluida" or t.get("actual_min") is None:
            continue
        key = (t.get("category", "outros"), t.get("difficulty", "media"))
        buckets[key].append(t)

    suggestions = []
    for (cat, diff), items in buckets.items():
        if len(items) < MIN_SAMPLES:
            continue
        overruns = [
            (t["actual_min"] - t["estimated_min"]) / t["estimated_min"] * 100
            for t in items
        ]
        avg = sum(overruns) / len(overruns)
        if abs(avg) < 10:
            continue
        multiplier = round(1 + avg / 100, 2)
        signal = "+" if avg > 0 else ""
        suggestions.append({
            "category":   cat,
            "difficulty": diff,
            "samples":    len(items),
            "avg_overrun_pct": round(avg, 1),
            "suggested_multiplier": multiplier,
            "message": (
                f"Tarefas {diff}s de {cat} levam {signal}{round(avg)}% "
                f"{'a mais' if avg > 0 else 'a menos'} do tempo estimado."
            ),
        })

    suggestions.sort(key=lambda s: -abs(s["avg_overrun_pct"]))
    return suggestions


def _parse_task_date(value):
    """Aceita string ISO, datetime ou date. Retorna date ou None."""
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        try:
            cleaned = value.replace("Z", "+00:00")
            return datetime.fromisoformat(cleaned).date()
        except Exception:
            try:
                return datetime.strptime(value[:10], "%Y-%m-%d").date()
            except Exception:
                return None
    return None


def workload_health(tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calcula a carga da SEMANA ATUAL: do dia de hoje até sábado (inclusive).
    A semana começa no domingo, então o sábado fecha a semana.

    Exemplos:
      - Hoje = terça → conta terça + quarta + quinta + sexta + sábado (5 dias)
      - Hoje = sábado → conta só sábado (1 dia)
      - Hoje = domingo → conta a semana inteira (7 dias)
    """
    today = date.today()

    # Dias até sábado (inclusive). Em Python, weekday(): seg=0 ... dom=6
    py_wd = today.weekday()
    if py_wd == 6:                  # domingo
        days_until_saturday = 6     # até o próximo sábado
    else:
        days_until_saturday = 5 - py_wd

    end_date = today + timedelta(days=days_until_saturday)
    days_left = days_until_saturday + 1  # inclusivo

    # Filtra tarefas pendentes agendadas dentro do horizonte da semana
    pending = []
    for t in tasks:
        if t.get("status") not in ("pendente", "em_andamento"):
            continue
        sched_date = _parse_task_date(t.get("scheduled_for"))
        if sched_date is None:
            continue  # sem data agendada → não conta na carga semanal
        if today <= sched_date <= end_date:
            pending.append(t)

    total_min = sum(t.get("estimated_min", 0) for t in pending)
    total_h = round(total_min / 60, 1)

    # Threshold baseado na MÉDIA POR DIA — proporcional ao tempo restante
    avg_per_day = total_h / days_left if days_left > 0 else total_h

    if avg_per_day < 3:
        level = "baixa"
        msg = f"Você tem espaço para mais tarefas até sábado."
    elif avg_per_day < 6:
        level = "saudável"
        msg = "Sua semana está bem distribuída."
    elif avg_per_day < 9:
        level = "alta"
        msg = "Considere redistribuir algumas tarefas desta semana."
    else:
        level = "sobrecarga"
        msg = "Semana sobrecarregada. Recomendamos adiar tarefas não essenciais."

    return {
        "pending_count": len(pending),
        "pending_hours": total_h,
        "level": level,
        "message": msg,
        "days_remaining": days_left,
        "end_date": end_date.isoformat(),
    }