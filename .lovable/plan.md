# Motor Universal de Fechamentos (Titan Loterias)

Módulo genérico, agnóstico de modalidade, que gera fechamentos **dinamicamente** (sem matrizes fixas em banco), valida garantia matemática, simula histórico e recomenda via IA.

## Princípios

- Um único núcleo (`ClosingEngine`) parametrizado por `LotterySpec { total, drawn, pick, guarantee, maxGames, ticketPrice }`.
- Zero código específico por loteria — Lotofácil, Mega, Quina, Lotomania, Dupla, Dia de Sorte, Super Sete, Timemania e futuras.
- Motor 100% desacoplado da UI, exposto por API pura (funções TS puras + Web Workers).
- Sem dependência de planilhas ou matrizes prontas; a “biblioteca clássica” será **gerada e cacheada** pelo próprio motor (não importada).

## Arquitetura (Hexagonal / DDD-lite)

```text
src/engine/closing/
  domain/            LotterySpec, ClosingRequest, ClosingResult, Guarantee, Score
  core/
    ClosingEngine.ts         # orquestrador (fachada da API)
    CoveringDesignEngine.ts  # C(v,k,t) — cobertura combinatória
    GreedyOptimizer.ts       # set-cover guloso + lazy greedy
    LocalSearch.ts           # hill-climbing + tabu
    SimulatedAnnealing.ts
    GeneticOptimizer.ts      # GA completo (pop, fitness, xover, mut, elitismo)
    BeamSearch.ts
    BranchAndBound.ts
    MonteCarloEngine.ts
    ConstraintSolver.ts      # filtros: pares/ímpares, soma, moldura, miolo, linhas, colunas, primos, Fibonacci, múltiplos, freq, atraso, fixas, excluídas
  analysis/
    CoverageCalculator.ts    # cobertura real / perdida / redundante
    ValidationEngine.ts      # prova a garantia matemática
    StatisticsAnalyzer.ts    # freq, atraso, dispersão, entropia
    ProbabilityEngine.ts     # p(k acertos), binomial/hipergeométrica
    ScoreEngine.ts           # nota final (cobertura, diversidade, redundância, eficiência, tempo)
  ai/
    AIRecommendationEngine.ts # recomenda tipo, tamanho, cobertura, custo-benefício
    HistoricalBacktester.ts   # 50/100/500/1000/todos
  io/
    importers/ (csv, xlsx, txt, json, xml)
    exporters/ (csv, xlsx, pdf, json)
  workers/
    genetic.worker.ts
    montecarlo.worker.ts
    backtest.worker.ts
  index.ts                    # API pública
```

### API pública (contratos)

```ts
generateClosing(req: ClosingRequest): Promise<ClosingResult>
validateClosing(games, spec, guarantee): ValidationReport
simulateClosing(games, spec, opts): MonteCarloReport
calculateCoverage(games, spec, t): CoverageReport
optimizeClosing(games, spec, strategy): ClosingResult
calculateGuarantee(games, spec): Guarantee
compareClosings(a, b, spec): ComparisonReport
generateGames(spec, constraints): number[][]
backtest(games, spec, window): BacktestReport
recommend(spec, profile): AIRecommendation
```

Nenhuma função consulta banco; persistência (histórico, favoritos, versões do editor) fica em edge functions separadas.

## Tipos de fechamento suportados

Todos implementados como **estratégias plugáveis** sobre o mesmo núcleo de cobertura, combinando um `Selector` (define o pool de dezenas / restrições) com o `Optimizer`:

Escolhidas · Eliminadas · Econômico · Garantido · Balanceado · Grupos · Pares/Ímpares · Moldura · Miolo · Linhas · Colunas · Fibonacci · Primos · Múltiplos · Soma · Frequência · Atraso · IA · Híbrido · Filtros personalizados.

## Algoritmos

- **Guloso set-cover** com lazy evaluation → baseline rápido.
- **Local Search / Hill Climbing / Tabu** → refino do guloso.
- **Simulated Annealing** → escape de ótimos locais.
- **Genético**: população, fitness multiobjetivo (cobertura, diversidade, redundância, score estatístico, score IA), torneio, crossover uniforme, mutação adaptativa, elitismo, parada por estagnação.
- **Beam Search / Branch & Bound** → instâncias pequenas com prova de otimalidade.
- **Monte Carlo**: milhões de simulações contra sorteios sintéticos e reais, com gráficos de convergência e distribuição.

