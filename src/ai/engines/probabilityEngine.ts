/**
 * Native AI — Probability Engine
 * Monte Carlo, entropy, chi-square, Markov and stress testing
 */

import { DrawResult } from "@/data/lotteries";
import { NumberStats } from "@/features/statistics/engine";
import { getLotteryRules } from "../knowledge/lotteriesKnowledge";

/** Fast PRNG (xorshift32) */
let _seed = Date.now() | 0;
function xorshift(): number {
  _seed ^= _seed << 13;
  _seed ^= _seed >> 17;
  _seed ^= _seed << 5;
  return ((_seed >>> 0) / 4294967296);
}

/** Generate random draw */
function randomDraw(total: number, pick: number): number[] {
  const arr: number[] = [];
  const pool = new Set<number>();
  while (pool.size < pick) {
    const n = Math.floor(xorshift() * total) + 1;
    if (!pool.has(n)) { pool.add(n); arr.push(n); }
  }
  return arr.sort((a, b) => a - b);
}

/** Monte Carlo simulation — test games against random draws */
export function monteCarloSimulate(
  games: number[][],
  lotteryId: string,
  iterations: number = 10000
): { gameResults: { numbers: number[]; avgHits: number; hitDist: Record<number, number> }[]; overallAvg: number } {
  const rules = getLotteryRules(lotteryId);
  _seed = Date.now() | 0;

  const results = games.map(game => {
    const gameSet = new Set(game);
    const hitDist: Record<number, number> = {};
    let totalHits = 0;

    for (let i = 0; i < iterations; i++) {
      const draw = randomDraw(rules.totalNumbers, rules.pick);
      const hits = draw.filter(n => gameSet.has(n)).length;
      totalHits += hits;
      hitDist[hits] = (hitDist[hits] || 0) + 1;
    }

    return { numbers: game, avgHits: totalHits / iterations, hitDist };
  });

  const overallAvg = results.reduce((s, r) => s + r.avgHits, 0) / results.length;
  return { gameResults: results, overallAvg };
}

