/**
 * Native AI — Pattern Engine
 * Detects and scores structural patterns in lottery games
 */

import { DrawResult } from "@/data/lotteries";
import { getLotteryRules, LOTOFACIL_FRAME, LOTOFACIL_CENTER } from "../knowledge/lotteriesKnowledge";

export interface PatternProfile {
  parityBalance: number;      // 0-1 how balanced even/odd
  sumProximity: number;        // 0-1 how close to ideal sum
  sequencePenalty: number;     // 0-1 penalty for long sequences (lower = more penalty)
  rowBalance: number;          // 0-1 how balanced across rows
  colBalance: number;          // 0-1 how balanced across columns
  frameCenterBalance: number;  // 0-1 (Lotofácil)
  repeatScore: number;         // 0-1 how well repeat matches historical avg
  dispersalScore: number;      // 0-1 how spread out numbers are
  overallScore: number;        // weighted composite
}

export function computePatternProfile(
  numbers: number[],
  lotteryId: string,
  previousDraw?: number[]
): PatternProfile {
  const rules = getLotteryRules(lotteryId);
  const sorted = [...numbers].sort((a, b) => a - b);

  // Parity balance
  const even = sorted.filter(n => n % 2 === 0).length;
  const [minE, maxE] = rules.idealParityRange;
  const parityBalance = even >= minE && even <= maxE ? 1.0 :
    1.0 - Math.min(1, Math.abs(even - (minE + maxE) / 2) / (rules.pick / 2));

  // Sum proximity
  const sum = sorted.reduce((a, b) => a + b, 0);
  const [lo, hi] = rules.idealSumRange;
  const mid = (lo + hi) / 2;
  const range = hi - lo;
  const sumProximity = sum >= lo && sum <= hi ? 1.0 :
    Math.max(0, 1.0 - Math.abs(sum - mid) / range);

  // Sequence penalty
  let maxSeq = 1, curSeq = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) { curSeq++; maxSeq = Math.max(maxSeq, curSeq); }
    else curSeq = 1;
  }
  const sequencePenalty = maxSeq <= rules.maxRecommendedSequence ? 1.0 :
    Math.max(0, 1.0 - (maxSeq - rules.maxRecommendedSequence) * 0.25);

  // Row/col balance
  const rows = new Array(rules.gridRows).fill(0);
  const cols = new Array(rules.gridCols).fill(0);
  for (const n of sorted) {
    const idx = n - 1;
    if (rules.gridCols > 0) {
      rows[Math.min(Math.floor(idx / rules.gridCols), rules.gridRows - 1)]++;
      cols[idx % rules.gridCols]++;
    }
  }
  const idealPerRow = rules.pick / rules.gridRows;
  const rowDeviation = rows.reduce((s, r) => s + Math.abs(r - idealPerRow), 0) / rules.gridRows;
  const rowBalance = Math.max(0, 1 - rowDeviation / idealPerRow);

  const idealPerCol = rules.pick / rules.gridCols;
  const colDeviation = cols.reduce((s, c) => s + Math.abs(c - idealPerCol), 0) / rules.gridCols;
  const colBalance = Math.max(0, 1 - colDeviation / idealPerCol);

  // Frame/Center
  let frameCenterBalance = 1.0;
  if (lotteryId === "lotofacil") {
    const frame = sorted.filter(n => LOTOFACIL_FRAME.has(n)).length;
    const [minF, maxF] = rules.idealFrameRange || [8, 11];
    frameCenterBalance = frame >= minF && frame <= maxF ? 1.0 :
      Math.max(0, 1.0 - Math.abs(frame - (minF + maxF) / 2) / 4);
  }

  // Repeat score
  let repeatScore = 1.0;
  if (previousDraw) {
    const prevSet = new Set(previousDraw);
    const repeat = sorted.filter(n => prevSet.has(n)).length;
    const [minR, maxR] = rules.avgRepeatFromPrevious;
    repeatScore = repeat >= minR && repeat <= maxR ? 1.0 :
      Math.max(0, 1.0 - Math.abs(repeat - (minR + maxR) / 2) / rules.pick);
  }

  // Dispersal
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i] - sorted[i - 1]);
  const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 1;
  const idealGap = (rules.totalNumbers - 1) / (rules.pick - 1);
  const dispersalScore = Math.max(0, 1 - Math.abs(avgGap - idealGap) / idealGap);

  const overallScore = (
    parityBalance * 0.15 +
    sumProximity * 0.15 +
    sequencePenalty * 0.15 +
    rowBalance * 0.10 +
    colBalance * 0.10 +
    frameCenterBalance * 0.10 +
    repeatScore * 0.10 +
    dispersalScore * 0.15
  );

  return {
    parityBalance, sumProximity, sequencePenalty,
    rowBalance, colBalance, frameCenterBalance,
    repeatScore, dispersalScore, overallScore,
  };
}