## Validação e Score

`ValidationEngine` prova a garantia percorrendo todos os `C(pick, guarantee)` alvos e checando cobertura. `ScoreEngine` produz nota 0–100 ponderando cobertura, diversidade, redundância, eficiência (jogos/cobertura) e tempo.

## Backtesting histórico

Worker dedicado: janela de 50/100/500/1000/todos concursos, saída com acertos por faixa (ex.: 11–15 na Lotofácil), ROI, aproveitamento, heatmap de dezenas, ranking entre estratégias.

## IA de recomendação

`AIRecommendationEngine` combina heurística (perfil de risco, orçamento, garantia desejada) com chamada opcional a edge function `ai-closing-recommendation` (já existe) para justificar a escolha em linguagem natural. Nunca substitui o motor matemático — apenas escolhe parâmetros.

## Performance

- Bitset `Uint32Array` para representar jogos e alvos de cobertura.
- Memoization de `C(n,k)` e de coberturas parciais.
- Workers para GA / Monte Carlo / Backtest (não bloqueiam UI).
- Cache LRU por `(specHash, requestHash)` em memória + IndexedDB.
- Parada antecipada quando garantia é atingida.

## UI (mínimo viável, reaproveitando `FechamentoUniversalPage`)

- Wizard: modalidade → dezenas escolhidas/excluídas → tipo de fechamento → garantia/orçamento → gerar.
- Painel executivo: cobertura, garantia, eficiência, redução combinatória, score, ranking, comparação.
- Editor visual de matrizes (criar, editar, duplicar, versionar, importar/exportar CSV/XLSX/TXT/JSON/XML).
- Simulador histórico com gráficos.
- Biblioteca de fechamentos clássicos **gerados on-demand** (17×8, 18×12, 19×5/20, 20×25, 21×50, 22×100, 23×200, 24×400 …), cacheados.

## Qualidade

- TypeScript estrito, funções puras no núcleo, DI para optimizers.
- Vitest cobrindo: prova de garantia, cobertura, monotonicidade do guloso, invariantes do GA, backtest determinístico com seed.
- Documentação por módulo (`README.md` dentro de `engine/closing/`).

## Roteiro de entrega (fases)

Escopo grande — proponho entregar em fases sequenciais, cada uma testável isoladamente. **Cada fase = 1 turno de implementação.**

1. **Fase 1 — Núcleo matemático** (`domain`, `CoveringDesignEngine`, `GreedyOptimizer`, `CoverageCalculator`, `ValidationEngine`, `ProbabilityEngine`, `index.ts` da API) + testes. Já entrega `generateClosing` funcional para os 20 tipos via `ConstraintSolver` básico.
2. **Fase 2 — Otimizadores avançados**: `LocalSearch`, `SimulatedAnnealing`, `GeneticOptimizer`, `BeamSearch`, `BranchAndBound`, workers.
3. **Fase 3 — Monte Carlo + Backtesting histórico** com worker e gráficos.
4. **Fase 4 — ScoreEngine, StatisticsAnalyzer, AIRecommendationEngine** (+ edge function `ai-closing-recommendation` já existente).
5. **Fase 5 — IO**: importers/exporters (CSV, XLSX, TXT, JSON, XML) e editor visual de matrizes com versionamento.
6. **Fase 6 — Painel executivo** e integração final na `FechamentoUniversalPage` (comparação, ranking, dashboards).

## Perguntas antes de codar

1. Confirma que quer entregar em **6 fases sequenciais** (uma por turno) ou prefere um MVP mais enxuto (Fases 1+3+6) primeiro?
2. Para o editor visual + versionamento de matrizes salvas do usuário, posso criar tabelas novas no backend (`closing_matrices`, `closing_matrix_versions`) com RLS por `user_id`? (não são matrizes-fonte do motor, são criações do usuário.)
3. A “biblioteca de fechamentos clássicos” deve ser **gerada pelo motor e cacheada** (recomendado, mantém a promessa de zero matrizes fixas) ou você quer também aceitar upload de matrizes externas como referência?

Ao aprovar, começo pela **Fase 1** já no próximo turno.