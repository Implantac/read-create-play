# TODO (blackboxai) — READ CREATE PLAY (Improve in Place)

> Direção: FASE 2 após FASE 1 concluída.
> Regra: NÃO recriar o projeto, NÃO destruir funcionalidades.

## Status Geral
- [x] FASE 1 — Auditoria técnica profunda (relatório consolidado)
- [ ] FASE 2 — Arquitetura enterprise modular (refatoração incremental)
- [ ] FASE 3 — Evolução AI Platform (pipeline, fallback, trace, copilot)
- [ ] FASE 4 — Performance extrema (Query tuning, render, workers)
- [ ] FASE 5 — Segurança enterprise (RBAC, env hardening, Supabase RLS)
- [ ] FASE 6-13 — State mgmt, testing, observability, SaaS premium, community, UX premium, analytics, clean code

---

## FASE 2 — Arquitetura enterprise modular (sem rewrite)

### Passo 1: Contracts & DTOs (foundation)
- [ ] Criar/centralizar tipos de payload para:
  - AIRequest/AIResponse (ajustar para evitar casts)
  - Worker job/result
  - Subscription/Plan (shape de dados vindos de funções)
- [ ] Introduzir validação leve (type guards) nos pontos de borda (UI e handlers)

### Passo 2: Modularização por reexports (in place)
- [ ] Criar estrutura de pastas (somente organização + reexports no início):
  - src/core/*
  - src/modules/*
  - src/shared/*
- [ ] Evitar reescrever engines: engines continuam onde estão, mas passam a ser expostas por contratos em `src/modules/ai/*`.

### Passo 3: Governança de camadas
- [ ] Garantir que pages chamem apenas “application services” (sem misturar lógica de domínio)
- [ ] Introduzir camadas gradualmente (somente onde houver maior mistura/duplicação)

---

## Primeiros “hotfixes” recomendados (ordem segura)

### 1) Segurança: remover hardcode de admin email
- [ ] Trocar FULL_ACCESS_EMAIL por RBAC/claims vindo de `user_roles` (ou tabela/claim dedicada)
- [ ] Manter comportamento atual via fallback temporário (sem quebrar acesso)

### 2) Performance baseline
- [ ] Tuning do QueryClient no `App.tsx` (staleTime/cacheTime/retry/refetch)

### 3) Typing hardening mínimo
- [ ] Começar pelo caminho crítico: AI pipeline input/output (reduzir `any`)
- [ ] Depois workers (job/result) — reduzir `any[]` e `job: any`

---

## Passo extra (legado): Verificar recursos removidos
- [x] Confirmar existência da rota `/gerador` e componentes principais.
- [ ] Buscar no repositório por nomes de recursos/strings de UI antigas (somente se necessário)
- [ ] Rodar build/test e validar rotas/componentes


