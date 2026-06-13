"""
Configuração do pytest — adiciona o diretório src ao path
para os imports funcionarem nos testes.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
