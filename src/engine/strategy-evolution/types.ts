/**
 * Strategy Evolution Engine — Types
 * Motor Autoevolutivo de Estratégias, Ranking e Recomendação
 */

import { Strategy } from "../strategies";

export type EvolutionProfile = "economico" | "equilibrado" | "agressivo" | "profissional" | "cobertura_extrema";

export interface StrategyDefinition {
  id: string;
  name: string;
  description: string;
  category: "basic" | "math" | "ai" | "hybrid" | "coverage";
  baseStrategy: Strategy;
  params: StrategyParams;
  supportedLotteries: string[];  // empty = all
}

export interface StrategyParams {
  parityWeight: number;       // 0-1
  frequencyWeight: number;    // 0-1
  delayWeight: number;        // 0-1
  trendWeight: number;        // 0-1
  cycleWeight: number;        // 0-1
  dispersalWeight: number;    // 0-1
  repeatFromLastWeight: number; // 0-1
  sumBalanceWeight: number;   // 0-1
}

export const DEFAULT_PARAMS: StrategyParams = {
  parityWeight: 0.5,
  frequencyWeight: 0.5,
  delayWeight: 0.5,
  trendWeight: 0.5,
  cycleWeight: 0.5,
  dispersalWeight: 0.5,
  repeatFromLastWeight: 0.3,
  sumBalanceWeight: 0.5,
};

export interface StrategyExecution {
  strategyId: string;
  lotteryId: string;
  games: number[][];
  drawsUsed: number;         // how many historical draws tested
  drawRange: [number, number]; // [startConcurso, endConcurso]
  timestamp: number;
}

export interface StrategyMetrics {
  avgHits: number;
  bestHits: number;
  worstHits: number;
  consistency: number;        // 0-1 (1-coeffOfVariation)
  hitDistribution: Record<number, number>; // hits -> count
  totalPrizes: number;        // count of prize-winning results
  costPerGame: number;
  coverageScore: number;      // 0-100
  diversityScore: number;     // 0-100
  redundancyIndex: number;    // 0-1
  globalScore: number;        // 0-100 composite
}

export interface RankingEntry {
  rank: number;
  strategyId: string;
  strategyName: string;
  lotteryId: string;
  metrics: StrategyMetrics;
  trend: "up" | "down" | "stable";
  executions: number;
  lastTestedAt: number;
  explanation: string;
}

export interface EvolutionSuggestion {
  type: "adjust_param" | "combine" | "discard" | "promote";
  sourceStrategy: string;
  targetParam?: keyof StrategyParams;
  suggestedValue?: number;
  reason: string;
  expectedImprovement: number; // estimated % improvement
  confidence: number;          // 0-1
}

export interface LabConfig {
  lotteryId: string;
  strategies: string[];
  gamesPerStrategy: number;
  drawRange: [number, number];
  profile: EvolutionProfile;
}

export interface StrategyGames {
  strategyId: string;
  strategyName: string;
  games: number[][];
  metrics: StrategyMetrics;
}

export interface LabResult {
  config: LabConfig;
  rankings: RankingEntry[];
  suggestions: EvolutionSuggestion[];
  bestStrategy: RankingEntry | null;
  insights: string[];
  elapsedMs: number;
  generatedGames: StrategyGames[];
}
