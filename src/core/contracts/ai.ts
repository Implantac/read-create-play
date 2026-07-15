/**
 * AI pipeline contracts — reexports from `@/ai/core/aiTypes` so callers can
 * depend on a stable `@/core/contracts` surface instead of the engine folder.
 *
 * No new types are declared here on purpose: this is the boundary DTO layer,
 * not the domain model.
 */

export type {
  AIRequest,
  AIResponse,
  AIIntent,
  ParsedIntent,
  ResponseMetadata,
  HistoricalAnalysis,
  ScoredGame,
  WheelingResult,
  SimulationResult,
} from "@/ai/core/aiTypes";

export type { DrawResult, LotteryConfig } from "@/data/lotteries";
export type { NumberStats } from "@/engine/stats/statistics";

export {
  isAIRequest,
  isAIResponse,
  isWheelingResult,
} from "@/ai/core/aiTypes";
