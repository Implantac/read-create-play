/**
 * Módulo AI — fachada de reexports (FASE 2 · Passos 2-3).
 */
export * from "@/ai/core/aiTypes";
export { NativeAIOrchestrator } from "@/ai/core/nativeAIOrchestrator";
export { detectIntent } from "@/ai/intent/detectIntent";
export { generateGames } from "@/ai/generators/universalGameGenerator";
export * from "./application/aiService";
