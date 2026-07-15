/**
 * Módulo AI — fachada de reexports (FASE 2 · Passo 2).
 * Mantém import paths antigos funcionando; nenhum código foi movido.
 */
export * from "@/ai/core/aiTypes";
export { NativeAIOrchestrator } from "@/ai/core/nativeAIOrchestrator";
export { detectIntent } from "@/ai/intent/detectIntent";
export { generateUniversalGames } from "@/ai/generators/universalGameGenerator";
export * from "@/core/contracts/ai";
