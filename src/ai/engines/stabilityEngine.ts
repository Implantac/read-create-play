/**
 * Native AI — Stability & Dampening Engine
 * Ensures gradual weight evolution and prevents erratic behavior.
 * PURE OVERLAY — no existing logic modified.
 */

import type { AdaptiveWeights } from "./adaptiveEngine";

// ═══════════════════════════════════════════════════════
// 1. EXPONENTIAL MOVING AVERAGE (EMA) FOR WEIGHT SMOOTHING
// ═══════════════════════════════════════════════════════

const weightHistory: Map<string, AdaptiveWeights[]> = new Map();
const EMA_ALPHA = 0.3; // smoothing factor — lower = more stable

/** Get a cache key for lottery+profile combo */
function cacheKey(lotteryId: string, riskProfile: string): string {
  return `${lotteryId}::${riskProfile}`;
}

/** Apply EMA smoothing to prevent abrupt weight changes */
export function smoothWeights(
  newWeights: AdaptiveWeights,
  lotteryId: string,
  riskProfile: string
): AdaptiveWeights {
  const key = cacheKey(lotteryId, riskProfile);
  const history = weightHistory.get(key) || [];

  if (history.length === 0) {
    history.push({ ...newWeights });
    weightHistory.set(key, history);
    return newWeights;
  }

  const prev = history[history.length - 1];
  const smoothed: AdaptiveWeights = { ...newWeights };
  const keys = Object.keys(smoothed) as (keyof AdaptiveWeights)[];

  for (const k of keys) {
    // EMA: new = alpha * current + (1-alpha) * previous
    smoothed[k] = EMA_ALPHA * newWeights[k] + (1 - EMA_ALPHA) * prev[k];
    // Clamp to safe bounds
    smoothed[k] = Math.max(0.2, Math.min(2.5, smoothed[k]));
  }

  history.push({ ...smoothed });
  // Keep last 20 snapshots
  if (history.length > 20) history.shift();
  weightHistory.set(key, history);

  return smoothed;
}

// ═══════════════════════════════════════════════════════
// 2. DRIFT DETECTOR — Alert when weights diverge too far
// ═══════════════════════════════════════════════════════

export interface DriftReport {
  totalDrift: number;       // 0-1, how much weights have shifted
  isStable: boolean;        // true if drift < threshold
  driftingDimensions: string[];
}

/** Measure how much weights have drifted from initial baseline */
export function measureDrift(
  lotteryId: string,
  riskProfile: string
): DriftReport {
  const key = cacheKey(lotteryId, riskProfile);
  const history = weightHistory.get(key) || [];

  if (history.length < 2) {
    return { totalDrift: 0, isStable: true, driftingDimensions: [] };
  }

  const first = history[0];
  const last = history[history.length - 1];
  const keys = Object.keys(first) as (keyof AdaptiveWeights)[];
  let totalDrift = 0;
  const drifting: string[] = [];

  for (const k of keys) {
    const drift = Math.abs(last[k] - first[k]) / Math.max(first[k], 0.01);
    totalDrift += drift;
    if (drift > 0.4) drifting.push(k);
  }

  totalDrift /= keys.length;

  return {
    totalDrift: Math.min(1, totalDrift),
    isStable: totalDrift < 0.35,
    driftingDimensions: drifting,
  };
}

// ═══════════════════════════════════════════════════════
// 3. PROGRESSIVE PENALTY SYSTEM
// ═══════════════════════════════════════════════════════

export interface ProgressivePenalty {
  consecutivePenalty: number;
  clusterPenalty: number;
  datePenalty: number;
  symmetryPenalty: number;
  totalPenalty: number;
}

