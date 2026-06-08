
#calibracao adaptativa
#vai identificar padres q o usuario constantemente subestime o tempo e sugere fatores de ajuste para proxs tarefas
from collections import defaultdict
from typing import List, Dict, Any


MIN_SAMPLES = 3  #min de tarefas concluidas para gerar sugestao


def calibration_suggestions(tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    #retorna sugestoes de recalibragem ppor (categoria,dificuldade)
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
        #sugere apenas se o desvio eh significativo (maior q 10%)
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

    #ordenar pelo maior desvio (mais urgente)
    suggestions.sort(key=lambda s: -abs(s["avg_overrun_pct"]))
    return suggestions


def workload_health(tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
    #avalicao geral da saude de carga do usuario
    pending = [t for t in tasks if t.get("status") in ("pendente", "em_andamento")]
    total_min = sum(t.get("estimated_min", 0) for t in pending)
    total_h = round(total_min / 60, 1)

    #msgs persos
    if total_h < 10:
        level, msg = "baixa", "Você tem capacidade de absorver mais tarefas."
    elif total_h < 25:
        level, msg = "saudável", "Sua carga está bem distribuída."
    elif total_h < 40:
        level, msg = "alta", "Considere redistribuir algumas tarefas."
    else:
        level, msg = "sobrecarga", "Recomendamos adiar ou cancelar tarefas não-essenciais."

    return {"pending_count": len(pending), "pending_hours": total_h, "level": level, "message": msg}