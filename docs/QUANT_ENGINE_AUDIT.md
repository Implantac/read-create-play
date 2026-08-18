# Auditoria do Motor Quantitativo (QUANT_ENGINE_AUDIT)

**Data:** 18/08/2026
**Responsável:** Lovable Agent
**Status:** Iniciado

## 1. Mapeamento de Estrutura

- **src/engine/ai**: Contém `ml-models.ts` com nomes conceituais, mas lógica ainda baseada em heurísticas manuais.
- **src/engine/stats**: Possui `evidence-engine.ts`, `statistics.ts` e `baseline-benchmark.ts`. Lógica sólida, mas precisa de integração profunda com o gerador.
- **src/engine/lotteries**: Atualmente apenas `LotofacilEngine.ts` implementado. Outras modalidades usam lógica genérica.
- **src/engine/math**: `hp-math-engine.ts` e `combinatorial-optimizer.ts`.
- **src/generators**: Múltiplos arquivos (`intelligent-generator.ts`, `professional-generator.ts`, `universalGameGenerator.ts`) causando fragmentação de lógica.

## 2. Problemas Identificados

| Problema | Arquivo | Função | Gravidade | Impacto | Solução Proposta |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Nomenclatura ML vs Realidade | `src/engine/ai/ml-models.ts` | Várias | Média | Percepção do usuário | Implementar Model Registry para separar Heurística de ML real. |
| Fragmentação de Geradores | `src/engine/` | `universalGameGenerator.ts`, etc. | Alta | Manutenibilidade | Unificar em um `UniversalLotteryEngine` com drivers por modalidade. |
| Métricas Heurísticas como Probabilidade | `src/engine/ai/ml-models.ts` | `normalizeAndRank` | Alta | Honestidade Científica | Substituir score 0-100 por Confidence Signal e Consensus. |
| Ausência de Lottery Engines Específicos | `src/engine/lotteries/` | - | Alta | Especialização | Criar engines para Mega, Quina, Lotomania, Dupla, Time, Dia e Sete. |
| Falta de Teste de Data Leakage | `tests/` | - | Crítica | Validação | Criar suíte `tests/quant/leakage.test.ts`. |
| Acerto vs ROI | `src/engine/performance/` | `PerformanceMetrics.ts` | Média | Gestão de Expectativa | Integrar ROI financeiro em todos os backtests. |

## 3. Plano de Ação

1.  **Model Registry**: Centralizar definições de modelos em `src/engine/ml/modelRegistry.ts`.
2.  **Evidence Engine Expansion**: Mover e expandir `src/engine/stats/evidence-engine.ts` para `src/engine/evidence/` com suporte a IC95% e Baselines.
3.  **Lottery Engines**: Implementar os motores específicos em `src/engine/lotteries/`.
4.  **Backtest Walk-Forward**: Refatorar o motor de backtest para garantir folds temporais e ausência de leakage.
5.  **Performance metrics**: Criar `src/engine/performance/bankroll.ts` para gestão financeira.
