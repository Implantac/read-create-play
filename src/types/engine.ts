import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { NumberStats } from "@/features/statistics/engine";
import { Strategy } from "@/features/statistics/strategies";

export type GenerationMode = "random" | "statistical" | "ai_weighted" | "hybrid";

export interface PatternInsight {
  label: string;
  description: string;
  value: string;
  trend: "positive" | "negative" | "neutral";
}

export interface DistributionSummary {
  avgSum: number;
  avgEvenRatio: number;
  avgConsecutive: number;
  avgSpread: number;
  bestHitOverall: number;
  avgPrizeRate: number;
}

export interface SimulatedGame {
  numbers: number[];
  totalHits: number;
  avgHits: number;
  bestHit: number;
  prizeCount: number;
  hitDistribution: Record<number, number>;
  stability: number; 
  score: number; 
  evenCount: number;
  oddCount: number;
  sum: number;
  consecutivePairs: number;
  rangeSpread: number;
  clusters: number;
}

export interface MassiveSimJob {
  config: LotteryConfig;
  draws: DrawResult[];
  stats: NumberStats[];
  totalGames: number;
  mode: GenerationMode;
  batchSize: number;
  topN: number;
}

export interface MassiveSimProgress {
  gamesGenerated: number;
  gamesEvaluated: number;
  totalGames: number;
  elapsedMs: number;
  opsPerSecond: number;
  phase: "generating" | "evaluating" | "filtering" | "done";
}

export interface MassiveSimResult {
  topGames: SimulatedGame[];
  totalGenerated: number;
  totalEvaluated: number;
  elapsedMs: number;
  opsPerSecond: number;
  patternInsights: PatternInsight[];
  distributionSummary: DistributionSummary;
}

export interface ProfessionalBet {
  numbers: number[];
  strategy: string;
  strategyLabel: string;
  quality: any;
  statisticalScore: number;
  probabilityEstimate: number;
  rank: number;
}

export interface MassiveSimConfig {
  iterations: number;
  strategies: Strategy[];
  config: LotteryConfig;
  compareWithRandom: boolean;
}

export interface StrategyPerformance {
  strategy: Strategy;
  label: string;
  totalGames: number;
  hitDistribution: Record<number, number>;
  avgHits: number;
  bestHit: number;
  hitRate4Plus: number;
  hitRate5Plus: number;
  hitRateFull: number;
  expectedValue: number;
  consistency: number;
}

export interface MonteCarloResult {
  totalIterations: number;
  elapsedMs: number;
  performances: StrategyPerformance[];
  convergenceData: { iteration: number; avgHits: number; strategy: string }[];
  yearlyProjection: YearlyProjection[];
  robustnessScore: number;
}

export interface YearlyProjection {
  strategy: string;
  gamesPerYear: number;
  expectedHits4Plus: number;
  expectedHits5Plus: number;
  expectedFullHits: number;
  roi: number;
}
