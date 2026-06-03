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
  | "anti_popular";

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
}

export interface SimulatedGameResult {
  numbers: number[];
  avgHits: number;
  maxHits: number;
  minHits: number;
  hitDistribution: Record<number, number>;
  stabilityScore: number;
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
// TYPE GUARDS (bordas / runtime validation)
// ═══════════════════════════════════════════════════════

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function isCoverageValidation(x: unknown): x is CoverageValidation {
  if (!isRecord(x)) return false;
  return (
    typeof x.valid === "boolean" &&
    isFiniteNumber(x.coveragePercent) &&
    isFiniteNumber(x.worstCase) &&
    isFiniteNumber(x.testedCombinations)
  );
}

export function isWheelingRequest(x: unknown): x is WheelingRequest {
  if (!isRecord(x)) return false;
  return (
    typeof x.lotteryId === "string" &&
    Array.isArray(x.baseNumbers) &&
    x.baseNumbers.every((n) => isFiniteNumber(n)) &&
    isFiniteNumber(x.guarantee) &&
    isFiniteNumber(x.pick)
  );
}

export function isWheelingResult(x: unknown): x is WheelingResult {
  if (!isRecord(x)) return false;
  const xr = x as unknown as Partial<WheelingResult>;

  const gamesOk = Array.isArray(xr.games) && xr.games.every((g) => Array.isArray(g) && g.every((n) => isFiniteNumber(n)));

  return (
    gamesOk &&
    Array.isArray(xr.baseNumbers) &&
    xr.baseNumbers.every((n) => isFiniteNumber(n)) &&
    isFiniteNumber(xr.totalGames) &&
    isFiniteNumber(xr.guarantee) &&
    isFiniteNumber(xr.estimatedCost) &&
    isCoverageValidation(xr.coverageValidation) &&
    typeof xr.explanation === "string"
  );
}

export function isAIRequest(x: unknown): x is AIRequest {

  if (!isRecord(x)) return false;
  if (typeof x.input !== "string") return false;
  if (x.lotteryId !== undefined && typeof x.lotteryId !== "string") return false;
  if (x.existingGames !== undefined) {
    if (!Array.isArray(x.existingGames) || !x.existingGames.every((g) => Array.isArray(g))) return false;
  }
  if (x.draws !== undefined && !Array.isArray(x.draws)) return false;
  if (x.stats !== undefined && !Array.isArray(x.stats)) return false;
  return true;
}

export function isAIResponse(x: unknown): x is AIResponse {
  if (!isRecord(x)) return false;
  const xr = x as unknown as Partial<AIResponse>;

  if (typeof xr.intent !== "string") return false;
  if (typeof xr.explanation !== "string") return false;
  if (!Array.isArray(xr.suggestions)) return false;
  if (!isRecord(xr.metadata)) return false;

  return true;
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
