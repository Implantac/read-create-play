/**
 * Native AI — Adaptive Intelligence Engine
 * Self-learning, ROI estimation, context-aware adjustments,
 * portfolio optimization, and performance memory.
 * 
 * This is a PURE OVERLAY — no existing logic is modified.
 */

import { DrawResult } from "@/data/lotteries";
import { NumberStats } from "@/features/statistics/engine";
import { getLotteryRules } from "../knowledge/lotteriesKnowledge";
import type { RiskProfile } from "../core/aiTypes";

// ═══════════════════════════════════════════════════════
// 1. CONTEXT-AWARE TREND DETECTOR
// ═══════════════════════════════════════════════════════

export interface ContextSnapshot {
  recentSumTrend: "rising" | "falling" | "stable";
  recentParityShift: number; // positive = more evens recently
  recentGapAcceleration: number; // avg gap change rate
  volatilityIndex: number; // 0-1, how unpredictable recent draws are
  regimeStability: number; // 0-1, how consistent the current pattern is
}

/** Analyze the last N draws to detect contextual shifts */
export function detectContext(draws: DrawResult[], lotteryId: string): ContextSnapshot {
  const rules = getLotteryRules(lotteryId);
  const recent = draws.slice(0, Math.min(15, draws.length));
  const older = draws.slice(15, Math.min(45, draws.length));

  if (recent.length < 5) {
    return { recentSumTrend: "stable", recentParityShift: 0, recentGapAcceleration: 0, volatilityIndex: 0.5, regimeStability: 0.5 };
  }

  // Sum trend
  const recentSums = recent.map(d => d.numbers.reduce((a, b) => a + b, 0));
  const olderSums = older.length > 0 ? older.map(d => d.numbers.reduce((a, b) => a + b, 0)) : recentSums;
  const avgRecentSum = recentSums.reduce((a, b) => a + b, 0) / recentSums.length;
  const avgOlderSum = olderSums.reduce((a, b) => a + b, 0) / olderSums.length;
  const sumDelta = avgRecentSum - avgOlderSum;
  const idealMidSum = (rules.idealSumRange[0] + rules.idealSumRange[1]) / 2;
  const sumRange = rules.idealSumRange[1] - rules.idealSumRange[0];
  const recentSumTrend: "rising" | "falling" | "stable" =
    sumDelta > sumRange * 0.05 ? "rising" : sumDelta < -sumRange * 0.05 ? "falling" : "stable";

  // Parity shift
  const recentEvens = recent.map(d => d.numbers.filter(n => n % 2 === 0).length);
  const olderEvens = older.length > 0 ? older.map(d => d.numbers.filter(n => n % 2 === 0).length) : recentEvens;
  const avgRecentEven = recentEvens.reduce((a, b) => a + b, 0) / recentEvens.length;
  const avgOlderEven = olderEvens.length > 0 ? olderEvens.reduce((a, b) => a + b, 0) / olderEvens.length : avgRecentEven;
  const recentParityShift = avgRecentEven - avgOlderEven;

  // Volatility: how much sum varies in recent window
  const sumVariance = recentSums.reduce((s, v) => s + (v - avgRecentSum) ** 2, 0) / recentSums.length;
  const volatilityIndex = Math.min(1, Math.sqrt(sumVariance) / (sumRange * 0.5));

  // Gap acceleration
  const numberFreqRecent = new Map<number, number>();
  const numberFreqOlder = new Map<number, number>();
  for (const d of recent) for (const n of d.numbers) numberFreqRecent.set(n, (numberFreqRecent.get(n) || 0) + 1);
  for (const d of older) for (const n of d.numbers) numberFreqOlder.set(n, (numberFreqOlder.get(n) || 0) + 1);
  let gapAccSum = 0;
  let gapAccCount = 0;
  for (let n = 1; n <= rules.totalNumbers; n++) {
    const rFreq = (numberFreqRecent.get(n) || 0) / recent.length;
    const oFreq = older.length > 0 ? (numberFreqOlder.get(n) || 0) / older.length : rFreq;
    gapAccSum += rFreq - oFreq;
    gapAccCount++;
  }
  const recentGapAcceleration = gapAccCount > 0 ? gapAccSum / gapAccCount : 0;

  // Regime stability: how consistent the parity ratio is across recent draws
  const parityStdDev = Math.sqrt(recentEvens.reduce((s, e) => s + (e - avgRecentEven) ** 2, 0) / recentEvens.length);
  const regimeStability = Math.max(0, 1 - parityStdDev / (rules.pick * 0.3));

  return { recentSumTrend, recentParityShift, recentGapAcceleration, volatilityIndex, regimeStability };
}

