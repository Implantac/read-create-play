/**
 * Módulo Lottery — fachada de reexports (FASE 2 · Passo 2).
 */
export * from "@/data/lotteries";
export * from "@/features/lottery/constants";
export * from "@/features/lottery/utils/stats-utils";
export { useLotteryContext, useLotteryContextSafe, LotteryProvider } from "@/contexts/LotteryContext";
