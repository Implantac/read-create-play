# Quantitative Integration Audit (TITAN v7.5 Alpha)

**Data:** 19/08/2026
**Responsável:** Lovable Agent
**Status:** Em Progresso (Fase de Integração Consolidada)

## 1. Motores Encontrados e Status de Implementação

| Engine | Arquivo | Responsabilidade | Status |
|---|---|---|---|
| **Data Quality** | `src/engine/validation/DataQuality.ts` (A implementar) | Validar integridade do histórico (concursos, números, datas) | 🔴 Pendente |
| **Evidence Engine** | `src/engine/stats/evidence-engine.ts` | P-Value, Z-Score, MC 100k, Evidence Grades (E0-E4) | 🟢 Funcional |
| **Benchmark Engine** | `src/engine/stats/benchmark-engine.ts` | Comparação vs Random/Uniform/OOS Baselines | 🟢 Funcional |
| **Walk-Forward** | `src/engine/evidence/backtest.ts` | Divisão temporal rigorosa (Train/Evaluation) | 🟢 Funcional |
| **Stress Test** | `src/engine/evidence/StressTestEngine.ts` | Estabilidade em janelas e regimes de mercado | 🟢 Funcional |
| **Strategy Ranking** | `src/engine/strategy-evolution/engine.ts` | Ordenação por Grade > P-Value > Robustness | 🟢 Funcional |
| **Game Generation** | `src/ai/generators/universalGameGenerator.ts` | Geração base via sinais e filtros | 🟢 Funcional |
| **Game Quality** | `src/engine/stats/bet-quality.ts` | Avaliação estrutural e estatística individual | 🟢 Funcional |
| **Similarity** | `src/engine/portfolio/GameSimilarityEngine.ts` | Hamming Distance, Sobreposição, Concentração | 🟢 Funcional |
| **Portfolio Engine** | `src/engine/core/GameOrchestrator.ts` | Seleção da melhor carteira (Qualidade + Diversidade) | 🟢 Funcional |
| **Bankroll** | `src/engine/bankroll/bankrollEngine.ts` | Gestão de banca, Fractional/Defensive Kelly | 🟢 Funcional |
| **Decision Pipeline** | `src/engine/decision/QuantitativeDecisionPipeline.ts` (A criar) | Orquestração central de todo o fluxo | 🟡 Em criação |

## 2. Motores Realmente Utilizados no Fluxo Principal

- **UniversalGameGenerator** -> **GameOrchestrator** (Orquestra Geração + Qualidade + Diversidade).
- **EvidenceEngine** + **BenchmarkEngine** -> Utilizados no **Strategy Lab** e no **StrategyRankingEngine**.
- **BankrollEngine** -> Utilizado na página de **Gestão de Banca** e **Comando do Apostador**.

## 3. Gaps e Problemas Identificados

1. **Desconexão do Fluxo:** Os componentes de Evidence e Stress Test estão presentes no "Strategy Lab", mas o veredito final no "Comando do Apostador" ainda usa mocks em alguns pontos.
2. **Data Quality:** Não há um validador de integridade pré-análise formalizado.
3. **Ablation Engine:** A lógica de ablação de features existe mas não está integrada ao pipeline de decisão em tempo real.
4. **Leakage Test:** Falta uma suite de testes automatizados focada exclusivamente em garantir que dados do concurso `N` nunca vazem para a análise do concurso `N-1`.

## 4. Plano de Correção e Integração

1. **[FASE A]** Criar `src/engine/decision/QuantitativeDecisionPipeline.ts` para unificar o fluxo: Dados -> Qualidade -> Evidência -> Estratégia -> Carteira -> Sizing -> Veredito.
2. **[FASE B]** Implementar `src/engine/validation/DataQuality.ts`.
3. **[FASE C]** Integrar o Pipeline ao `/comando` (Comando do Apostador).
4. **[FASE D]** Criar a Auditoria Interna (Botão "🔍 AUDITAR DECISÃO") para transparência total.

---

## Status da Missão: INTEGRANDO PIPELINE QUANTITATIVO.