// ═══════════════════════════════════════════════════════
// 2. ROI ESTIMATION MODEL
// ═══════════════════════════════════════════════════════

export interface ROIEstimate {
  expectedHitsAvg: number;
  expectedPrizeRate: number; // chance of hitting any prize
  consistencyScore: number; // 0-1
  riskAdjustedScore: number; // combines return with consistency
  roiTier: "excellent" | "good" | "average" | "below_average";
}

/** Estimate ROI potential of a game based on backtesting */
export function estimateROI(
  game: number[],
  draws: DrawResult[],
  lotteryId: string
): ROIEstimate {
  const rules = getLotteryRules(lotteryId);
  const gameSet = new Set(game);
  const window = Math.min(150, draws.length);
  const subset = draws.slice(0, window);

  if (subset.length < 10) {
    return { expectedHitsAvg: 0, expectedPrizeRate: 0, consistencyScore: 0, riskAdjustedScore: 0, roiTier: "below_average" };
  }

  const hits: number[] = [];
  let prizeHits = 0;

  const minPrizeTier = rules.prizeTiers.length > 0
    ? rules.prizeTiers[rules.prizeTiers.length - 1].hits
    : Math.ceil(game.length * 0.5);

  for (const d of subset) {
    const h = d.numbers.filter(n => gameSet.has(n)).length;
    hits.push(h);
    if (h >= minPrizeTier) prizeHits++;
  }

  const avg = hits.reduce((a, b) => a + b, 0) / hits.length;
  const variance = hits.reduce((s, h) => s + (h - avg) ** 2, 0) / hits.length;
  const stdDev = Math.sqrt(variance);
  const consistency = Math.max(0, Math.min(1, 1 - stdDev / Math.max(avg, 1)));
  const prizeRate = prizeHits / subset.length;

  // Risk-adjusted: reward high prize rate + high consistency
  const riskAdjusted = prizeRate * 0.6 + consistency * 0.25 + (avg / game.length) * 0.15;

  const tier: ROIEstimate["roiTier"] =
    riskAdjusted >= 0.5 ? "excellent" :
    riskAdjusted >= 0.35 ? "good" :
    riskAdjusted >= 0.2 ? "average" : "below_average";

  return {
    expectedHitsAvg: avg,
    expectedPrizeRate: prizeRate,
    consistencyScore: consistency,
    riskAdjustedScore: riskAdjusted,
    roiTier: tier,
  };
}

// ═══════════════════════════════════════════════════════
// 3. PORTFOLIO OPTIMIZER
// ═══════════════════════════════════════════════════════

export interface PortfolioMetrics {
  coverageRatio: number; // unique numbers / total numbers
  avgOverlap: number; // average pairwise overlap
  maxOverlap: number;
  diversityScore: number; // 0-100
  numberEntropy: number; // higher = more even distribution
}

