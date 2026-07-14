
# Fase 3 — Motor Universal de Fechamentos

Extensão do que já existe (`src/engine/closing/*`, `MonteCarloEngine`, `HistoricalBacktest`, worker assíncrono, `closing_history`, `FechamentoUniversalPage`). Nada será recriado — só adicionado ou reforçado sobre a arquitetura atual, respeitando a regra de memória "NEVER recreate features".

## Entregas (em 4 ondas)

### Onda 1 — Constraint Solver + Fechamentos temáticos
Novo módulo `src/engine/closing/constraints/` plugável no `ClosingEngine`:
- `ConstraintSolver.ts`: aplica filtros no espaço de jogos gerados por qualquer gerador.
- Constraints puros: `parityConstraint`, `sumConstraint`, `primesConstraint`, `fibonacciConstraint`, `multiplesConstraint`, `frameCoreConstraint` (moldura/miolo, genérico via `lotteryProfiles`), `rowsColsConstraint`, `groupsConstraint`, `excludedNumbersConstraint`.
- Constraints estatísticos (usam `statisticsEngine` existente): `frequencyConstraint`, `delayConstraint`.
- Presets prontos: Econômico, Garantido, Balanceado, Híbrido, "Por IA" (delegam para o `AIRecommendationEngine` da Onda 4).
- UI: novo painel `ClosingConstraintsPanel` em `FechamentoUniversalPage` com abas (Geométrico / Aritmético / Estatístico), toggles e sliders.

### Onda 2 — Biblioteca de fechamentos clássicos
- `src/engine/closing/library/classicClosings.ts`: catálogo de metadados (17x8, 18x12, 19x5, 19x20, 20x25, 21x50, 22x100, 23x200, 24x400 e equivalentes para Mega/Quina/Lotomania), cada entrada com `{ base, min_hits, games, coverage, complexity, origin, applicableLotteries[] }`.
- Não guarda matrizes — cada preset apenas dispara `ClosingEngine.generate()` com os parâmetros exatos. Assim continua tudo dinâmico.
- Componente `ClosingLibraryPanel` (lista consultável, filtros por modalidade/garantia/custo, botão "Aplicar preset").

### Onda 3 — Editor visual + Import/Export universal
- `src/engine/closing/io/`: `parsers/{csv,txt,json,xml,xlsx}.ts` + `serializers/*` + `ClosingMatrixSchema.ts` (validação Zod).
- Componente `ClosingMatrixEditor`: grid editável (linhas = jogos, colunas = dezenas), duplicar/reordenar/versionar em `closing_history` (adiciona coluna `parent_id` via migração para linhagem).
- Botões: Importar (aceita `.csv .txt .json .xml .xlsx`), Exportar (mesmos formatos + PDF via `jspdf` existente).
- Validação usa o `ValidationEngine` atual antes de salvar.

### Onda 4 — AG/MC reforçados + AIRecommendationEngine
- `GeneticOptimizer.ts` (upgrade): fitness multi-objetivo (cobertura + diversidade Jaccard + redundância + peso estatístico + score IA), elitismo N=2, torneio, mutação adaptativa, parada por estagnação, seed opcional.
- `MonteCarloEngine.ts` (upgrade): curva de convergência, IC 95%, heatmap por dezena, distribuição de acertos, exportação dos dados brutos.
- `src/engine/closing/ai/AIRecommendationEngine.ts`: recebe `{ baseNumbers, lotteryId, historicalDraws, budget?, riskProfile? }` e retorna `{ strategy, minHits, maxGames, expectedCoverage, expectedROI, rationale[] }`. Consulta Lovable AI (`google/gemini-3-flash-preview`) via edge function nova `supabase/functions/ai-closing-recommendation` para gerar rationale em português; heurística local cobre fallback offline (Elite = maior cobertura, Free = menor custo, etc.).
- Painel `ClosingAIRecommendationPanel`: card com sugestão + explicabilidade + botão "Aplicar recomendação".

## Detalhes técnicos

**Arquitetura**
```text
ClosingEngine (existente)
  ├─ generators/           [existente: Greedy, HC, SA, Genetic, CoveringDesign]
  ├─ core/CoverEval        [existente]
  ├─ simulation/           [existente: MonteCarlo, HistoricalBacktest]
  ├─ constraints/          [NOVO — Onda 1]
  ├─ library/              [NOVO — Onda 2]
  ├─ io/                   [NOVO — Onda 3]
  └─ ai/                   [NOVO — Onda 4]
```

**Contrato do ConstraintSolver**
```ts
type Constraint = {
  id: string;
  label: string;
  test: (game: number[], ctx: ConstraintContext) => boolean;
};
solver.filter(games, activeConstraints) → { kept, rejected, stats }
```
Roda depois do gerador; se sobrar menos que `maxGames`, aciona re-geração automática com pesos ajustados (loop máximo de 3 tentativas para não travar).

**Banco**
- Migração única (Onda 3): adiciona `parent_id uuid`, `version int default 1`, `source text` em `closing_history`, mantém RLS e grants existentes.

**Performance**
- Constraints e AG rodam no `closing.worker.ts` já existente (progresso e cancelamento já funcionam).
- Parsers XLSX via `xlsx` (lazy import) só no editor.

**Testes**
- Vitest para: cada constraint (input/output determinístico), `ConstraintSolver` (composição AND), `classicClosings` (metadados coerentes), parsers (round-trip CSV/JSON), fitness do AG (monotonicidade).

## Fora do escopo desta fase
- Substituir motores existentes (respeita memória "NEVER recreate features").
- Alterar API pública já usada pela `FechamentoUniversalPage`.
- Matrizes fixas em BD (proibido pela especificação).

## Ordem de execução
Onda 1 → 2 → 3 → 4, cada onda em um turno separado com validação de build entre elas. Prossigo com a Onda 1 na aprovação.
