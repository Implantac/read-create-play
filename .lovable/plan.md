
# Motor Universal de Fechamentos — Plano de Implementação

Este é um módulo grande. Proponho entregar em **4 fases incrementais**, cada uma funcional e testável. Antes de codar, quero confirmar escopo e prioridades com você.

---

## Visão

Um motor matemático genérico (`ClosingEngine`) que gera fechamentos **dinamicamente** para qualquer loteria, sem depender de matrizes fixas em banco. Configurado apenas por parâmetros (`totalNumbers`, `pick`, `guarantee`, `budget`).

Arquitetura hexagonal: **core matemático puro** (sem React, sem Supabase) + **adapters** (UI, workers, API).

```text
src/engine/closing/
├── core/                    # Domínio puro
│   ├── types.ts             # ClosingRequest, ClosingResult, Coverage, Score
│   ├── ClosingEngine.ts     # Facade/orquestrador
│   └── config.ts            # Parâmetros por modalidade (deriva de LOTTERIES)
├── generators/
│   ├── GreedyOptimizer.ts
│   ├── GeneticOptimizer.ts
│   ├── SimulatedAnnealing.ts
│   ├── HillClimbing.ts
│   ├── BeamSearch.ts
│   ├── Backtracking.ts
│   ├── BranchAndBound.ts
│   └── CoveringDesignEngine.ts  # Schönheim bound + construções conhecidas
├── validation/
│   ├── CoverageCalculator.ts    # C(k,t) real vs teórico
│   ├── ValidationEngine.ts      # garantia, cobertura, redundância
│   └── ConstraintSolver.ts
├── scoring/
│   ├── ScoreEngine.ts           # 0-100 multi-critério
│   ├── ProbabilityEngine.ts
│   └── StatisticsAnalyzer.ts
├── simulation/
│   ├── MonteCarloEngine.ts
│   └── HistoricalBacktest.ts
├── ai/
│   └── AIRecommendationEngine.ts
└── filters/                     # Filtros de tipos de fechamento
    ├── frameMioloFilter.ts, parityFilter.ts, sumFilter.ts,
    └── primesFilter.ts, fibonacciFilter.ts, delayFilter.ts, ...

src/workers/closing.worker.ts    # Roda GA/MC fora da main thread
src/pages/FechamentoUniversalPage.tsx
src/components/closing/          # UI: wizard, dashboard, editor, backtest
```

Toda a UI consome o motor via API pública:
`generateClosing`, `validateClosing`, `simulateClosing`, `calculateCoverage`, `optimizeClosing`, `calculateGuarantee`, `compareClosings`.

---

## Fases

### Fase 1 — Núcleo matemático + Greedy + Validação (MVP funcional)
- Tipos, `ClosingEngine` facade, config por modalidade.
- `CoverageCalculator` (cobertura t-cover exata para pequenos, amostragem para grandes).
- `GreedyOptimizer` com t-cover (algoritmo clássico de set cover) — já produz fechamentos utilizáveis.
- `ValidationEngine` (garantia matemática, cobertura %, redundância, eficiência).
- `ScoreEngine` v1 (cobertura, diversidade, redundância, eficiência).
- Página `Fechamentos` refeita com wizard: escolhe loteria → escolhe dezenas → define garantia → gera → mostra jogos + score + validação.
- Testes unitários dos algoritmos-chave.

### Fase 2 — Otimização avançada + Workers
- `GeneticOptimizer` completo (população, fitness, crossover, mutação, elitismo, parada adaptativa).
- `SimulatedAnnealing`, `HillClimbing`, `BeamSearch`.
- `CoveringDesignEngine` com Schönheim lower bound e construções recursivas.
- Web Worker para GA/SA/MC (não trava UI).
- Comparação lado-a-lado de estratégias (Greedy vs GA vs SA).

### Fase 3 — Simulação + Backtest histórico + Dashboard
- `MonteCarloEngine` (milhões de simulações, distribuição de acertos, convergência).
- `HistoricalBacktest` sobre últimos 50/100/500/1000/todos concursos usando `lottery_draws`.
- Dashboard executivo: cobertura, garantia, ROI, heatmap de acertos, ranking, gráficos (Recharts já no projeto).
- Filtros de tipos de fechamento (moldura, miolo, pares/ímpares, soma, primos, Fibonacci, atraso, frequência).

### Fase 4 — IA + Biblioteca + Editor + Import/Export
- `AIRecommendationEngine`: recomenda melhor fechamento por perfil (custo/benefício, risco, retorno histórico) usando Lovable AI Gateway apenas para explicações, com decisão numérica em código.
- Biblioteca de fechamentos clássicos (17x8, 18x12, 19x20, 20x25, 21x50 etc.) — **gerados on-demand pelo próprio motor**, não hardcoded.
- Editor visual de matrizes: criar, editar, duplicar, versionar. Persistência em nova tabela `user_closings` (RLS por usuário).
- Import/Export: CSV, TXT, JSON, XLSX (usa `xlsx` já no projeto).

---

## Perguntas de escopo antes de começar

1. **Ponto de partida da UI**: substituir a atual `FechamentosPage` ou criar rota nova `/fechamento-universal` e manter a antiga como legado?
2. **Persistência**: os fechamentos gerados devem ser salváveis por usuário (nova tabela `user_closings`)? Isso vira Fase 4, mas quero confirmar.
3. **Prioridade do MVP**: fecha na Fase 1 (Greedy + validação usável em produção) ou você prefere que eu emende Fase 1+2 num único envio para já ter GA?
4. **Escopo desta primeira entrega**: começo pela Fase 1 completa nesta rodada?

---

## Notas técnicas

- Todo o core é **TypeScript puro sem dependências de React/Supabase** — testável isoladamente, portável para worker.
- Uso `LOTTERIES` de `src/data/lotteries.ts` e `LOTTERY_RULES` de `src/ai/knowledge/lotteriesKnowledge.ts` como fonte de parâmetros. Nada específico por loteria no motor.
- Reaproveito `src/engine/wheeling/coverageValidator.ts` e `src/engine/lottery-wheels.ts` onde couber (refatorando, não duplicando).
- Workers seguem o padrão de `src/workers/monte-carlo.worker.ts`.
- Sem alterações em endpoints de API existentes (respeitando a memória do projeto).
