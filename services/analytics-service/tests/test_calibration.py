"""
Testes unitários do módulo calibration.
Testa identificação de subestimativas e sugestões.
"""
import pytest
from src.analyzers.calibration import (
    calibration_suggestions,
    workload_health,
)


@pytest.fixture
def tarefas_com_subestimativa():
    """Tarefas de estudo onde o real é consistentemente maior que o estimado."""
    return [
        {"category": "estudo", "difficulty": "dificil", "estimated_min": 60, "actual_min": 90, "status": "concluida"},
        {"category": "estudo", "difficulty": "dificil", "estimated_min": 60, "actual_min": 85, "status": "concluida"},
        {"category": "estudo", "difficulty": "dificil", "estimated_min": 60, "actual_min": 95, "status": "concluida"},
    ]


class TestCalibrationSuggestions:
    def test_identifica_subestimativa_em_categoria(self, tarefas_com_subestimativa):
        suggestions = calibration_suggestions(tarefas_com_subestimativa)
        # Espera pelo menos uma sugestão indicando que estudo+dificil leva mais tempo
        assert len(suggestions) > 0

    def test_lista_vazia_quando_nao_ha_dados(self):
        assert calibration_suggestions([]) == []

    def test_lista_vazia_quando_amostra_pequena(self):
        """Com poucas amostras, não há confiança estatística."""
        tarefas = [
            {"category": "estudo", "difficulty": "media", "estimated_min": 60, "actual_min": 70, "status": "concluida"}
        ]
        suggestions = calibration_suggestions(tarefas)
        # Apenas 1 amostra → não deve gerar sugestão
        assert suggestions == [] or len(suggestions) == 0


class TestWorkloadHealth:
    def test_carga_baixa_quando_poucas_horas(self):
        tarefas = [
            {"estimated_min": 60, "scheduled_for": "2026-06-13", "status": "pendente"}
        ]
        result = workload_health(tarefas)
        assert result["status"] in ["baixa", "saudavel"]

    def test_sobrecarga_quando_muitas_horas(self):
        tarefas = [
            {"estimated_min": 120, "scheduled_for": "2026-06-13", "status": "pendente"}
            for _ in range(5)  # 10h em um único dia
        ]
        result = workload_health(tarefas)
        assert result["status"] in ["alta", "sobrecarga"]

    def test_estrutura_da_resposta(self):
        result = workload_health([])
        assert "status" in result
