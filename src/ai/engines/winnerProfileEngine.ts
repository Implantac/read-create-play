/**
 * Native AI — Winner Profile Engine
 * Builds a statistical "centroid" of recent winning draws per lottery
 * and exposes:
 *   - alignmentScore(game): how close a candidate is to the winners' profile
 *   - pair lift map + pairLiftBonus(game): bonus for historically strong pairs
 *
 * Used by the universal generator to bias candidates toward configurations
 * that have actually been winning the main prize tiers.
 */

import type { DrawResult } from "@/data/lotteries";
import { getLotteryRules, LOTOFACIL_FRAME, PRIMES, FIBONACCI } from "../knowledge/lotteriesKnowledge";

export interface WinnerProfile {
  lotteryId: string;
  sample: number;
  // mean / std for each dimension
  sum: { mean: number; std: number };
  even: { mean: number; std: number };
  repeat: { mean: number; std: number };
  maxSeq: { mean: number; std: number };
  avgGap: { mean: number; std: number };
  decadeUsed: { mean: number; std: number };
  frame: { mean: number; std: number };
  high: { mean: number; std: number };
  primes: { mean: number; std: number };
  fibo: { mean: number; std: number };
}

function meanStd(values: number[]): { mean: number; std: number } {
  if (values.length === 0) return { mean: 0, std: 1 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return { mean, std: Math.max(0.5, Math.sqrt(variance)) };
}

function gameStats(numbers: number[], lotteryId: string, prev?: number[]) {
  const rules = getLotteryRules(lotteryId);
  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const even = sorted.filter(n => n % 2 === 0).length;
  const prevSet = new Set(prev || []);
  const repeat = sorted.filter(n => prevSet.has(n)).length;
  let maxSeq = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) { cur++; maxSeq = Math.max(maxSeq, cur); } else cur = 1;
  }
  let totalGap = 0;
  for (let i = 1; i < sorted.length; i++) totalGap += sorted[i] - sorted[i - 1];
  const avgGap = sorted.length > 1 ? totalGap / (sorted.length - 1) : 0;
  const decadeBuckets = Math.max(2, Math.ceil(rules.totalNumbers / 10));
  const buckets = new Array(decadeBuckets).fill(0);
  for (const n of sorted) buckets[Math.min(Math.floor((n - 1) / 10), decadeBuckets - 1)]++;
  const decadeUsed = buckets.filter(c => c > 0).length;
  const frame = lotteryId === "lotofacil" ? sorted.filter(n => LOTOFACIL_FRAME.has(n)).length : 0;
  const mid = rules.totalNumbers / 2;
  const high = sorted.filter(n => n > mid).length;
  const primes = sorted.filter(n => PRIMES.has(n)).length;
  const fibo = sorted.filter(n => FIBONACCI.has(n)).length;
  return { sum, even, repeat, maxSeq, avgGap, decadeUsed, frame, high, primes, fibo };
}

export function computeWinnerProfile(
  draws: DrawResult[],
  lotteryId: string,
  windowSize = 200,
): WinnerProfile {
  const subset = draws.slice(0, Math.min(windowSize, draws.length));
  const dims = {
    sum: [] as number[], even: [] as number[], repeat: [] as number[],
    maxSeq: [] as number[], avgGap: [] as number[], decadeUsed: [] as number[],
    frame: [] as number[], high: [] as number[], primes: [] as number[], fibo: [] as number[],
  };
  for (let i = 0; i < subset.length; i++) {
    const prev = subset[i + 1]?.numbers;
    const g = gameStats(subset[i].numbers, lotteryId, prev);
    dims.sum.push(g.sum);
    dims.even.push(g.even);
    dims.repeat.push(g.repeat);
    dims.maxSeq.push(g.maxSeq);
    dims.avgGap.push(g.avgGap);
    dims.decadeUsed.push(g.decadeUsed);
    dims.frame.push(g.frame);
    dims.high.push(g.high);
    dims.primes.push(g.primes);
    dims.fibo.push(g.fibo);
  }
  return {
    lotteryId,
    sample: subset.length,
    sum: meanStd(dims.sum),
    even: meanStd(dims.even),
    repeat: meanStd(dims.repeat),
    maxSeq: meanStd(dims.maxSeq),
    avgGap: meanStd(dims.avgGap),
    decadeUsed: meanStd(dims.decadeUsed),
    frame: meanStd(dims.frame),
    high: meanStd(dims.high),
    primes: meanStd(dims.primes),
    fibo: meanStd(dims.fibo),
  };
}

