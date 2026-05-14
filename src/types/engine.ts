import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";

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
  stability: number; // lower = more consistent
  score: number; // composite rank score
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
  quality: any; // Using any for now to avoid circular deps with bet-quality
  statisticalScore: number;
  probabilityEstimate: number;
  rank: number;
}
