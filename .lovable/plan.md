
# Melhorias no gerador de jogos — "modo apostador profissional"

Objetivo: elevar a qualidade estatística dos jogos gerados em **todas as loterias** (Lotofácil, Mega-Sena, Quina, Lotomania, +Milionária, Dupla Sena, Timemania, Dia de Sorte, Super Sete), sem quebrar contratos existentes (sem alterar API, rotas, tabelas ou fluxo). Toda entrega termina em **backtest nos últimos 200 sorteios** com métrica antes/depois.

Regra de ouro: evolução incremental. Cada fase é isolada, mensurável e reversível.

---

## Fase 1 — Novos filtros estatísticos (fundação)

Novo arquivo `src/engine/filters/professionalFilters.ts` com filtros parametrizados **por modalidade** (tabela de calibração em `src/ai/knowledge/lotteryProfiles.ts`):

- Ciclo de repetição médio (quantos sorteios até o número reaparecer)
- Atraso máximo permitido por dezena (percentil 95 histórico)
- Distância mínima/máxima entre dezenas consecutivas (gaps)
- Sequência histórica: rejeita combinações que replicam ≥ 60% de um sorteio já ocorrido
- Pares/ímpares dinâmicos (faixa vinda do histórico, não fixo em 50/50)
- Soma total dentro do intervalo (μ ± 1σ do histórico da modalidade)
- Distribuição por quadrante/coluna (Lotofácil 5×5, Mega/Quina em faixas de 10)
- Frequência de primos, múltiplos de 3, Fibonacci
- Repetição do sorteio anterior (janela ideal por modalidade)

Cada filtro devolve `{ pass: boolean, score: 0..1, reason: string }` para alimentar o scoring e a explicabilidade.

## Fase 2 — Recalibração do Titan Score

Refatoro em `src/engine/stats/bet-quality.ts` (mantém assinatura pública):

- Pesos passam a vir de `lotteryProfiles.ts` (um perfil por modalidade)
- 6 dimensões: Frequência, Recência, Distribuição, Padrões, Robustez, Cobertura
- Cada dimensão retorna 0-100 + justificativa curta
- Grade S/A/B/C/D/F baseada no score consolidado
- Novo campo `dimensionBreakdown` no retorno para o painel de explicabilidade

Recalibração: rodo backtest histórico e ajusto pesos por gradient search simples até maximizar hit rate médio.

## Fase 3 — Aprendizado das IAs por loteria

- Enriqueço `src/ai/knowledge/lotteriesKnowledge.ts` com regras oficiais, estatísticas agregadas e "vieses conhecidos" de cada modalidade
- `src/ai/engines/userLearningEngine.ts`: passa a ler `ai_user_memory` e `saved_bets` do usuário para ajustar geração (números favoritos, aversão a certos padrões, histórico de acertos)
- Edge function `ai-autonomous-learning` ganha etapa de "profile update" pós-sorteio: registra o que funcionou, ajusta pesos personalizados
- Sem novos secrets nem novas tabelas — usa o schema existente

## Fase 4 — Desdobramentos e cobertura garantida

`src/ai/engines/wheelingEngine.ts` + `wheelingMatrices.ts`:

- Adiciono matrizes reais publicadas (Lotofácil 16→14 garante 13, 18→14 garante 14; Mega 8→6 garante 5; Quina 7→5 garante 4)
- Otimizador de cobertura via `simulated-annealing.ts` já existente para gerar desdobramentos customizados quando não há matriz pronta
- Painel exibe garantia matemática (ex: "18 dezenas em 32 jogos → garante 14 acertos se acertar 15")

## Fase 5 — Validação via backtest automático

Novo módulo `src/engine/validation/backtestRunner.ts`:

- Roda cada gerador contra os **últimos 200 sorteios** de cada modalidade
- Métricas: hit rate médio, distribuição de acertos, ROI teórico, prêmios simulados
- Comparação **antes vs depois** salva em `system_insights` (tabela já existe)
- Console de admin em `/admin` ganha aba "Backtest" mostrando os números

Sem UI nova para o usuário final nesta fase — a saída é um relatório numérico que garante que as melhorias realmente melhoraram.

---

## Ordem de execução proposta

```text
Fase 1 (filtros)  ──►  Fase 2 (scoring)  ──►  Fase 5 (baseline backtest)
                                                    │
                                                    ▼
Fase 3 (aprendizado IAs)  ──►  Fase 4 (desdobramentos)  ──►  Fase 5 (backtest final)
```

Cada fase é 1 entrega independente. Após cada uma eu rodo o backtest e reporto os números — se piorar, revertemos aquela fase sem afetar as outras.

## O que NÃO vou fazer (respeitando as memórias do projeto)

- Não recriar geradores existentes (Extreme, Intelligent, Evolutive, Professional, HP continuam intactos — recebem os novos filtros/scoring via injeção)
- Não alterar rotas, endpoints, schema de tabelas nem contratos de tipos públicos
- Não introduzir backend externo — só edge functions Supabase já existentes
- Não mexer em `LotteryContext` (isolamento por modalidade preservado)
- Não tocar em billing, RBAC, trial policy nem God Mode

## Detalhes técnicos (para revisão do desenvolvedor)

- Todos os filtros são **puros** (input → output, sem side effects) para permitir teste unitário e uso em Web Worker
- `lotteryProfiles.ts` é a única fonte de verdade dos parâmetros por modalidade — trocar um número lá recalibra tudo
- Backtest roda em `src/workers/analytics.worker.ts` (worker já existe) para não travar UI
- Explicabilidade: cada jogo gerado carrega array `reasons[]` populado pelos filtros + dimensões do score, exibido no `GameAnalysisBlock`
- Testes: novos arquivos `*.test.ts` para filtros e scoring, rodados via vitest (config já existe)

---

Aprove o plano ou peça ajustes (ex: começar por uma loteria específica, pular uma fase, mudar ordem). Após aprovação executo Fase 1 e reporto números antes de seguir para a Fase 2.