/** Evaluate a set of games as a portfolio */
export function evaluatePortfolio(
  games: number[][],
  totalNumbers: number
): PortfolioMetrics {
  if (games.length === 0) {
    return { coverageRatio: 0, avgOverlap: 0, maxOverlap: 0, diversityScore: 0, numberEntropy: 0 };
  }

  // Coverage
  const allNumbers = new Set<number>();
  const freq = new Map<number, number>();
  for (const g of games) {
    for (const n of g) {
      allNumbers.add(n);
      freq.set(n, (freq.get(n) || 0) + 1);
    }
  }
  const coverageRatio = allNumbers.size / totalNumbers;

  // Pairwise overlap
  let totalOverlap = 0;
  let maxOverlap = 0;
  let pairs = 0;
  for (let i = 0; i < games.length; i++) {
    const setA = new Set(games[i]);
    for (let j = i + 1; j < games.length; j++) {
      const overlap = games[j].filter(n => setA.has(n)).length;
      totalOverlap += overlap;
      maxOverlap = Math.max(maxOverlap, overlap);
      pairs++;
    }
  }
  const avgOverlap = pairs > 0 ? totalOverlap / pairs : 0;

  // Number entropy (Shannon entropy of frequency distribution)
  const totalPicks = games.reduce((s, g) => s + g.length, 0);
  let entropy = 0;
  for (const [, count] of freq) {
    const p = count / totalPicks;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  const maxEntropy = Math.log2(allNumbers.size);
  const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

  // Diversity score
  const pick = games.length > 0 ? games[0].length : 6;
  const overlapPenalty = Math.min(1, avgOverlap / (pick * 0.5));
  const diversityScore = Math.round(
    (coverageRatio * 35 + normalizedEntropy * 35 + (1 - overlapPenalty) * 30)
  );

  return { coverageRatio, avgOverlap, maxOverlap, diversityScore, numberEntropy: normalizedEntropy };
}

/** Optimize a candidate pool into a diverse portfolio */
export function optimizePortfolio(
  candidates: { numbers: number[]; score: number }[],
  count: number,
  totalNumbers: number,
  pick: number
): number[][] {
  if (candidates.length <= count) return candidates.map(c => c.numbers);

  // Greedy selection maximizing portfolio diversity + individual score
  const selected: number[][] = [];
  const globalFreq = new Map<number, number>();
  const used = new Set<number>();

  // Sort by score first
  const sorted = [...candidates].sort((a, b) => b.score - a.score);

  // Always include best scoring game
  selected.push(sorted[0].numbers);
  for (const n of sorted[0].numbers) globalFreq.set(n, 1);
  used.add(0);

  while (selected.length < count) {
    let bestIdx = -1;
    let bestValue = -Infinity;

    for (let i = 0; i < sorted.length; i++) {
      if (used.has(i)) continue;

      const candidate = sorted[i].numbers;
      const candidateSet = new Set(candidate);

      // Compute marginal diversity gain
      let newNumbers = 0;
      let overlapPenalty = 0;
      for (const n of candidate) {
        if (!globalFreq.has(n) || globalFreq.get(n)! === 0) newNumbers++;
        overlapPenalty += (globalFreq.get(n) || 0);
      }

      // Check pairwise overlap with all selected
      let maxPairOverlap = 0;
      for (const sel of selected) {
        const selSet = new Set(sel);
        const overlap = candidate.filter(n => selSet.has(n)).length;
        maxPairOverlap = Math.max(maxPairOverlap, overlap);
      }

      // Value = score contribution + diversity contribution - overlap penalty
      const scoreContrib = sorted[i].score * 0.3;
      const diversityContrib = (newNumbers / pick) * 40;
      const overlapCost = (overlapPenalty / (selected.length * pick)) * 20;
      const pairCost = maxPairOverlap > pick * 0.6 ? 15 : 0;

      const value = scoreContrib + diversityContrib - overlapCost - pairCost;

      if (value > bestValue) {
        bestValue = value;
        bestIdx = i;
      }
    }

    if (bestIdx < 0) break;

    selected.push(sorted[bestIdx].numbers);
    for (const n of sorted[bestIdx].numbers) globalFreq.set(n, (globalFreq.get(n) || 0) + 1);
    used.add(bestIdx);
  }

  // Fill remaining if needed
  if (selected.length < count) {
    for (let i = 0; i < sorted.length && selected.length < count; i++) {
      if (!used.has(i)) selected.push(sorted[i].numbers);
    }
  }

  return selected;
}

// ═══════════════════════════════════════════════════════
// 4. ADAPTIVE WEIGHT SELF-CALIBRATION
// ═══════════════════════════════════════════════════════

export interface AdaptiveWeights {
  sumWeight: number;
  parityWeight: number;
  dispersalWeight: number;
  frequencyWeight: number;
  gapWeight: number;
  trendWeight: number;
  repeatWeight: number;
  clusterWeight: number;
}

/** Self-calibrate scoring weights based on what patterns win */
export function selfCalibrateWeights(
  draws: DrawResult[],
  lotteryId: string
): AdaptiveWeights {
  const rules = getLotteryRules(lotteryId);
  const calibrationWindow = Math.min(50, draws.length);
  if (calibrationWindow < 10) {
    return { sumWeight: 1, parityWeight: 1, dispersalWeight: 1, frequencyWeight: 1, gapWeight: 1, trendWeight: 1, repeatWeight: 1, clusterWeight: 1 };
  }

  const recent = draws.slice(0, calibrationWindow);
  const idealMidSum = (rules.idealSumRange[0] + rules.idealSumRange[1]) / 2;
  const sumRange = rules.idealSumRange[1] - rules.idealSumRange[0];

  // Measure how consistent each metric is across winning draws
  let sumDeviation = 0;
  let parityDeviation = 0;
  let dispersalConsistency = 0;
  let repeatConsistency = 0;

  for (let i = 0; i < recent.length; i++) {
    const nums = recent[i].numbers;
    const sum = nums.reduce((a, b) => a + b, 0);
    sumDeviation += Math.abs(sum - idealMidSum) / sumRange;

    const evens = nums.filter(n => n % 2 === 0).length;
    const idealEven = rules.pick / 2;
    parityDeviation += Math.abs(evens - idealEven) / rules.pick;

    // Dispersal: range / totalNumbers
    const sorted = [...nums].sort((a, b) => a - b);
    const range = sorted[sorted.length - 1] - sorted[0];
    dispersalConsistency += range / rules.totalNumbers;

    // Repeat from previous
    if (i < recent.length - 1) {
      const prevSet = new Set(recent[i + 1].numbers);
      const repeats = nums.filter(n => prevSet.has(n)).length;
      repeatConsistency += repeats / rules.pick;
    }
  }

  sumDeviation /= recent.length;
  parityDeviation /= recent.length;
  dispersalConsistency /= recent.length;
  repeatConsistency /= Math.max(1, recent.length - 1);

  // Lower deviation = more predictable = higher weight
  return {
    sumWeight: Math.max(0.5, 1.5 - sumDeviation * 2),
    parityWeight: Math.max(0.5, 1.5 - parityDeviation * 2),
    dispersalWeight: Math.max(0.5, dispersalConsistency * 1.5),
    frequencyWeight: 1.0, // baseline
    gapWeight: Math.max(0.5, 1.2 - sumDeviation),
    trendWeight: Math.max(0.5, 1.0 + (dispersalConsistency - 0.5) * 0.8),
    repeatWeight: Math.max(0.3, repeatConsistency * 2),
    clusterWeight: Math.max(0.5, 1.3 - parityDeviation),
  };
}

// ═══════════════════════════════════════════════════════
// 5. PERFORMANCE MEMORY (in-memory per session)
// ═══════════════════════════════════════════════════════

interface PerformanceEntry {
  lotteryId: string;
  riskProfile: string;
  avgScore: number;
  avgROI: number;
  portfolioDiversity: number;
  timestamp: number;
}

const performanceMemory: PerformanceEntry[] = [];

/** Record performance of a generation batch */
export function recordPerformance(
  lotteryId: string,
  riskProfile: string,
  avgScore: number,
  avgROI: number,
  portfolioDiversity: number
): void {
  performanceMemory.push({
    lotteryId,
    riskProfile,
    avgScore,
    avgROI,
    portfolioDiversity,
    timestamp: Date.now(),
  });
  // Keep last 100 entries
  if (performanceMemory.length > 100) performanceMemory.shift();
}

/** Get performance trend for a lottery+profile combo */
export function getPerformanceTrend(
  lotteryId: string,
  riskProfile: string
): { improving: boolean; avgScoreTrend: number; sampleSize: number } {
  const entries = performanceMemory.filter(
    e => e.lotteryId === lotteryId && e.riskProfile === riskProfile
  );
  if (entries.length < 2) return { improving: false, avgScoreTrend: 0, sampleSize: entries.length };

  const half = Math.floor(entries.length / 2);
  const firstHalf = entries.slice(0, half);
  const secondHalf = entries.slice(half);

  const avgFirst = firstHalf.reduce((s, e) => s + e.avgScore, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, e) => s + e.avgScore, 0) / secondHalf.length;

  return {
    improving: avgSecond > avgFirst,
    avgScoreTrend: avgSecond - avgFirst,
    sampleSize: entries.length,
  };
}

