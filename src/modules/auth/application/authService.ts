/**
 * Auth application service (FASE 2 · Passo 3).
 *
 * Reexporta as operações de auth atuais como um único ponto de entrada para
 * pages/components — a intenção é que a UI deixe de importar diretamente de
 * `@/features/auth/services/*` em novas migrações.
 */
export {
  checkAdminStatus,
  syncSubscriptionPlan,
} from "@/features/auth/services/auth-queries";
