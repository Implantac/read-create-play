# Auditoria da Engine Quantitativa - Titan Loterias

Este documento mapeia os problemas identificados no motor estatístico e de IA/ML do projeto antes da refatoração.

## Problemas Identificados

### 1. Nomenclatura ML Imprecisa
- **Arquivo:** `src/engine/ai/ml-models.ts`
- **Funções:** `runRandomForest`, `runXGBoost`, `runNeuralNetwork`, `runQuantumAnalysis`.
- **Gravidade:** Alta
- **Impacto:** O usuário é levado a acreditar que existem modelos treinados e complexos, quando são heurísticas determinísticas com pesos fixos.
- **Solução Proposta:** Renomear para nomes que descrevam o método estatístico/heurístico real (ex: `FrequencyTrendScore`, `GradientPatternEngine`).

### 2. Cálculo de Acurácia e Confiança
- **Arquivo:** `src/engine/ai/ml-models.ts` e `src/engine/strategy-evolution/engine.ts`
- **Funções:** `computeAccuracyFromBacktest`, `backtestStrategy`.
- **Gravidade:** Média
- **Impacto:** Métricas de "acurácia" em loteria são perigosas se não forem normalizadas contra o baseline. O termo "acurácia" sugere predição binária correta.
- **Solução Proposta:** Substituir por `Performance Index`, `Lift` e métricas de precisão em K (Precision@K).

### 3. Falta de Baselines de Comparação
- **Arquivo:** `src/engine/strategy-lab/backtest-engine.ts`
- **Gravidade:** Alta
- **Impacto:** Não é possível saber se uma estratégia é realmente superior a escolher números aleatoriamente ou pela frequência simples.
- **Solução Proposta:** Implementar Baselines A (Aleatório), B (Uniforme) e C (Frequência Simples) em todos os backtests.

### 4. Lógica de Premiação e ROI Genérica
- **Arquivo:** `src/engine/strategy-lab/backtest-engine.ts`
- **Gravidade:** Média
- **Impacto:** As regras de premiação estão hardcoded e incompletas para algumas modalidades.
- **Solução Proposta:** Criar `LotteryEngine` específicas para cada modalidade (Mega, Loto, etc) que encapsulem as regras de prêmio, custo e estrutura.

### 5. Risco de Data Leakage no Backtest
- **Arquivo:** `src/engine/ai/ml-models.ts` (Função `backtestModel`)
- **Gravidade:** Crítica
- **Impacto:** Se a ordenação temporal não for rigorosa, o modelo pode "espiar" o futuro.
- **Solução Proposta:** Garantir ordenação ASC por concurso/data e implementar Walk-Forward formal.

### 6. Duplicação de Lógica de Backtest
- **Arquivos:** `src/engine/strategy-evolution/engine.ts` e `src/engine/strategy-lab/backtest-engine.ts`
- **Gravidade:** Média
- **Impacto:** Inconsistência de resultados entre diferentes partes do sistema.
- **Solução Proposta:** Centralizar o motor de backtest em `src/engine/evidence/backtest.ts`.

---
*Auditoria realizada em 2026-08-17*
