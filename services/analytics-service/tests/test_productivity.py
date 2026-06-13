"""
Testes unitários do módulo productivity.
Testa cálculos de precisão e breakdown isoladamente.
"""
import pytest
from src.analyzers.productivity import (
    precision_score,
    by_category,
    weekly_planned_vs_actual,
)


# ─── Fixtures ──────────────────────────────────────────────────────
@pytest.fixture
def tarefas_basicas():
    """Conjunto de tarefas com dados conhecidos para testes determinísticos."""
    return [
        {"estimated_min": 60, "actual_min": 60, "category": "estudo",   "status": "concluida"},
        {"estimated_min": 90, "actual_min": 100, "category": "estudo",  "status": "concluida"},
        {"estimated_min": 30, "actual_min": 25, "category": "saude",    "status": "concluida"},
        {"estimated_min": 45, "actual_min": None, "category": "trabalho", "status": "pendente"},
    ]


# ─── precision_score ───────────────────────────────────────────────
class TestPrecisionScore:
    def test_precisao_perfeita_quando_estimado_igual_real(self):
        tarefas = [{"estimated_min": 60, "actual_min": 60, "status": "concluida"}]
        assert precision_score(tarefas) == 100.0

    def test_precisao_zero_quando_lista_vazia(self):
        assert precision_score([]) == 0.0

    def test_ignora_tarefas_pendentes(self, tarefas_basicas):
        """Apenas tarefas concluídas com actual_min entram no cálculo."""
        score = precision_score(tarefas_basicas)
        # As 3 concluídas têm precisão variada, a pendente é ignorada
        assert 0 < score <= 100

    def test_precisao_diminui_com_subestimativa(self):
        tarefas = [
            {"estimated_min": 60, "actual_min": 120, "status": "concluida"}
        ]
        score = precision_score(tarefas)
        assert score < 100.0
        assert score > 0


# ─── by_category ───────────────────────────────────────────────────
class TestByCategory:
    def test_agrupa_tarefas_por_categoria(self, tarefas_basicas):
        breakdown = by_category(tarefas_basicas)
        assert "estudo" in breakdown
        assert "saude" in breakdown

    def test_categoria_estudo_tem_duas_tarefas(self, tarefas_basicas):
        breakdown = by_category(tarefas_basicas)
        assert breakdown["estudo"]["count"] == 2

    def test_retorna_dict_vazio_para_lista_vazia(self):
        assert by_category([]) == {}


# ─── weekly_planned_vs_actual ──────────────────────────────────────
class TestWeeklyPlannedVsActual:
    def test_retorna_lista_de_7_dias(self):
        tarefas = []  # mesmo vazio
        result = weekly_planned_vs_actual(tarefas)
        assert len(result) == 7

    def test_cada_dia_tem_previsto_e_real(self):
        result = weekly_planned_vs_actual([])
        for dia in result:
            assert "day" in dia
            assert "previsto" in dia
            assert "real" in dia