// ═══════════════════════════════════════════════════════
// 6. CONTEXT-AWARE SCORING ADJUSTMENTS
// ═══════════════════════════════════════════════════════

/** Apply context adjustments to scoring weights */
export function applyContextAdjustments(
  baseWeights: AdaptiveWeights,
  context: ContextSnapshot,
  riskProfile: RiskProfile
): AdaptiveWeights {
  const adjusted = { ...baseWeights };

  // If recent sums are rising, slightly favor lower-sum games
  if (context.recentSumTrend === "rising") {
    adjusted.sumWeight *= 1.15;
  } else if (context.recentSumTrend === "falling") {
    adjusted.sumWeight *= 1.1;
  }

  // High volatility → increase consistency-focused weights
  if (context.volatilityIndex > 0.6) {
    adjusted.dispersalWeight *= 1.2;
    adjusted.parityWeight *= 1.15;
    adjusted.clusterWeight *= 1.1;
  }

  // Low regime stability → reduce trend weight (less reliable signals)
  if (context.regimeStability < 0.4) {
    adjusted.trendWeight *= 0.75;
    adjusted.gapWeight *= 0.85;
  }

  // Profile-specific adjustments
  if (riskProfile === "conservative") {
    adjusted.parityWeight *= 1.2;
    adjusted.sumWeight *= 1.1;
    adjusted.dispersalWeight *= 1.15;
  } else if (riskProfile === "aggressive" || riskProfile === "exploratory") {
    adjusted.trendWeight *= 1.2;
    adjusted.gapWeight *= 1.15;
    adjusted.frequencyWeight *= 0.9;
  } else if (riskProfile === "momentum") {
    adjusted.trendWeight *= 1.35;
  } else if (riskProfile === "regression") {
    adjusted.gapWeight *= 1.3;
    adjusted.trendWeight *= 0.8;
  }

  // Stability control: clamp adjustments to prevent wild swings
  const keys = Object.keys(adjusted) as (keyof AdaptiveWeights)[];
  for (const k of keys) {
    adjusted[k] = Math.max(0.3, Math.min(2.0, adjusted[k]));
  }

  return adjusted;
}