/** Shannon entropy of number frequency distribution */
export function computeEntropy(stats: NumberStats[], totalDraws: number): number {
  if (totalDraws === 0) return 0;
  let entropy = 0;
  for (const s of stats) {
    const p = s.frequency / totalDraws;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  return entropy;
}

/** Chi-square test — how much the distribution deviates from uniform */
export function chiSquareTest(stats: NumberStats[], totalDraws: number, pick: number): { chiSquare: number; isUniform: boolean } {
  const totalNumbers = stats.length;
  const expected = (totalDraws * pick) / totalNumbers;
  let chiSquare = 0;
  for (const s of stats) {
    chiSquare += ((s.frequency - expected) ** 2) / expected;
  }
  // df = totalNumbers - 1; critical value at p=0.05 for df=24 is ~36.4
  const df = totalNumbers - 1;
  const criticalApprox = df + 2 * Math.sqrt(2 * df); // rough approximation
  return { chiSquare: Math.round(chiSquare * 100) / 100, isUniform: chiSquare < criticalApprox };
}

/** Weighted Markov transition probabilities with recency decay */
export function markovTransitions(
  draws: DrawResult[],
  totalNumbers: number,
  topN: number = 10
): Map<number, number[]> {
  const transitions = new Map<number, Map<number, number>>();

  for (let i = 0; i < draws.length - 1; i++) {
    const current = draws[i].numbers;
    const next = draws[i + 1].numbers;
    // Recency decay: recent transitions weigh more
    const weight = 1 / (1 + i * 0.05);
    for (const n of current) {
      if (!transitions.has(n)) transitions.set(n, new Map());
      const tMap = transitions.get(n)!;
      for (const m of next) {
        tMap.set(m, (tMap.get(m) || 0) + weight);
      }
    }
  }

  const result = new Map<number, number[]>();
  for (const [num, tMap] of transitions) {
    const sorted = [...tMap.entries()].sort((a, b) => b[1] - a[1]);
    result.set(num, sorted.slice(0, topN).map(([n]) => n));
  }
  return result;
}

/** Conditional probability: P(number | condition met in previous draw) */
export function conditionalProbability(
  draws: DrawResult[],
  totalNumbers: number,
  condition: (draw: number[]) => boolean
): Map<number, number> {
  const freq = new Map<number, number>();
  let conditionCount = 0;

  for (let i = 0; i < draws.length - 1; i++) {
    if (condition(draws[i + 1].numbers)) {
      conditionCount++;
      for (const n of draws[i].numbers) {
        freq.set(n, (freq.get(n) || 0) + 1);
      }
    }
  }

  const probs = new Map<number, number>();
  if (conditionCount === 0) return probs;
  for (const [n, count] of freq) {
    probs.set(n, count / conditionCount);
  }
  return probs;
}

/** Lag-weighted frequency: numbers that appeared recently get a recency boost */
export function computeRecencyWeightedFrequency(
  draws: DrawResult[],
  totalNumbers: number,
  window: number = 50
): Map<number, number> {
  const scores = new Map<number, number>();
  const subset = draws.slice(0, Math.min(window, draws.length));

  for (let i = 0; i < subset.length; i++) {
    const decay = Math.exp(-i * 0.04); // exponential decay
    for (const n of subset[i].numbers) {
      scores.set(n, (scores.get(n) || 0) + decay);
    }
  }

  // Normalize to 0-1
  let max = 0;
  for (const v of scores.values()) if (v > max) max = v;
  if (max > 0) {
    for (const [k, v] of scores) scores.set(k, v / max);
  }

  return scores;
}

/** Stress test — evaluate a game's robustness across multiple metrics */
export function stressTestGame(
  game: number[],
  lotteryId: string,
  draws: DrawResult[],
  simIterations: number = 5000
): { robustness: number; details: Record<string, number> } {
  const rules = getLotteryRules(lotteryId);
  const gameSet = new Set(game);

  // 1. Monte Carlo performance
  _seed = Date.now() | 0;
  let totalHits = 0;
  for (let i = 0; i < simIterations; i++) {
    const draw = randomDraw(rules.totalNumbers, rules.pick);
    totalHits += draw.filter(n => gameSet.has(n)).length;
  }
  const mcAvg = totalHits / simIterations;
  const expectedHits = rules.pick * game.length / rules.totalNumbers;
  const mcScore = Math.min(1, mcAvg / expectedHits);

  // 2. Historical backtesting
  const recent = draws.slice(0, 50);
  let histHits = 0;
  for (const d of recent) {
    histHits += d.numbers.filter(n => gameSet.has(n)).length;
  }
  const histAvg = recent.length > 0 ? histHits / recent.length : 0;
  const histScore = Math.min(1, histAvg / expectedHits);

  // 3. Structural diversity
  const sorted = [...game].sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i] - sorted[i - 1]);
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const idealGap = (rules.totalNumbers - 1) / (game.length - 1);
  const gapScore = Math.max(0, 1 - Math.abs(avgGap - idealGap) / idealGap);

  const robustness = Math.round((mcScore * 0.4 + histScore * 0.35 + gapScore * 0.25) * 100);

  return {
    robustness,
    details: {
      monteCarlo: Math.round(mcScore * 100),
      historical: Math.round(histScore * 100),
      structural: Math.round(gapScore * 100),
    },
  };
}

// ═══════════════════════════════════════════════════════
// 7. COVARIANCE NETWORK — Pair correlation strength analysis
// ═══════════════════════════════════════════════════════

export interface CovarianceEdge {
  a: number;
  b: number;
  correlation: number;  // -1 to 1 (Pearson-like for binary presence)
  significance: number; // 0-1
}

/** Compute pairwise correlation matrix for number co-appearance */
export function computeCovarianceNetwork(
  draws: DrawResult[],
  totalNumbers: number,
  minCorrelation: number = 0.08
): CovarianceEdge[] {
  const n = Math.min(200, draws.length);
  if (n < 30) return [];

  // Build binary presence matrix
  const presence: Uint8Array[] = [];
  for (let num = 0; num <= totalNumbers; num++) {
    presence.push(new Uint8Array(n));
  }
  for (let i = 0; i < n; i++) {
    for (const num of draws[i].numbers) {
      if (num >= 1 && num <= totalNumbers) presence[num][i] = 1;
    }
  }

  // Compute means
  const means = new Float64Array(totalNumbers + 1);
  for (let num = 1; num <= totalNumbers; num++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += presence[num][i];
    means[num] = sum / n;
  }

  const edges: CovarianceEdge[] = [];

  for (let a = 1; a <= totalNumbers; a++) {
    for (let b = a + 1; b <= totalNumbers; b++) {
      let cov = 0, varA = 0, varB = 0;
      for (let i = 0; i < n; i++) {
        const da = presence[a][i] - means[a];
        const db = presence[b][i] - means[b];
        cov += da * db;
        varA += da * da;
        varB += db * db;
      }
      const denom = Math.sqrt(varA * varB);
      if (denom < 1e-10) continue;

      const correlation = cov / denom;
      if (Math.abs(correlation) < minCorrelation) continue;

      // Significance via t-test approximation
      const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation + 1e-10));
      const significance = Math.min(1, Math.abs(t) / 3); // rough p-value proxy

      edges.push({ a, b, correlation, significance });
    }
  }

  return edges.sort((x, y) => Math.abs(y.correlation) - Math.abs(x.correlation));
}

