/**
 * Native AI — Advanced Analysis Engine
 * Co-occurrence, decade zones, prime/fibonacci density, 
 * gap prediction, regime detection, and multi-window trend analysis
 */

import { DrawResult } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";
import { getLotteryRules, PRIMES, FIBONACCI } from "../knowledge/lotteriesKnowledge";

/** Co-occurrence matrix: how often pairs appear together */
export interface CoOccurrenceResult {
  topPairs: { a: number; b: number; count: number; lift: number }[];
  antiPairs: { a: number; b: number; count: number }[];
}

export function computeCoOccurrence(
  draws: DrawResult[],
  totalNumbers: number,
  topN: number = 20
): CoOccurrenceResult {
  const pairCount = new Map<string, number>();
  const numberCount = new Map<number, number>();
  const total = draws.length;

  for (const d of draws) {
    const nums = d.numbers;
    for (const n of nums) {
      numberCount.set(n, (numberCount.get(n) || 0) + 1);
    }
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${Math.min(nums[i], nums[j])}-${Math.max(nums[i], nums[j])}`;
        pairCount.set(key, (pairCount.get(key) || 0) + 1);
      }
    }
  }

  // Calculate lift for each pair
  const pairs = [...pairCount.entries()].map(([key, count]) => {
    const [a, b] = key.split("-").map(Number);
    const pA = (numberCount.get(a) || 0) / total;
    const pB = (numberCount.get(b) || 0) / total;
    const pAB = count / total;
    const lift = pA > 0 && pB > 0 ? pAB / (pA * pB) : 0;
    return { a, b, count, lift };
  });

  pairs.sort((x, y) => y.lift - x.lift);
  const topPairs = pairs.slice(0, topN);

  // Anti-pairs: numbers that rarely appear together
  pairs.sort((x, y) => x.count - y.count);
  const antiPairs = pairs.slice(0, topN).map(({ a, b, count }) => ({ a, b, count }));

  return { topPairs, antiPairs };
}

/** Decade/zone distribution analysis */
export interface ZoneAnalysis {
  zones: { label: string; range: [number, number]; idealCount: number; avgCount: number; stdDev: number }[];
  bestZoneCombo: number[]; // ideal count per zone based on history
}

export function analyzeZoneDistribution(
  draws: DrawResult[],
  lotteryId: string,
  window: number = 100
): ZoneAnalysis {
  const rules = getLotteryRules(lotteryId);
  const subset = draws.slice(0, Math.min(window, draws.length));
  const zoneSize = 10;
  const zoneCount = Math.ceil(rules.totalNumbers / zoneSize);
  
  const zones: { label: string; range: [number, number]; counts: number[] }[] = [];
  for (let z = 0; z < zoneCount; z++) {
    const lo = z * zoneSize + 1;
    const hi = Math.min((z + 1) * zoneSize, rules.totalNumbers);
    zones.push({ label: `${lo}-${hi}`, range: [lo, hi], counts: [] });
  }

  for (const d of subset) {
    const zoneCounts = new Array(zoneCount).fill(0);
    for (const n of d.numbers) {
      const z = Math.min(Math.floor((n - 1) / zoneSize), zoneCount - 1);
      zoneCounts[z]++;
    }
    for (let z = 0; z < zoneCount; z++) {
      zones[z].counts.push(zoneCounts[z]);
    }
  }

  const result = zones.map(z => {
    const avg = z.counts.length > 0 ? z.counts.reduce((a, b) => a + b, 0) / z.counts.length : 0;
    const variance = z.counts.length > 1
      ? z.counts.reduce((s, c) => s + (c - avg) ** 2, 0) / z.counts.length
      : 0;
    const numbersInZone = z.range[1] - z.range[0] + 1;
    const idealCount = (numbersInZone / rules.totalNumbers) * rules.pick;
    return { label: z.label, range: z.range, idealCount: Math.round(idealCount * 10) / 10, avgCount: Math.round(avg * 10) / 10, stdDev: Math.round(Math.sqrt(variance) * 10) / 10 };
  });

  const bestZoneCombo = result.map(z => Math.round(z.avgCount));

  return { zones: result, bestZoneCombo };
}

/** Gap prediction: predict which numbers are statistically "due" */
export interface GapPrediction {
  number: number;
  currentGap: number;
  avgGap: number;
  maxGap: number;
  overdueFactor: number; // currentGap / avgGap — higher = more overdue
  predictedReturn: number; // estimated draws until return
}

export function predictGapReturns(stats: NumberStats[], topN: number = 15): GapPrediction[] {
  return stats
    .map(s => ({
      number: s.number,
      currentGap: s.lastSeen,
      avgGap: s.avgGap,
      maxGap: s.maxGap,
      overdueFactor: s.avgGap > 0 ? s.lastSeen / s.avgGap : 0,
      predictedReturn: Math.max(0, Math.round(s.avgGap - s.lastSeen)),
    }))
    .sort((a, b) => b.overdueFactor - a.overdueFactor)
    .slice(0, topN);
}

/** Multi-window trend analysis (short/mid/long term) */
export interface TrendAnalysis {
  number: number;
  shortTrend: number; // last 10 draws
  midTrend: number;   // last 30 draws
  longTrend: number;  // last 100 draws
  acceleration: number; // is the trend speeding up?
  regime: "ascending" | "descending" | "stable";
}

export function multiWindowTrend(draws: DrawResult[], totalNumbers: number): TrendAnalysis[] {
  const windows = [10, 30, 100];
  const freqs: number[][] = windows.map(() => new Array(totalNumbers + 1).fill(0));

  for (let w = 0; w < windows.length; w++) {
    const subset = draws.slice(0, Math.min(windows[w], draws.length));
    for (const d of subset) {
      for (const n of d.numbers) {
        if (n >= 1 && n <= totalNumbers) freqs[w][n]++;
      }
    }
  }

  const results: TrendAnalysis[] = [];
  for (let n = 1; n <= totalNumbers; n++) {
    const shortRate = freqs[0][n] / Math.min(windows[0], draws.length);
    const midRate = freqs[1][n] / Math.min(windows[1], draws.length);
    const longRate = freqs[2][n] / Math.min(windows[2], draws.length);

    const shortTrend = shortRate - midRate;
    const midTrend = midRate - longRate;
    const longTrend = longRate;
    const acceleration = shortTrend - midTrend;

    let regime: "ascending" | "descending" | "stable" = "stable";
    if (shortTrend > 0.03 && midTrend > 0.01) regime = "ascending";
    else if (shortTrend < -0.03 && midTrend < -0.01) regime = "descending";

    results.push({ number: n, shortTrend, midTrend, longTrend, acceleration, regime });
  }

  return results;
}

/** Prime and Fibonacci density scoring for a game */
export function computeSpecialNumberScore(numbers: number[]): {
  primeCount: number;
  fibCount: number;
  primeRatio: number;
  fibRatio: number;
  specialScore: number;
} {
  const primeCount = numbers.filter(n => PRIMES.has(n)).length;
  const fibCount = numbers.filter(n => FIBONACCI.has(n)).length;
  const primeRatio = primeCount / numbers.length;
  const fibRatio = fibCount / numbers.length;

  // Historical averages: ~40% primes, ~15% fibonacci is typical
  const primeDev = Math.abs(primeRatio - 0.4);
  const fibDev = Math.abs(fibRatio - 0.15);
  const specialScore = Math.max(0, 100 - primeDev * 150 - fibDev * 200);

  return { primeCount, fibCount, primeRatio, fibRatio, specialScore };
}

/** Compute "coverage score" — how well a set of games covers the number space */
export function computeCoverageScore(
  games: number[][],
  totalNumbers: number
): { coverage: number; missingNumbers: number[]; overrepresented: number[] } {
  const count = new Map<number, number>();
  for (const g of games) {
    for (const n of g) count.set(n, (count.get(n) || 0) + 1);
  }

  const covered = count.size;
  const coverage = Math.round((covered / totalNumbers) * 100);

  const missing: number[] = [];
  for (let n = 1; n <= totalNumbers; n++) {
    if (!count.has(n)) missing.push(n);
  }

  const avgCount = games.length > 0 ? games.reduce((s, g) => s + g.length, 0) / totalNumbers : 0;
  const overrepresented = [...count.entries()]
    .filter(([, c]) => c > avgCount * 2)
    .map(([n]) => n)
    .sort((a, b) => a - b);

  return { coverage, missingNumbers: missing, overrepresented };
}

/** Compute historical hit rate for a game against real draws */
export function computeHistoricalHitRate(
  game: number[],
  draws: DrawResult[],
  lotteryId: string
): { avgHits: number; maxHits: number; minHits: number; hitDistribution: Record<number, number>; winRate: number } {
  const rules = getLotteryRules(lotteryId);
  const gameSet = new Set(game);
  const hitDist: Record<number, number> = {};
  let totalHits = 0;
  let maxHits = 0;
  let minHits = Infinity;
  let wins = 0;

  const subset = draws.slice(0, Math.min(200, draws.length));
  for (const d of subset) {
    const hits = d.numbers.filter(n => gameSet.has(n)).length;
    totalHits += hits;
    maxHits = Math.max(maxHits, hits);
    minHits = Math.min(minHits, hits);
    hitDist[hits] = (hitDist[hits] || 0) + 1;

    // Check if hits meet minimum prize tier
    const minPrize = rules.prizeTiers[rules.prizeTiers.length - 1]?.hits || 0;
    if (hits >= minPrize) wins++;
  }

  return {
    avgHits: subset.length > 0 ? totalHits / subset.length : 0,
    maxHits,
    minHits: minHits === Infinity ? 0 : minHits,
    hitDistribution: hitDist,
    winRate: subset.length > 0 ? wins / subset.length : 0,
  };
}

/** Cluster concentration analysis — penalizes games grouped in narrow bands */
export function computeClusterScore(numbers: number[], totalNumbers: number): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const zoneSize = Math.ceil(totalNumbers / 5);
  const zones = new Array(5).fill(0);
  for (const n of sorted) zones[Math.min(Math.floor((n - 1) / zoneSize), 4)]++;
  const emptyZones = zones.filter(c => c === 0).length;
  const maxInZone = Math.max(...zones);
  const idealPerZone = sorted.length / 5;
  const deviation = zones.reduce((s, z) => s + Math.abs(z - idealPerZone), 0) / 5;
  const balance = Math.max(0, 1 - deviation / idealPerZone);
  const emptyPenalty = emptyZones * 0.15;
  const concentrationPenalty = maxInZone > idealPerZone * 2 ? 0.2 : 0;
  return Math.max(0, Math.min(100, Math.round((balance - emptyPenalty - concentrationPenalty) * 100)));
}

/** Human pattern detection — penalizes date-like, visual lines, arithmetic sequences */
export function computeHumanPatternPenalty(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  let penalty = 0;

  // Date-like: all numbers ≤ 31 and many ≤ 12
  const under31 = sorted.filter(n => n <= 31).length;
  const under12 = sorted.filter(n => n <= 12).length;
  if (under31 === sorted.length) penalty += 15;
  if (under12 >= sorted.length * 0.6) penalty += 10;

  // Arithmetic sequences (constant difference)
  if (sorted.length >= 4) {
    const diff = sorted[1] - sorted[0];
    let isArith = diff > 0;
    for (let i = 2; i < sorted.length && isArith; i++) {
      if (sorted[i] - sorted[i - 1] !== diff) isArith = false;
    }
    if (isArith) penalty += 25;
  }

  // Multiples of 5 or 10 dominance
  const mult5 = sorted.filter(n => n % 5 === 0).length;
  if (mult5 >= sorted.length * 0.6) penalty += 10;

  // All same last digit
  const lastDigits = new Set(sorted.map(n => n % 10));
  if (lastDigits.size <= 2 && sorted.length >= 5) penalty += 15;

  return Math.min(50, penalty);
}

/** Lightweight Monte Carlo simulation — fast backtesting proxy */
export function lightMonteCarlo(
  game: number[],
  draws: DrawResult[],
  simCount: number = 50
): { avgHits: number; consistency: number; prizeRate: number } {
  const gameSet = new Set(game);
  const subset = draws.slice(0, Math.min(simCount, draws.length));
  if (subset.length === 0) return { avgHits: 0, consistency: 0, prizeRate: 0 };

  const hits: number[] = [];
  for (const d of subset) {
    hits.push(d.numbers.filter(n => gameSet.has(n)).length);
  }
  const avg = hits.reduce((a, b) => a + b, 0) / hits.length;
  const variance = hits.reduce((s, h) => s + (h - avg) ** 2, 0) / hits.length;
  const stdDev = Math.sqrt(variance);
  // Consistency: lower variance = higher consistency (0-1)
  const consistency = Math.max(0, 1 - stdDev / (avg || 1));
  // Prize rate: how many draws would have hit at least some threshold
  const minPrize = Math.max(2, Math.floor(game.length * 0.4));
  const prizeRate = hits.filter(h => h >= minPrize).length / hits.length;

  return { avgHits: avg, consistency, prizeRate };
}

/** Dynamic weight calibration based on recent draw patterns */
export function calibrateDynamicWeights(
  draws: DrawResult[],
  lotteryId: string
): Record<string, number> {
  const rules = getLotteryRules(lotteryId);
  const recent = draws.slice(0, 30);
  if (recent.length < 10) return { frequency: 0.25, gap: 0.15, trend: 0.2, coOccurrence: 0.15, zone: 0.1, cycle: 0.1, special: 0.05, antiPopular: 0 };

  // Measure how predictive each signal was in recent draws
  const sums = recent.map(d => d.numbers.reduce((a, b) => a + b, 0));
  const avgSum = sums.reduce((a, b) => a + b, 0) / sums.length;
  const sumStability = 1 - Math.min(1, Math.abs(avgSum - (rules.idealSumRange[0] + rules.idealSumRange[1]) / 2) / ((rules.idealSumRange[1] - rules.idealSumRange[0]) / 2));

  // Repeat stability
  let repeatStd = 0;
  const repeats: number[] = [];
  for (let i = 0; i < recent.length - 1; i++) {
    const prev = new Set(recent[i + 1].numbers);
    repeats.push(recent[i].numbers.filter(n => prev.has(n)).length);
  }
  if (repeats.length > 0) {
    const avgR = repeats.reduce((a, b) => a + b, 0) / repeats.length;
    repeatStd = Math.sqrt(repeats.reduce((s, r) => s + (r - avgR) ** 2, 0) / repeats.length);
  }
  const repeatStable = Math.max(0, 1 - repeatStd / (rules.pick * 0.3));

  // Boost trend weight when recent draws show momentum patterns
  const trendWeight = sumStability > 0.7 ? 0.25 : 0.18;
  const gapWeight = repeatStable < 0.5 ? 0.2 : 0.13;

  return {
    frequency: 0.22 + sumStability * 0.06,
    gap: gapWeight,
    trend: trendWeight,
    coOccurrence: 0.13 + repeatStable * 0.05,
    zone: 0.1,
    cycle: 0.08 + (1 - sumStability) * 0.05,
    special: 0.04,
    antiPopular: 0,
  };
}

/** Build an advanced weight map incorporating all analyses */
export function buildAdvancedWeightMap(
  stats: NumberStats[],
  draws: DrawResult[],
  lotteryId: string,
  engineWeights?: Record<string, number>
): Map<number, number> {
  const rules = getLotteryRules(lotteryId);
  const trends = multiWindowTrend(draws, rules.totalNumbers);
  const gapPredictions = predictGapReturns(stats, stats.length);
  const coOcc = computeCoOccurrence(draws, rules.totalNumbers, 50);
  const zoneAnalysis = analyzeZoneDistribution(draws, lotteryId);

  // Use dynamic calibration if no explicit weights provided
  const dynamicWeights = calibrateDynamicWeights(draws, lotteryId);
  const ew = {
    frequency: engineWeights?.frequency ?? dynamicWeights.frequency,
    gap: engineWeights?.gap ?? dynamicWeights.gap,
    trend: engineWeights?.trend ?? dynamicWeights.trend,
    coOccurrence: engineWeights?.coOccurrence ?? dynamicWeights.coOccurrence,
    zone: engineWeights?.zone ?? dynamicWeights.zone,
    cycle: engineWeights?.cycle ?? dynamicWeights.cycle,
    special: engineWeights?.special ?? dynamicWeights.special,
    antiPopular: engineWeights?.antiPopular ?? dynamicWeights.antiPopular,
  };

  const weights = new Map<number, number>();

  // Collect co-occurrence boost numbers
  const coOccBoost = new Map<number, number>();
  for (const pair of coOcc.topPairs) {
    coOccBoost.set(pair.a, (coOccBoost.get(pair.a) || 0) + pair.lift * 0.1);
    coOccBoost.set(pair.b, (coOccBoost.get(pair.b) || 0) + pair.lift * 0.1);
  }

  // Anti-popularity: penalize most frequent numbers
  const maxFreq = Math.max(...stats.map(s => s.frequency));

  for (const s of stats) {
    let w = 1.0;

    // Frequency weight (scaled by engine weight)
    const freqBonus = s.status === "hot" ? 1.5 : s.status === "cold" ? 0.5 : 0.8;
    w += freqBonus * ew.frequency * 8;

    // Trend weight (multi-window)
    const trend = trends.find(t => t.number === s.number);
    if (trend) {
      const trendBonus = trend.regime === "ascending" ? 2.0 : trend.regime === "descending" ? -0.5 : 0;
      w += trendBonus * ew.trend * 5;
      w += trend.acceleration * ew.trend * 15;
    }

    // Gap prediction weight
    const gap = gapPredictions.find(g => g.number === s.number);
    if (gap && gap.overdueFactor > 1.3) {
      w += Math.min(3, (gap.overdueFactor - 1) * 2) * ew.gap * 5;
    }

    // Co-occurrence boost
    const coBoost = coOccBoost.get(s.number) || 0;
    w += Math.min(1.5, coBoost) * ew.coOccurrence * 5;

    // Cycle score
    if (s.cycleScore > 1.2) w += (s.cycleScore - 1) * ew.cycle * 8;

    // Momentum
    if (s.momentum > 0) w += s.momentum * ew.trend * 0.01;

    // Special numbers (primes/fibonacci)
    if (PRIMES.has(s.number)) w += ew.special * 3;
    if (FIBONACCI.has(s.number)) w += ew.special * 2.5;

    // Anti-popular: penalize popular numbers
    if (ew.antiPopular > 0) {
      const popRatio = s.frequency / maxFreq;
      w -= popRatio * ew.antiPopular * 4;
    }

    weights.set(s.number, Math.max(0.05, w));
  }

  return weights;
}