// ═══════════════════════════════════════════════════════
// 7. WINNING PATTERN MEMORY — Learn from real draw results
// ═══════════════════════════════════════════════════════

export interface WinningPatternProfile {
  avgParityRatio: number; // avg even/total ratio in winning draws
  avgSumNormalized: number; // avg sum as % of ideal range
  avgConsecutivePairs: number;
  avgDispersal: number; // avg (max-min)/totalNumbers
  avgRepeatFromPrev: number;
  zoneProfile: number[]; // avg numbers per zone (5 zones)
  sampleSize: number;
}

/** Extract winning patterns from real historical draws */
export function extractWinningPatterns(
  draws: DrawResult[],
  lotteryId: string,
  window: number = 100
): WinningPatternProfile {
  const rules = getLotteryRules(lotteryId);
  const subset = draws.slice(0, Math.min(window, draws.length));
  if (subset.length < 5) {
    return { avgParityRatio: 0.5, avgSumNormalized: 0.5, avgConsecutivePairs: 1, avgDispersal: 0.7, avgRepeatFromPrev: 0, zoneProfile: [], sampleSize: 0 };
  }

  let totalParityRatio = 0;
  let totalSumNorm = 0;
  let totalConsecutive = 0;
  let totalDispersal = 0;
  let totalRepeat = 0;
  const zoneSize = Math.ceil(rules.totalNumbers / 5);
  const zoneAccum = new Array(5).fill(0);

  for (let i = 0; i < subset.length; i++) {
    const nums = subset[i].numbers;
    const sorted = [...nums].sort((a, b) => a - b);

    // Parity
    const evens = nums.filter(n => n % 2 === 0).length;
    totalParityRatio += evens / nums.length;

    // Sum normalized to ideal range
    const sum = nums.reduce((a, b) => a + b, 0);
    const idealMid = (rules.idealSumRange[0] + rules.idealSumRange[1]) / 2;
    const sumRange = rules.idealSumRange[1] - rules.idealSumRange[0];
    totalSumNorm += Math.max(0, 1 - Math.abs(sum - idealMid) / (sumRange * 0.5));

    // Consecutive pairs
    let consec = 0;
    for (let j = 1; j < sorted.length; j++) {
      if (sorted[j] - sorted[j - 1] === 1) consec++;
    }
    totalConsecutive += consec;

    // Dispersal
    totalDispersal += (sorted[sorted.length - 1] - sorted[0]) / rules.totalNumbers;

    // Repeat from previous
    if (i < subset.length - 1) {
      const prevSet = new Set(subset[i + 1].numbers);
      totalRepeat += nums.filter(n => prevSet.has(n)).length;
    }

    // Zone distribution
    for (const n of nums) {
      const z = Math.min(Math.floor((n - 1) / zoneSize), 4);
      zoneAccum[z]++;
    }
  }

  const len = subset.length;
  return {
    avgParityRatio: totalParityRatio / len,
    avgSumNormalized: totalSumNorm / len,
    avgConsecutivePairs: totalConsecutive / len,
    avgDispersal: totalDispersal / len,
    avgRepeatFromPrev: len > 1 ? totalRepeat / (len - 1) : 0,
    zoneProfile: zoneAccum.map(z => z / len),
    sampleSize: len,
  };
}

