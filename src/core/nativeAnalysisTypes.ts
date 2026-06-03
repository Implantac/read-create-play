import type { LotteryConfig } from "@/data/lotteries";

export type NativePatternAnalysisReport = {
  summary?: { avgSum?: number; sumStdDev?: number; overallScore?: number };
  parityPatterns?: Array<{ evens: number; odds: number; percentage: number }>;
  sumPatterns?: Array<{ count: number; rangeLabel: string; percentage: number }>;
  consecutivePatterns?: Array<{
    count: number;
    consecutive: number;
    percentage: number;
  }>;
  spatialDistribution?: { sectors?: Array<{ label: string; avgCount: number }> };
  hotStreaks?: unknown[];
  frequencyTrends?: Array<{ number: number; momentum: number }>;
  cooccurrenceMatrix?: Array<{ num1: number; num2: number; count: number; lift?: number }>;
  cycleDetection?: Array<{
    status: string;
    number: number;
    currentGap: number;
    avgCycle: number;
  }>;
};


export type SimulationBetSummary = {
  avgHits: number;
  bestHit?: number;
  prizeCount?: number;
  stability?: number;
  bet?: number[];
};

export type SimulationData = {
  bets?: SimulationBetSummary[];
  totalDraws?: number;
};

export type MassiveTopGame = {
  numbers?: number[];
  score?: number;
};

export type DistributionSummary = {
  avgSum?: number;
  avgEvenRatio?: number;
  avgSpread?: number;
  avgPrizeRate?: number;
  bestHitOverall?: number;
};

export type PatternInsights = {
  dominantParity?: string;
  sumTrend?: string;
};

export type AutonomousRanking = { number: number; compositeScore: number };
export type AutonomousGap = { currentGap: number; avgGap: number; number: number };
export type AutonomousMarkov = { from: number; to: number; count: number };
export type AutonomousPattern = {
  type?: string;
  name?: string;
  description?: string;
  score?: number;
};
export type AutonomousShift = {
  direction: "up" | "down" | string;
  shift: number;
  number: number;
};

export type AutonomousReport = {
  confidenceScore?: number;
  rankings?: AutonomousRanking[];
  patterns?: AutonomousPattern[];
  shifts?: AutonomousShift[];
  entropyAnalysis?: { entropy?: number };
  chiSquareResult?: { chiSquare?: number; pValue?: number };
  gapAnalysis?: AutonomousGap[];
  markovTransitions?: AutonomousMarkov[];
  topCooccurrences?: unknown[];
};

