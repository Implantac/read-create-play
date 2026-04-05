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
  const harmonic = computeHarmonicProfile(game, rules.totalNumbers);
  // Blend classic composite with harmonic quality
  return Math.round(metrics.compositeScore * 0.7 + harmonic.harmonicScore * 0.3);
}

// ═══════════════════════════════════════════════════════
// HARMONIC & GOLDEN RATIO ANALYSIS
// ═══════════════════════════════════════════════════════

const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio ≈ 1.618

export interface HarmonicProfile {
  goldenRatioProximity: number;  // 0-1 how close gap ratios are to φ
  modularBalance: number;        // 0-1 balance across modular residues
  harmonicMean: number;          // harmonic mean of gaps
  geometricSpread: number;       // geometric mean / arithmetic mean ratio
  harmonicScore: number;         // 0-100 composite
}

/** Analyze harmonic properties — golden ratio proximity, modular patterns */
export function computeHarmonicProfile(
  numbers: number[],
  totalNumbers: number
): HarmonicProfile {
  const sorted = [...numbers].sort((a, b) => a - b);
  const pick = sorted.length;

  // 1) Golden Ratio Proximity: measure how close consecutive gap ratios are to φ
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i] - sorted[i - 1]);

  let phiScore = 0;
  let phiCount = 0;
  for (let i = 1; i < gaps.length; i++) {
    if (gaps[i - 1] > 0) {
      const ratio = gaps[i] / gaps[i - 1];
      const invRatio = gaps[i - 1] / gaps[i];
      // Closest to φ or 1/φ
      const bestDist = Math.min(Math.abs(ratio - PHI), Math.abs(invRatio - PHI));
      phiScore += Math.max(0, 1 - bestDist / PHI);
      phiCount++;
    }
  }
  const goldenRatioProximity = phiCount > 0 ? phiScore / phiCount : 0.5;

  // 2) Modular Balance: check residues mod 3, 5, 7
  const modScores: number[] = [];
  for (const mod of [3, 5, 7]) {
    if (mod > totalNumbers) continue;
    const buckets = new Array(mod).fill(0);
    for (const n of sorted) buckets[n % mod]++;
    const ideal = pick / mod;
    const dev = buckets.reduce((s, b) => s + Math.abs(b - ideal), 0) / mod;
    modScores.push(Math.max(0, 1 - dev / ideal));
  }
  const modularBalance = modScores.length > 0
    ? modScores.reduce((a, b) => a + b, 0) / modScores.length
    : 0.5;

  // 3) Harmonic mean of gaps — rewards more even spacing
  const harmonicMean = gaps.length > 0
    ? gaps.length / gaps.reduce((s, g) => s + 1 / Math.max(0.5, g), 0)
    : 1;

  // 4) Geometric spread: geometric mean / arithmetic mean ratio
  //    Closer to 1 = more uniform gaps
  const arithmeticMean = gaps.length > 0
    ? gaps.reduce((a, b) => a + b, 0) / gaps.length
    : 1;
  const logSum = gaps.reduce((s, g) => s + Math.log(Math.max(0.5, g)), 0);
  const geometricMean = gaps.length > 0 ? Math.exp(logSum / gaps.length) : 1;
  const geometricSpread = arithmeticMean > 0 ? geometricMean / arithmeticMean : 0.5;

  // Composite
  const harmonicScore = Math.round(
    goldenRatioProximity * 25 +
    modularBalance * 30 +
    Math.min(1, harmonicMean / (totalNumbers / (pick - 1))) * 20 +
    geometricSpread * 25
  );

  return {
    goldenRatioProximity,
    modularBalance,
    harmonicMean,
    geometricSpread,
    harmonicScore,
  };
}

// ═══════════════════════════════════════════════════════
// POSITIONAL SEQUENCE DETECTOR
// ═══════════════════════════════════════════════════════

export interface SequenceReport {
  arithmeticRuns: number;       // count of arithmetic progressions (≥3 terms)
  mirrorPairs: number;          // pairs symmetric around midpoint
  terminalCluster: number;      // numbers in first/last 10% of range
  positionalScore: number;      // 0-100
}