/** Enhanced pattern penalty with progressive scaling */
export function computeProgressivePenalty(
  numbers: number[],
  totalNumbers: number
): ProgressivePenalty {
  const sorted = [...numbers].sort((a, b) => a - b);

  // 1. Consecutive penalty — progressive: longer sequences get exponentially worse
  let maxConsec = 1, curConsec = 1;
  let totalConsecPairs = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      curConsec++;
      totalConsecPairs++;
      maxConsec = Math.max(maxConsec, curConsec);
    } else {
      curConsec = 1;
    }
  }
  // Exponential penalty for long sequences
  const consecutivePenalty = maxConsec <= 2
    ? totalConsecPairs * 2
    : totalConsecPairs * 2 + Math.pow(maxConsec - 2, 2) * 5;

  // 2. Cluster penalty — penalize numbers bunched in narrow range
  const range = sorted[sorted.length - 1] - sorted[0];
  const idealRange = totalNumbers * 0.7;
  const clusterPenalty = range < idealRange * 0.4
    ? (1 - range / idealRange) * 25
    : 0;

  // 3. Date penalty — numbers fitting date patterns (1-31, with many 1-12)
  const under31 = sorted.filter(n => n <= 31).length;
  const under12 = sorted.filter(n => n <= 12).length;
  let datePenalty = 0;
  if (under31 === sorted.length && totalNumbers > 31) datePenalty += 15;
  if (under12 >= sorted.length * 0.5 && totalNumbers > 31) datePenalty += 10;

  // 4. Symmetry penalty — mirror patterns (1,25 2,24 etc)
  let symmetryCount = 0;
  const mid = (totalNumbers + 1) / 2;
  const numSet = new Set(sorted);
  for (const n of sorted) {
    const mirror = Math.round(2 * mid - n);
    if (mirror !== n && numSet.has(mirror)) symmetryCount++;
  }
  const symmetryPenalty = symmetryCount > sorted.length * 0.5
    ? (symmetryCount / sorted.length) * 10
    : 0;

  const totalPenalty = Math.min(50,
    consecutivePenalty + clusterPenalty + datePenalty + symmetryPenalty
  );

  return { consecutivePenalty, clusterPenalty, datePenalty, symmetryPenalty, totalPenalty };
}

// ═══════════════════════════════════════════════════════
// 4. CO-OCCURRENCE BOOST FOR INDIVIDUAL GAMES
// ═══════════════════════════════════════════════════════

/** Score how well a game uses historically co-occurring pairs */
export function computeCoOccurrenceBonus(
  game: number[],
  topPairs: { a: number; b: number; lift: number }[]
): number {
  if (topPairs.length === 0) return 0;

  const gameSet = new Set(game);
  let bonus = 0;
  let matchedPairs = 0;

  for (const pair of topPairs) {
    if (gameSet.has(pair.a) && gameSet.has(pair.b)) {
      bonus += Math.min(2, pair.lift); // cap individual lift
      matchedPairs++;
    }
  }

  // Normalize: reward having some co-occurring pairs but not too many
  const idealPairs = Math.max(2, Math.floor(game.length * 0.3));
  const pairScore = matchedPairs <= idealPairs
    ? matchedPairs / idealPairs
    : 1 - (matchedPairs - idealPairs) / idealPairs * 0.3;

  return Math.round(Math.max(0, pairScore * bonus * 5));
}

// ═══════════════════════════════════════════════════════
// 5. ANTI-PAIRS PENALTY — avoid historically rare combinations
// ═══════════════════════════════════════════════════════

/** Penalize games containing pairs that almost never appear together */
export function computeAntiPairPenalty(
  game: number[],
  antiPairs: { a: number; b: number; count: number }[],
  drawCount: number
): number {
  if (antiPairs.length === 0 || drawCount < 20) return 0;

  const gameSet = new Set(game);
  let penalty = 0;

  for (const pair of antiPairs) {
    if (gameSet.has(pair.a) && gameSet.has(pair.b)) {
      const rarity = 1 - pair.count / (drawCount * 0.05);
      penalty += Math.max(0, rarity) * 3;
    }
  }

  return Math.min(15, Math.round(penalty));
}
