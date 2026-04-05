/**
 * Native AI — Markov Transition Matrix Engine
 * Computes transition probabilities between numbers across consecutive draws.
 * PURE OVERLAY — no existing logic modified.
 */

import { DrawResult } from "@/data/lotteries";
import { getLotteryRules } from "../knowledge/lotteriesKnowledge";

// ═══════════════════════════════════════════════════════
// 1. TRANSITION MATRIX
// ═══════════════════════════════════════════════════════

export interface TransitionMatrix {
  /** Probability of number j appearing given number i appeared last draw */
  matrix: Map<number, Map<number, number>>;
  totalNumbers: number;
  drawsAnalyzed: number;
}

/** Build a Markov transition matrix from consecutive draws */
export function buildTransitionMatrix(
  draws: DrawResult[],
  lotteryId: string,
  windowSize: number = 100
): TransitionMatrix {
  const rules = getLotteryRules(lotteryId);
  const window = draws.slice(0, Math.min(windowSize, draws.length));
  const matrix = new Map<number, Map<number, number>>();

  // Initialize
  for (let i = 1; i <= rules.totalNumbers; i++) {
    matrix.set(i, new Map());
  }

  // Count transitions: for each number in draw[t], count which numbers appear in draw[t+1]
  for (let t = 0; t < window.length - 1; t++) {
    const current = window[t].numbers;
    const next = window[t + 1].numbers;
    const nextSet = new Set(next);

    for (const from of current) {
      const row = matrix.get(from)!;
      for (const to of next) {
        row.set(to, (row.get(to) || 0) + 1);
      }
    }
  }

  // Normalize rows to probabilities
  for (const [from, row] of matrix) {
    const total = Array.from(row.values()).reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const [to, count] of row) {
        row.set(to, count / total);
      }
    }
  }

  return { matrix, totalNumbers: rules.totalNumbers, drawsAnalyzed: window.length };
}

// ═══════════════════════════════════════════════════════
// 2. TRANSITION SCORING
// ═══════════════════════════════════════════════════════

export interface TransitionScore {
  /** Average transition probability from last draw to this game */
  avgTransitionProb: number;
  /** How many numbers have high transition probability */
  highProbCount: number;
  /** Numbers with strongest transition signal */
  strongSignals: { number: number; probability: number }[];
  /** Overall Markov score 0-100 */
  markovScore: number;
}

/** Score a candidate game against the Markov transition matrix */
export function scoreByTransitionMatrix(
  candidate: number[],
  lastDraw: number[],
  matrix: TransitionMatrix
): TransitionScore {
  const probs: { number: number; probability: number }[] = [];
  const baseProb = 1 / matrix.totalNumbers; // uniform baseline

  for (const n of candidate) {
    let totalProb = 0;
    let count = 0;

    for (const from of lastDraw) {
      const row = matrix.matrix.get(from);
      if (row) {
        totalProb += row.get(n) || 0;
        count++;
      }
    }

    const avgProb = count > 0 ? totalProb / count : 0;
    probs.push({ number: n, probability: avgProb });
  }

  // Sort by probability descending
  probs.sort((a, b) => b.probability - a.probability);

  const avgTransitionProb = probs.reduce((s, p) => s + p.probability, 0) / probs.length;
  const highProbThreshold = baseProb * 1.5;
  const highProbCount = probs.filter(p => p.probability > highProbThreshold).length;
  const strongSignals = probs.filter(p => p.probability > baseProb * 2).slice(0, 5);

  // Markov score: reward moderate alignment (not too predictable, not too random)
  const alignmentRatio = avgTransitionProb / Math.max(baseProb, 0.001);
  const markovScore = Math.round(
    Math.min(100, Math.max(0,
      // Sweet spot: 1.0-2.0x baseline probability
      alignmentRatio >= 1.0 && alignmentRatio <= 2.5
        ? 50 + (alignmentRatio - 1.0) * 30
        : alignmentRatio > 2.5
          ? 80 - (alignmentRatio - 2.5) * 15 // slightly penalize overfitting
          : 30 + alignmentRatio * 20
    ))
  );

  return { avgTransitionProb, highProbCount, strongSignals, markovScore };
}

// ═══════════════════════════════════════════════════════
// 3. SECOND-ORDER TRANSITIONS (pairs → next)
// ═══════════════════════════════════════════════════════