/** Score a game based on how well it leverages positive correlations */
export function scoreByCorrelationNetwork(
  game: number[],
  edges: CovarianceEdge[]
): number {
  if (edges.length === 0) return 50;

  const gameSet = new Set(game);
  let positiveBoost = 0;
  let negativePenalty = 0;
  let matchCount = 0;

  for (const edge of edges) {
    if (gameSet.has(edge.a) && gameSet.has(edge.b)) {
      matchCount++;
      if (edge.correlation > 0) {
        positiveBoost += edge.correlation * edge.significance;
      } else {
        negativePenalty += Math.abs(edge.correlation) * edge.significance;
      }
    }
  }

  if (matchCount === 0) return 50;

  const netScore = (positiveBoost - negativePenalty * 0.5) / matchCount;
  return Math.min(100, Math.max(0, Math.round(50 + netScore * 200)));
}

// ═══════════════════════════════════════════════════════
// 8. TEMPORAL VOLATILITY — Measure number stability over time
// ═══════════════════════════════════════════════════════

export interface VolatilityProfile {
  number: number;
  volatility: number;        // 0-1, how erratic the frequency is
  trendStability: number;    // 0-1, consistency of direction
  regime: "stable" | "volatile" | "transitioning";
}

/** Compute volatility for each number using rolling window variance */
export function computeTemporalVolatility(
  draws: DrawResult[],
  totalNumbers: number,
  rollingWindow: number = 15
): VolatilityProfile[] {
  const n = Math.min(150, draws.length);
  if (n < rollingWindow * 2) return [];

  const profiles: VolatilityProfile[] = [];

  for (let num = 1; num <= totalNumbers; num++) {
    const rates: number[] = [];
    for (let start = 0; start + rollingWindow <= n; start++) {
      let count = 0;
      for (let i = start; i < start + rollingWindow; i++) {
        if (draws[i].numbers.includes(num)) count++;
      }
      rates.push(count / rollingWindow);
    }

    if (rates.length < 3) continue;

    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((s, r) => s + (r - mean) ** 2, 0) / rates.length;
    const volatility = Math.min(1, Math.sqrt(variance) / Math.max(0.01, mean));

    // Trend stability: count direction changes
    let dirChanges = 0;
    for (let i = 2; i < rates.length; i++) {
      const prev = rates[i - 1] - rates[i - 2];
      const curr = rates[i] - rates[i - 1];
      if ((prev > 0 && curr < 0) || (prev < 0 && curr > 0)) dirChanges++;
    }
    const trendStability = Math.max(0, 1 - dirChanges / (rates.length - 2));

    const regime: VolatilityProfile["regime"] =
      volatility < 0.3 && trendStability > 0.6 ? "stable" :
      volatility > 0.6 ? "volatile" : "transitioning";

    profiles.push({ number: num, volatility, trendStability, regime });
  }

  return profiles;
}

/** Score a game preferring numbers with stable, predictable behavior */
export function scoreByVolatility(
  game: number[],
  profiles: VolatilityProfile[],
  preferStable: boolean = true
): number {
  if (profiles.length === 0) return 50;

  const profileMap = new Map(profiles.map(p => [p.number, p]));
  let score = 0;
  let count = 0;

  for (const n of game) {
    const p = profileMap.get(n);
    if (!p) continue;
    count++;

    if (preferStable) {
      score += p.regime === "stable" ? 80 : p.regime === "transitioning" ? 55 : 30;
    } else {
      // High volatility = higher variance = potential for big wins
      score += p.regime === "volatile" ? 75 : p.regime === "transitioning" ? 60 : 45;
    }
  }

  return count > 0 ? Math.round(score / count) : 50;
}