/** Detect diagonal patterns on grid layout */
export function detectDiagonalPatterns(
  numbers: number[],
  gridRows: number,
  gridCols: number
): { mainDiagCount: number; antiDiagCount: number; diagonalScore: number } {
  if (gridCols === 0 || gridRows === 0) return { mainDiagCount: 0, antiDiagCount: 0, diagonalScore: 50 };
  
  const numSet = new Set(numbers);
  let mainDiagCount = 0;
  let antiDiagCount = 0;
  
  // Main diagonal: cells where row === col
  for (let i = 0; i < Math.min(gridRows, gridCols); i++) {
    const n = i * gridCols + i + 1;
    if (numSet.has(n)) mainDiagCount++;
  }
  
  // Anti-diagonal: cells where row + col === gridCols - 1
  for (let i = 0; i < Math.min(gridRows, gridCols); i++) {
    const n = i * gridCols + (gridCols - 1 - i) + 1;
    if (numSet.has(n)) antiDiagCount++;
  }
  
  const maxDiag = Math.min(gridRows, gridCols);
  const idealDiag = Math.round(numbers.length / (gridRows * gridCols / maxDiag));
  const diagDev = Math.abs(mainDiagCount - idealDiag) + Math.abs(antiDiagCount - idealDiag);
  const diagonalScore = Math.max(0, 100 - diagDev * 15);
  
  return { mainDiagCount, antiDiagCount, diagonalScore };
}

/** Detect Fibonacci-based spacing patterns */
export function detectFibonacciSpacing(numbers: number[]): { fibGaps: number; fibScore: number } {
  const sorted = [...numbers].sort((a, b) => a - b);
  const fibSet = new Set([1, 2, 3, 5, 8, 13, 21, 34]);
  
  let fibGaps = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (fibSet.has(gap)) fibGaps++;
  }
  
  // Score: moderate fibonacci gaps are interesting
  const ratio = fibGaps / Math.max(1, sorted.length - 1);
  const fibScore = Math.round(Math.min(100, ratio * 120 + 20));
  
  return { fibGaps, fibScore };
}

/** Detect prime number clustering patterns */
export function detectPrimeClusters(
  numbers: number[],
  totalNumbers: number
): { primeClusterScore: number; consecutivePrimes: number; primeGapPattern: string } {
  const primeSet = new Set([2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79]);
  const sorted = [...numbers].sort((a, b) => a - b);
  const primes = sorted.filter(n => primeSet.has(n));
  
  // Consecutive primes in selection
  let maxConsecPrimes = 0;
  let curConsec = 0;
  const allPrimesOrdered = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79].filter(p => p <= totalNumbers);
  
  for (let i = 0; i < allPrimesOrdered.length; i++) {
    if (new Set(numbers).has(allPrimesOrdered[i])) {
      curConsec++;
      maxConsecPrimes = Math.max(maxConsecPrimes, curConsec);
    } else {
      curConsec = 0;
    }
  }
  
  const expectedPrimeRatio = allPrimesOrdered.length / totalNumbers;
  const actualPrimeRatio = primes.length / numbers.length;
  const deviation = Math.abs(actualPrimeRatio - expectedPrimeRatio);
  
  const primeClusterScore = Math.max(0, Math.round(100 - deviation * 300 - maxConsecPrimes * 5));
  const primeGapPattern = maxConsecPrimes >= 3 ? "clustered" : maxConsecPrimes >= 2 ? "moderate" : "dispersed";
  
  return { primeClusterScore, consecutivePrimes: maxConsecPrimes, primeGapPattern };
}

/** Detect positional patterns: arithmetic runs, mirror symmetry, edge clusters */
export function detectPositionalPatterns(
  numbers: number[],
  totalNumbers: number
): SequenceReport {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = (totalNumbers + 1) / 2;
  const edgeThreshold = Math.ceil(totalNumbers * 0.1);

  // Arithmetic progressions (≥3 consecutive terms with same diff)
  let arithmeticRuns = 0;
  for (let i = 0; i < sorted.length - 2; i++) {
    const d = sorted[i + 1] - sorted[i];
    if (d > 0 && d <= 10) {
      let len = 2;
      for (let j = i + 2; j < sorted.length; j++) {
        if (sorted[j] - sorted[j - 1] === d) len++;
        else break;
      }
      if (len >= 3) arithmeticRuns++;
    }
  }

  // Mirror pairs: n and (totalNumbers + 1 - n) both present
  const numSet = new Set(sorted);
  let mirrorPairs = 0;
  for (const n of sorted) {
    const mirror = totalNumbers + 1 - n;
    if (mirror !== n && numSet.has(mirror) && n < mirror) mirrorPairs++;
  }

  // Terminal cluster
  const terminalCluster = sorted.filter(
    n => n <= edgeThreshold || n > totalNumbers - edgeThreshold
  ).length;

  // Score: penalize too many arithmetic runs, reward moderate mirror symmetry
  const runPenalty = Math.min(30, arithmeticRuns * 12);
  const mirrorBonus = Math.min(20, mirrorPairs * 8);
  const terminalPenalty = Math.max(0, (terminalCluster / sorted.length - 0.25) * 40);

  const positionalScore = Math.max(0, Math.min(100,
    70 - runPenalty + mirrorBonus - terminalPenalty
  ));

  return { arithmeticRuns, mirrorPairs, terminalCluster, positionalScore };
}