export interface PairTransition {
  pair: [number, number];
  nextNumbers: Map<number, number>; // number → probability
}

/** Build pair-to-next transition probabilities for strongest co-occurring pairs */
export function buildPairTransitions(
  draws: DrawResult[],
  lotteryId: string,
  topPairsCount: number = 30,
  windowSize: number = 80
): PairTransition[] {
  const rules = getLotteryRules(lotteryId);
  const window = draws.slice(0, Math.min(windowSize, draws.length));
  if (window.length < 10) return [];

  // Find most frequent pairs
  const pairFreq = new Map<string, { pair: [number, number]; count: number }>();
  for (const d of window) {
    const nums = d.numbers;
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]},${nums[j]}`;
        if (!pairFreq.has(key)) pairFreq.set(key, { pair: [nums[i], nums[j]], count: 0 });
        pairFreq.get(key)!.count++;
      }
    }
  }

  const topPairs = Array.from(pairFreq.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, topPairsCount);

  // For each top pair, find what numbers follow
  const result: PairTransition[] = [];
  for (const { pair } of topPairs) {
    const nextFreq = new Map<number, number>();
    let occurrences = 0;

    for (let t = 0; t < window.length - 1; t++) {
      const numSet = new Set(window[t].numbers);
      if (numSet.has(pair[0]) && numSet.has(pair[1])) {
        occurrences++;
        for (const n of window[t + 1].numbers) {
          nextFreq.set(n, (nextFreq.get(n) || 0) + 1);
        }
      }
    }

    if (occurrences >= 3) {
      // Normalize
      for (const [n, count] of nextFreq) {
        nextFreq.set(n, count / occurrences);
      }
      result.push({ pair, nextNumbers: nextFreq });
    }
  }

  return result;
}

/** Score candidate game against pair transitions */
export function scoreByPairTransitions(
  candidate: number[],
  lastDraw: number[],
  pairTransitions: PairTransition[]
): number {
  if (pairTransitions.length === 0) return 50;

  const lastSet = new Set(lastDraw);
  let totalBoost = 0;
  let matchedPairs = 0;

  for (const pt of pairTransitions) {
    if (lastSet.has(pt.pair[0]) && lastSet.has(pt.pair[1])) {
      matchedPairs++;
      for (const n of candidate) {
        const prob = pt.nextNumbers.get(n) || 0;
        totalBoost += prob;
      }
    }
  }

  if (matchedPairs === 0) return 50;

  const avgBoost = totalBoost / (matchedPairs * candidate.length);
  return Math.round(Math.min(100, 50 + avgBoost * 80));
}

// ═══════════════════════════════════════════════════════
// 4. STATIONARY DISTRIBUTION — Long-term expected frequencies
// ═══════════════════════════════════════════════════════

/** Estimate stationary distribution via power iteration */
export function computeStationaryDistribution(
  matrix: TransitionMatrix,
  iterations: number = 50
): Map<number, number> {
  const n = matrix.totalNumbers;
  let dist = new Map<number, number>();
  
  // Start uniform
  for (let i = 1; i <= n; i++) dist.set(i, 1 / n);

  for (let iter = 0; iter < iterations; iter++) {
    const next = new Map<number, number>();
    for (let j = 1; j <= n; j++) next.set(j, 0);

    for (let i = 1; i <= n; i++) {
      const pi = dist.get(i) || 0;
      const row = matrix.matrix.get(i);
      if (!row) continue;
      for (const [j, pij] of row) {
        next.set(j, (next.get(j) || 0) + pi * pij);
      }
    }

    // Normalize
    const total = Array.from(next.values()).reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const [k, v] of next) next.set(k, v / total);
    }
    dist = next;
  }

  return dist;
}

/** Score candidate by how well it aligns with long-term stationary probabilities */
export function scoreByStationaryDist(
  candidate: number[],
  stationary: Map<number, number>
): number {
  if (stationary.size === 0) return 50;

  const avgProb = Array.from(stationary.values()).reduce((a, b) => a + b, 0) / stationary.size;
  let score = 0;

  for (const n of candidate) {
    const p = stationary.get(n) || 0;
    score += p / Math.max(avgProb, 0.0001);
  }

  const avgRatio = score / candidate.length;
  // Score: 1.0 = perfectly average, >1.0 = above average alignment
  return Math.round(Math.min(100, Math.max(0, 40 + avgRatio * 25)));
}
