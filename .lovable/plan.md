# Plano de Refinamento do Terminal Quantitativo (Verdade Matemática)

O objetivo é transformar o sistema de um simples gerador em uma plataforma de apoio à decisão profissional, focando em evidências estatísticas rigorosas, diversificação de carteira e explicabilidade.

## 1. Evidence Engine & Benchmarking (Prioridade 2 & 3)
Fortalecer a prova de que o sistema supera o acaso.

- **Ranking de Indicadores (Ablação):** Expandir `src/engine/evidence/ablation.ts` para gerar o relatório de "Impacto" e "Robustez" solicitado.
- **Benchmark contra Random (Benchmark Zero):** Integrar `BaselineBenchmarkPanel.tsx` no `StrategyLabPage.tsx` para comparar diretamente contra "Random Baseline" e "Uniform Baseline".
- **Evidence Distribution:** Refinar `EvidenceDistributionPanel.tsx` para incluir o aviso de "Não existe evidência suficiente" quando o p-valor for alto.

## 2. Portfolio Engine & Diversificação (Prioridade 1 & 6)
Mudar o foco de "jogos individuais" para "carteira de jogos".

- **Similarity Engine:** Implementar cálculo de Distância de Hamming no `src/engine/core/GameOrchestrator.ts` para garantir que os jogos sugeridos não sejam redundantes.
- **Portfolio Sizing:** Adicionar lógica de "Carteira Titan" no `ComandoApostadorPage.tsx`, sugerindo exposição baseada em banca e confiança do sinal.

## 3. Modo Apostador Profissional & Veredito (Prioridade 7)
Melhorar a explicabilidade e a disciplina do usuário.

- **Veredito:** Implementar o componente `VereditoApostador.tsx` com estados (Apostar, Reduzido, Observar, Não Apostar) baseado em Z-Score e Lift.
- **Honestidade Estatística:** Adicionar alertas explícitos sobre o que o sistema *não sabe* e a possibilidade de ruído.

## Detalhes Técnicos

- **Evidence Grades:** E0 (Nenhuma) a E4 (Robusta) baseadas em 100k iterações Monte Carlo.
- **Leakage Prevention:** Manutenção do split 70/30 (Train/Eval) em todos os backtests do laboratório.
- **Métricas:** ROI Ajustado ao Risco como KPI primário.

```text
INDICADOR → Backtest → Walk Forward → Permutation → Ablation → VEREDITO
```