/** Score how well a game matches winning patterns */
export function scoreAgainstWinningPatterns(
  game: number[],
  patterns: WinningPatternProfile,
  lotteryId: string
): number {
  if (patterns.sampleSize < 5) return 50; // neutral if insufficient data

  const rules = getLotteryRules(lotteryId);
  const sorted = [...game].sort((a, b) => a - b);

  // Parity alignment
  const evens = game.filter(n => n % 2 === 0).length;
  const parityDev = Math.abs(evens / game.length - patterns.avgParityRatio);
  const parityScore = Math.max(0, 1 - parityDev * 4);

  // Sum alignment
  const sum = game.reduce((a, b) => a + b, 0);
  const idealMid = (rules.idealSumRange[0] + rules.idealSumRange[1]) / 2;
  const sumRange = rules.idealSumRange[1] - rules.idealSumRange[0];
  const gameSumNorm = Math.max(0, 1 - Math.abs(sum - idealMid) / (sumRange * 0.5));
  const sumDev = Math.abs(gameSumNorm - patterns.avgSumNormalized);
  const sumScore = Math.max(0, 1 - sumDev * 3);

  // Consecutive pairs alignment
  let consec = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === 1) consec++;
  }
  const consecDev = Math.abs(consec - patterns.avgConsecutivePairs);
  const consecScore = Math.max(0, 1 - consecDev * 0.3);

  // Dispersal alignment
  const dispersal = (sorted[sorted.length - 1] - sorted[0]) / rules.totalNumbers;
  const dispersalDev = Math.abs(dispersal - patterns.avgDispersal);
  const dispersalScore = Math.max(0, 1 - dispersalDev * 3);

  // Zone alignment
  let zoneScore = 1;
  if (patterns.zoneProfile.length === 5) {
    const zoneSize = Math.ceil(rules.totalNumbers / 5);
    const gameZones = new Array(5).fill(0);
    for (const n of game) gameZones[Math.min(Math.floor((n - 1) / zoneSize), 4)]++;
    let zoneDev = 0;
    for (let z = 0; z < 5; z++) {
      zoneDev += Math.abs(gameZones[z] - patterns.zoneProfile[z]);
    }
    zoneScore = Math.max(0, 1 - (zoneDev / game.length) * 0.8);
  }

  // Weighted combination
  return Math.round(
    (parityScore * 25 + sumScore * 25 + consecScore * 15 + dispersalScore * 20 + zoneScore * 15)
  );
}

// ═══════════════════════════════════════════════════════
// 8. ADAPTIVE MONTE CARLO — Variable depth by context
// ═══════════════════════════════════════════════════════

/** Determine optimal Monte Carlo simulation count based on context */
export function getAdaptiveSimCount(
  context: ContextSnapshot,
  riskProfile: RiskProfile,
  drawCount: number
): number {
  let base = 50;

  // More simulations when volatility is high (need more confidence)
  if (context.volatilityIndex > 0.6) base += 25;
  if (context.volatilityIndex > 0.8) base += 25;

  // More simulations for conservative profiles (need higher confidence)
  if (riskProfile === "conservative" || riskProfile === "statistical") base += 15;

  // Less simulations for aggressive/exploratory (speed matters more)
  if (riskProfile === "aggressive" || riskProfile === "exploratory") base -= 10;

  // More sims when regime is unstable
  if (context.regimeStability < 0.4) base += 20;

  // Cap based on available draw data
  return Math.min(base, Math.max(20, drawCount));
}

// ═══════════════════════════════════════════════════════
// 9. SELF-LEARNING WEIGHT OPTIMIZER
// ═══════════════════════════════════════════════════════

