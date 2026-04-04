/**
 * Native AI — Probability Engine
 * Monte Carlo, entropy, chi-square, Markov and stress testing
 */

import { DrawResult } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";
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
