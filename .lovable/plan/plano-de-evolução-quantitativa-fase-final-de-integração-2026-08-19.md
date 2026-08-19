# Plano de Evolução Quantitativa - Fase Final de Integração

Este plano visa garantir que todos os motores quantitativos (Evidência, Benchmark, Stress Test, Ablação e Qualidade) estejam plenamente integrados e operacionais no pipeline de decisão do Titan Loterias, eliminando quaisquer "gaps" ou implementações parciais.

## 1. Integração do Motor de Ablação no Pipeline de Decisão
- **Objetivo:** Adicionar a análise de ablação de indicadores ao `QuantitativeDecisionPipeline` para que o veredito considere quais componentes da estratégia estão realmente gerando valor.
- **Ações:**
  - Modificar `QuantitativeDecisionPipeline.ts` para executar `AblationEngine.runAblation`.
  - Atualizar o contrato `QuantitativeDecisionResult` em `src/engine/contracts/quant.ts` para incluir dados de ablação.
  - Exibir os indicadores de ablação no painel de comando (`ComandoApostadorPage.tsx`).

## 2. Implementação do Detector de Vazamento (Leakage) Automático
- **Objetivo:** Garantir que nenhuma estratégia "olhe para o futuro" durante o backtest ou geração.
- **Ações:**
  - Integrar o `LeakageDetector` no fluxo de validação do pipeline.
  - Adicionar uma verificação de "Integridade Temporal" no relatório de `Data Quality`.

## 3. Otimização do GameOrchestrator com Hamming Distance
- **Objetivo:** Garantir que a seleção final de jogos (carteira) maximize a diversidade estatística.
- **Ações:**
  - Refinar o uso do `GameSimilarityEngine` dentro do `GameOrchestrator.ts`.
  - Garantir que a diversificação de números núcleo (core) respeite o limite de 55% para evitar sobreposição excessiva.

## 4. UI: Painel de Auditoria de Decisão
- **Objetivo:** Fornecer transparência total sobre o porquê de um veredito ("APOSTAR", "OBSERVAR").
- **Ações:**
  - Criar o componente `DecisionAuditDialog.tsx` que detalha todos os passos do pipeline (Data Quality -> Evidence -> Robustness -> Ablation).
  - Adicionar o botão "🔍 AUDITAR DECISÃO" no `ComandoApostadorPage.tsx`.

## Detalhes Técnicos
- **Pipeline:** DATA -> QUALITY -> EVIDENCE -> BENCHMARK -> ROBUSTNESS -> ABLATION -> VERDICT.
- **Monte Carlo:** Mantendo 100k iterações para validação de P-Value.
- **Grades:** E0 a E4 baseados em significância estatística rigorosa.
- **Segurança:** Todas as funções de decisão permanecem isoladas no backend/edge quando possível, mas as interfaces de contrato garantem tipagem forte no frontend.