/** Analyze performance memory to suggest weight adjustments */
export function optimizeWeightsFromHistory(
  lotteryId: string,
  riskProfile: string
): { adjustments: Partial<AdaptiveWeights>; confidence: number } {
  // Merge persistent + session memory
  const persistent = loadPersistentMemory(lotteryId, riskProfile);
  const session = performanceMemory.filter(
    e => e.lotteryId === lotteryId && e.riskProfile === riskProfile
  );
  const entries = [...persistent, ...session];

  if (entries.length < 3) {
    return { adjustments: {}, confidence: 0 };
  }

  const sorted = [...entries].sort((a, b) => b.avgScore - a.avgScore);
  const topQuartile = sorted.slice(0, Math.max(1, Math.floor(sorted.length / 4)));
  const bottomQuartile = sorted.slice(-Math.max(1, Math.floor(sorted.length / 4)));

  const avgTopROI = topQuartile.reduce((s, e) => s + e.avgROI, 0) / topQuartile.length;
  const avgBottomROI = bottomQuartile.reduce((s, e) => s + e.avgROI, 0) / bottomQuartile.length;
  const avgTopDiversity = topQuartile.reduce((s, e) => s + e.portfolioDiversity, 0) / topQuartile.length;
  const avgBottomDiversity = bottomQuartile.reduce((s, e) => s + e.portfolioDiversity, 0) / bottomQuartile.length;

  const adjustments: Partial<AdaptiveWeights> = {};

  if (avgTopROI > avgBottomROI * 1.1) {
    adjustments.frequencyWeight = 1.1;
  }
  if (avgTopDiversity > avgBottomDiversity * 1.05) {
    adjustments.dispersalWeight = 1.1;
    adjustments.clusterWeight = 1.05;
  }

  const confidence = Math.min(1, entries.length / 20);

  return { adjustments, confidence };
}

// ═══════════════════════════════════════════════════════
// 10. PERSISTENT PERFORMANCE MEMORY (localStorage)
// ═══════════════════════════════════════════════════════

const STORAGE_KEY = "titan_ai_perf_memory";
const MAX_PERSISTENT_ENTRIES = 200;

/** Save current session performance to localStorage for cross-session learning */
export function persistPerformanceMemory(): void {
  try {
    if (typeof localStorage === "undefined" || performanceMemory.length === 0) return;

    const existing = loadAllPersistentMemory();
    const merged = [...existing, ...performanceMemory];

    // Deduplicate by timestamp
    const seen = new Set<number>();
    const deduped = merged.filter(e => {
      if (seen.has(e.timestamp)) return false;
      seen.add(e.timestamp);
      return true;
    });

    // Keep most recent entries
    const trimmed = deduped
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_PERSISTENT_ENTRIES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable or full — fail silently
  }
}

function loadAllPersistentMemory(): PerformanceEntry[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PerformanceEntry[];
  } catch {
    return [];
  }
}

function loadPersistentMemory(lotteryId: string, riskProfile: string): PerformanceEntry[] {
  return loadAllPersistentMemory().filter(
    e => e.lotteryId === lotteryId && e.riskProfile === riskProfile
  );
}

/** Get cross-session performance statistics */
export function getCrossSessionStats(
  lotteryId: string
): { totalSessions: number; avgScore: number; bestProfile: string; learningCurve: number } {
  const all = loadAllPersistentMemory().filter(e => e.lotteryId === lotteryId);
  if (all.length === 0) {
    return { totalSessions: 0, avgScore: 0, bestProfile: "balanced", learningCurve: 0 };
  }

  const avgScore = all.reduce((s, e) => s + e.avgScore, 0) / all.length;

  // Find best performing profile
  const profileScores = new Map<string, { total: number; count: number }>();
  for (const e of all) {
    const p = profileScores.get(e.riskProfile) || { total: 0, count: 0 };
    p.total += e.avgScore;
    p.count++;
    profileScores.set(e.riskProfile, p);
  }
  let bestProfile = "balanced";
  let bestAvg = 0;
  for (const [profile, { total, count }] of profileScores) {
    const avg = total / count;
    if (avg > bestAvg) { bestAvg = avg; bestProfile = profile; }
  }

  // Learning curve: compare first half vs second half scores
  const sorted = [...all].sort((a, b) => a.timestamp - b.timestamp);
  const half = Math.floor(sorted.length / 2);
  const firstHalfAvg = sorted.slice(0, half).reduce((s, e) => s + e.avgScore, 0) / Math.max(1, half);
  const secondHalfAvg = sorted.slice(half).reduce((s, e) => s + e.avgScore, 0) / Math.max(1, sorted.length - half);
  const learningCurve = secondHalfAvg - firstHalfAvg;

  return { totalSessions: all.length, avgScore, bestProfile, learningCurve };
}

