# FASE 2 — Arquitetura Enterprise (Improve in Place)

Objetivo: modularizar e introduzir governança de camadas **sem rewrite**, preservando engines e funcionalidades.

## Regras
- Não remover features.
- Não quebrar contratos públicos existentes (manter compatibilidade via reexports/aliases).
- Mudanças pequenas em “ilhas”, sempre com build/test após cada ilha.

## Estratégia
1) **Contracts & DTOs primeiro**: reduzir `any` nas bordas (UI↔application↔domain↔infrastructure e AI↔engines↔workers).
2) **Modularização por reexports**: mover lógica com reexports para manter import paths estáveis.
3) **Governança de camadas**: garantir que pages chamem serviços application; engines não devem importar helpers UI.
4) **Hotfixes seguros** antes de refactors maiores:
   - remover hardcode admin e usar RBAC fonte de verdade
   - tuning QueryClient
   - typing hardening mínimo em AI/worker payloads

## Entregáveis por etapa

### Etapa A — Contracts & DTOs (sem mudar runtime)
- Criar/centralizar tipos:
  - `AIRequest/AIResponse`
  - `WheelingRequest/WheelingResult` (e outros engines relevantes)
  - `WorkerJob/WorkerResult` (padronização)
  - `Plan/Subscription` shapes
- Criar type guards (ex.: `isAIResponse`, `isWorkerResult`).
- Atualizar gradualmente assinaturas internas onde `any` for encontrado no fluxo crítico.

### Etapa B — Modularização por reexports
- Criar estrutura de pastas:
  - `src/core/` (types, errors, utils, constants)
  - `src/modules/` (auth, ai, analytics, lottery, subscriptions, billing, admin, dashboard, community, marketplace)
  - `src/shared/` (ui, hooks, providers, services, adapters, repositories)
- Implementar “ponte”:
  - Reexportar engines atuais para `src/modules/ai/*`
  - Reexportar integrações atuais para `src/shared/*`

### Etapa C — Governança de camadas
- Aplicar organização em 2–3 fluxos (começar por AI e Auth):
  - presentation (pages/components)
  - application (services/coordinator)
  - domain (engines/algoritmos)
  - infrastructure (supabase/integrations)
- Criar camadas com interfaces mínimas.

## Ordem recomendada (para reduzir risco)
1. Security hotfix (admin hardcode)
2. QueryClient tuning
3. Typing hardening em AI payloads
4. Worker job/result typing
5. Reexports/modularização por etapas
6. Governança de camadas

## Critérios de “done”
- `npm run build` passa.
- `vitest` passa.
- Import paths antigos continuam funcionando.
- `any` no fluxo crítico reduzido sem quebrar o comportamento.

## Evidências a registrar a cada ilha
- WHAT CHANGED
- WHY
- IMPACT
- RISKS
- TEST RESULTS