/** Gaussian-like score per dimension: 1.0 at the mean, ~0.6 at ±1σ, ~0.13 at ±2σ */
function dimScore(value: number, m: { mean: number; std: number }): number {
  const z = (value - m.mean) / Math.max(0.5, m.std);
  return Math.exp(-0.5 * z * z);
}

/** 0..1 — overall alignment with the winners' profile */
export function alignmentScore(
  numbers: number[],
  profile: WinnerProfile,
  lotteryId: string,
  prev?: number[],
): number {
  const g = gameStats(numbers, lotteryId, prev);
  const parts = [
    { w: 0.18, s: dimScore(g.sum, profile.sum) },
    { w: 0.16, s: dimScore(g.even, profile.even) },
    { w: 0.12, s: dimScore(g.repeat, profile.repeat) },
    { w: 0.10, s: dimScore(g.maxSeq, profile.maxSeq) },
    { w: 0.10, s: dimScore(g.avgGap, profile.avgGap) },
    { w: 0.10, s: dimScore(g.decadeUsed, profile.decadeUsed) },
    { w: 0.08, s: dimScore(g.high, profile.high) },
    { w: 0.06, s: dimScore(g.primes, profile.primes) },
    { w: 0.04, s: dimScore(g.fibo, profile.fibo) },
  ];
  let weighted = parts.reduce((s, p) => s + p.w * p.s, 0);
  let totalW = parts.reduce((s, p) => s + p.w, 0);
  if (lotteryId === "lotofacil") {
    weighted += 0.10 * dimScore(g.frame, profile.frame);
    totalW += 0.10;
  }
  return weighted / totalW;
}

// ───────────────────────── Pair lift ─────────────────────────

export type PairLiftMap = Map<number, Map<number, number>>;

/**
 * Compute pair "lift" = observed / expected co-occurrence over the window.
 * Numbers are stored as a→b with a<b. Higher lift = pair appears together
 * more than chance would predict.
 */
export function computePairLift(
  draws: DrawResult[],
  totalNumbers: number,
  pick: number,
  windowSize = 200,
): PairLiftMap {
  const subset = draws.slice(0, Math.min(windowSize, draws.length));
  const n = subset.length;
  const lift: PairLiftMap = new Map();
  if (n === 0 || totalNumbers < 2 || pick < 2) return lift;

  // marginal counts
  const marg = new Array(totalNumbers + 1).fill(0);
  for (const d of subset) for (const v of d.numbers) marg[v]++;

  // joint counts
  const joint = new Map<number, Map<number, number>>();
  for (const d of subset) {
    const nums = [...d.numbers].sort((a, b) => a - b);
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const a = nums[i], b = nums[j];
        let row = joint.get(a);
        if (!row) { row = new Map(); joint.set(a, row); }
        row.set(b, (row.get(b) || 0) + 1);
      }
    }
  }

  // expected joint freq under independence
  for (const [a, row] of joint) {
    const rowOut = new Map<number, number>();
    for (const [b, jab] of row) {
      const pa = marg[a] / n;
      const pb = marg[b] / n;
      const expected = pa * pb * n;
      if (expected < 1) continue; // ignore noisy pairs
      const observed = jab;
      rowOut.set(b, observed / expected);
    }
    lift.set(a, rowOut);
  }
  return lift;
}

/** 0..1 — average pair-lift of the game (clamped). >1 lift means stronger than chance. */
export function pairLiftBonus(numbers: number[], lift: PairLiftMap): number {
  if (numbers.length < 2 || lift.size === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  let sum = 0, count = 0;
  for (let i = 0; i < sorted.length; i++) {
    const row = lift.get(sorted[i]);
    if (!row) continue;
    for (let j = i + 1; j < sorted.length; j++) {
      const l = row.get(sorted[j]);
      if (l === undefined) continue;
      sum += l;
      count++;
    }
  }
  if (count === 0) return 0;
  const avg = sum / count;
  // map lift 0.5..1.5 to 0..1
  return Math.max(0, Math.min(1, (avg - 0.5)));
}
