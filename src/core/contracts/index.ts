/**
 * Central contract surface (FASE 2 — Passo 1).
 *
 * Consumers should import boundary DTOs and their guards from here:
 *   import { AIRequest, isAIRequest, PlanType, isCheckSubscriptionResponse } from "@/core/contracts";
 *
 * This barrel does NOT introduce new domain logic — it only centralises the
 * shapes that cross module boundaries (AI pipeline, workers, edge functions,
 * auth) so that call sites can stop using `any`.
 */

export * from "./ai";
export * from "./auth";
export * from "./subscription";
export * from "./worker";