/** Analyze how often specific patterns appear across history */
export function detectHistoricalPatterns(draws: DrawResult[], lotteryId: string): string[] {
  const rules = getLotteryRules(lotteryId);
  const recent = draws.slice(0, 50);
  const patterns: string[] = [];

  // Parity trend
  const evenCounts = recent.map(d => d.numbers.filter(n => n % 2 === 0).length);
  const avgEven = evenCounts.reduce((a, b) => a + b, 0) / evenCounts.length;
  patterns.push(`Par/Ímpar médio: ${avgEven.toFixed(1)}/${(rules.pick - avgEven).toFixed(1)}`);

  // Sum trend
  const sums = recent.map(d => d.numbers.reduce((a, b) => a + b, 0));
  const avgSum = Math.round(sums.reduce((a, b) => a + b, 0) / sums.length);
  patterns.push(`Soma média: ${avgSum}`);

  // Repeat pattern
  let totalRepeat = 0;
  for (let i = 0; i < recent.length - 1; i++) {
    const prevSet = new Set(recent[i + 1].numbers);
    totalRepeat += recent[i].numbers.filter(n => prevSet.has(n)).length;
  }
  if (recent.length > 1) {
    patterns.push(`Repetição média: ${(totalRepeat / (recent.length - 1)).toFixed(1)} números`);
  }

  // Frame (Lotofácil)
  if (lotteryId === "lotofacil") {
    const frameCounts = recent.map(d => d.numbers.filter(n => LOTOFACIL_FRAME.has(n)).length);
    const avgFrame = frameCounts.reduce((a, b) => a + b, 0) / frameCounts.length;
    patterns.push(`Moldura média: ${avgFrame.toFixed(1)} / Centro: ${(rules.pick - avgFrame).toFixed(1)}`);
  }

  // Prime distribution
  const primes = new Set([2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59]);
  const primeCounts = recent.map(d => d.numbers.filter(n => primes.has(n)).length);
  const avgPrimes = primeCounts.reduce((a, b) => a + b, 0) / primeCounts.length;
  patterns.push(`Primos médio: ${avgPrimes.toFixed(1)} de ${rules.pick}`);

  // Fibonacci proximity
  const fibs = new Set([1,2,3,5,8,13,21,34,55]);
  const fibCounts = recent.map(d => d.numbers.filter(n => fibs.has(n)).length);
  const avgFibs = fibCounts.reduce((a, b) => a + b, 0) / fibCounts.length;
  patterns.push(`Fibonacci médio: ${avgFibs.toFixed(1)}`);

  return patterns;
}

// ═══════════════════════════════════════════════════════
// ADVANCED PATTERN METRICS
// ═══════════════════════════════════════════════════════

export interface AdvancedPatternMetrics {
  primeRatio: number;          // 0-1
  fibonacciCount: number;
  multiplesOf5Count: number;
  edgeRatio: number;           // numbers at edges of range
  quadrantBalance: number;     // 0-1 how balanced across 4 quadrants
  gapVariance: number;         // lower = more evenly spaced
  digitSumBalance: number;     // balance of digit sums
  compositeScore: number;      // 0-100
}

const PRIMES = new Set([2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59]);
const FIBS = new Set([1,2,3,5,8,13,21,34,55]);

/** Compute advanced structural metrics for a game */
export function computeAdvancedPatterns(
  numbers: number[],
  totalNumbers: number
): AdvancedPatternMetrics {
  const sorted = [...numbers].sort((a, b) => a - b);
  const pick = numbers.length;

  // Prime ratio
  const primeCount = sorted.filter(n => PRIMES.has(n)).length;
  const expectedPrimes = pick * (PRIMES.size / totalNumbers);
  const primeDev = Math.abs(primeCount - expectedPrimes) / Math.max(1, expectedPrimes);
  const primeRatio = primeCount / pick;

  // Fibonacci
  const fibonacciCount = sorted.filter(n => FIBS.has(n)).length;

  // Multiples of 5
  const multiplesOf5Count = sorted.filter(n => n % 5 === 0).length;

  // Edge ratio: numbers in first 20% or last 20% of range
  const edgeThreshold = Math.ceil(totalNumbers * 0.2);
  const edgeCount = sorted.filter(n => n <= edgeThreshold || n > totalNumbers - edgeThreshold).length;
  const edgeRatio = edgeCount / pick;

  // Quadrant balance: divide number range into 4 equal parts
  const qSize = Math.ceil(totalNumbers / 4);
  const quadrants = [0, 0, 0, 0];
  for (const n of sorted) {
    const q = Math.min(3, Math.floor((n - 1) / qSize));
    quadrants[q]++;
  }
  const idealPerQ = pick / 4;
  const qDeviation = quadrants.reduce((s, q) => s + Math.abs(q - idealPerQ), 0) / 4;
  const quadrantBalance = Math.max(0, 1 - qDeviation / idealPerQ);

  // Gap variance: measure evenness of spacing
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i] - sorted[i - 1]);
  const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 1;
  const gapVariance = gaps.length > 0
    ? gaps.reduce((s, g) => s + (g - avgGap) ** 2, 0) / gaps.length
    : 0;
  const normalizedGapVar = Math.min(1, gapVariance / (avgGap * avgGap + 1));

  // Digit sum balance: sum of digits of each number
  const digitSums = sorted.map(n => {
    let s = 0, x = n;
    while (x > 0) { s += x % 10; x = Math.floor(x / 10); }
    return s;
  });
  const avgDigitSum = digitSums.reduce((a, b) => a + b, 0) / digitSums.length;
  const digitSumVar = digitSums.reduce((s, d) => s + (d - avgDigitSum) ** 2, 0) / digitSums.length;
  const digitSumBalance = Math.max(0, 1 - Math.sqrt(digitSumVar) / Math.max(1, avgDigitSum));

  // Composite: reward balanced games
  const compositeScore = Math.round(
    (1 - Math.min(1, primeDev)) * 15 +
    quadrantBalance * 30 +
    (1 - normalizedGapVar) * 25 +
    digitSumBalance * 15 +
    (1 - Math.abs(edgeRatio - 0.4) * 2) * 15
  );

  return {
    primeRatio, fibonacciCount, multiplesOf5Count,
    edgeRatio, quadrantBalance, gapVariance: normalizedGapVar,
    digitSumBalance, compositeScore,
  };
}

/** Score a game using advanced pattern metrics */
export function scoreAdvancedPatterns(
  game: number[],
  lotteryId: string
): number {
  const rules = getLotteryRules(lotteryId);
  const metrics = computeAdvancedPatterns(game, rules.totalNumbers);
  return metrics.compositeScore;
}
