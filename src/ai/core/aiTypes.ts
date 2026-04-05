/**
 * Native AI Core — Types & Interfaces
 * Central type definitions for the entire AI system
 */

import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";

// ═══════════════════════════════════════════════════════
// INTENT TYPES
// ═══════════════════════════════════════════════════════

export type AIIntent =
  | "generate_games"
  | "create_wheeling"
  | "simulate"
  | "analyze_history"
  | "rank_games"
  | "explain_strategy"
  | "compare_games"
  | "suggest_strategy";

export type RiskProfile =
  | "conservative"
  | "balanced"
  | "aggressive"
  | "statistical"
  | "exploratory"
  | "max_coverage"
  | "anti_popular"
  | "markov"
  | "momentum"
  | "harmonic"
  | "regression";

export interface ParsedIntent {
  intent: AIIntent;
  lotteryId: string | null;
  quantity: number;
  riskProfile: RiskProfile;
  filters: IntentFilters;
  historyWindow: number;
  wheelingBase: number | null;
  rawInput: string;
  confidence: number;
}

export interface IntentFilters {
  avoidSequences: boolean;
  balanceParity: boolean;
  balanceHighLow: boolean;
  prioritizeHot: boolean;
  prioritizeCold: boolean;
  frameCenter: boolean;
  limitRepetition: boolean;
  customNumbers?: number[];
  excludeNumbers?: number[];
}

// ═══════════════════════════════════════════════════════
// ENGINE RESULT TYPES
// ═══════════════════════════════════════════════════════

export interface ScoredGame {
  numbers: number[];
  scores: GameScores;
  totalScore: number;
  grade: "S" | "A" | "B" | "C" | "D" | "F";
  explanation: string[];
  roiTier?: "excellent" | "good" | "average" | "below_average";
  roiScore?: number;
}

export interface GameScores {
  statistical: number;   // 0-100
  structural: number;    // 0-100
  coverage: number;      // 0-100
  diversity: number;     // 0-100
  strategyFit: number;   // 0-100
  probability: number;   // 0-100
}

export interface PatternAnalysis {
  parityRatio: { even: number; odd: number };
  sumValue: number;
  sumZone: "low" | "normal" | "high";
  rowDistribution: number[];
  colDistribution: number[];
  frameCount: number;
  centerCount: number;
  maxSequence: number;
  consecutivePairs: number;
  highLowRatio: { high: number; low: number };
  primeCount: number;
  fibonacciCount: number;
  repeatFromPrevious: number;
}

export interface SimulationResult {
  totalSimulations: number;
  games: SimulatedGameResult[];
  avgHits: number;
  hitDistribution: Record<number, number>;
  bestGame: { numbers: number[]; avgHits: number };
  worstGame: { numbers: number[]; avgHits: number };
  strategyComparison?: StrategyComparison[];
  avgPrizeRate?: number;
  avgStability?: number;
  confidenceInterval?: { lower: number; upper: number; confidence: number };
  statisticalSignificance?: { tStatistic: number; significant: boolean; expectedRandom: number };
  diversityScore?: number;
}

export interface SimulatedGameResult {
  numbers: number[];
  avgHits: number;
  maxHits: number;
  minHits: number;
  hitDistribution: Record<number, number>;
  stabilityScore: number;
  prizeRate?: number;
  consistencyScore?: number;
  prizeDistribution?: Record<number, number>;
}

export interface StrategyComparison {
  strategy: string;
  avgHits: number;
  maxHits: number;
  winRate: Record<number, number>;
}

// ═══════════════════════════════════════════════════════
// WHEELING TYPES
// ═══════════════════════════════════════════════════════

export interface WheelingRequest {
  lotteryId: string;
  baseNumbers: number[];
  guarantee: number;         // min points guaranteed
  pick: number;              // numbers per game
}

export interface WheelingResult {
  games: number[][];
  baseNumbers: number[];
  totalGames: number;
  guarantee: number;
  estimatedCost: number;
  coverageValidation: CoverageValidation;
  explanation: string;
}

export interface CoverageValidation {
  valid: boolean;
  coveragePercent: number;
  worstCase: number;
  testedCombinations: number;
}

// ═══════════════════════════════════════════════════════
// ORCHESTRATOR TYPES
// ═══════════════════════════════════════════════════════

export interface AIRequest {
  input: string;
  lotteryId?: string;
  draws?: DrawResult[];
  stats?: NumberStats[];
  config?: LotteryConfig;
  existingGames?: number[][];
}

export interface AIResponse {
  intent: AIIntent;
  games?: ScoredGame[];
  wheeling?: WheelingResult;
  simulation?: SimulationResult;
  analysis?: HistoricalAnalysis;
  ranking?: ScoredGame[];
  explanation: string;
  suggestions: string[];
  metadata: ResponseMetadata;
}

export interface HistoricalAnalysis {
  window: number;
  hotNumbers: number[];
  coldNumbers: number[];
  dueNumbers: number[];
  avgSum: number;
  avgEven: number;
  avgRepeat: number;
  patterns: string[];
  recommendations: string[];
}

export interface ResponseMetadata {
  processingTimeMs: number;
  enginesUsed: string[];
  confidence: number;
  cached: boolean;
}

// ═══════════════════════════════════════════════════════
// LOTTERY KNOWLEDGE TYPES
// ═══════════════════════════════════════════════════════

export interface LotteryRules {
  id: string;
  name: string;
  totalNumbers: number;
  pick: number;
  minBet: number;
  maxBet: number;
  ticketPrice: number;
  drawDays: string[];
  hasGrid: boolean;
  gridRows: number;
  gridCols: number;
  prizeTiers: { hits: number; description: string }[];
  odds: Record<number, number>;
  idealSumRange: [number, number];
  idealParityRange: [number, number]; // even numbers
  idealFrameRange?: [number, number];
  avgRepeatFromPrevious: [number, number];
  maxRecommendedSequence: number;
}
