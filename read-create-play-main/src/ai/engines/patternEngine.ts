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
  decadeBalance: number;       // 0-1 spread across decades (avoid all-same-decade)
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

  // Decade balance — spread across decades (1-10, 11-20, ...). Penalize concentration.
  const decadeBuckets = Math.max(2, Math.ceil(rules.totalNumbers / 10));
  const decadeCounts = new Array(decadeBuckets).fill(0);
  for (const n of sorted) {
    const idx = Math.min(Math.floor((n - 1) / 10), decadeBuckets - 1);
    decadeCounts[idx]++;
  }
  const usedDecades = decadeCounts.filter(c => c > 0).length;
  const idealDecades = Math.min(decadeBuckets, Math.max(2, Math.ceil(rules.pick / 3)));
  const maxInOneDecade = Math.max(...decadeCounts);
  const concentrationPenalty = maxInOneDecade > Math.ceil(rules.pick * 0.6) ? 0.5 : 1;
  const decadeBalance = Math.max(
    0,
    Math.min(1, (usedDecades / idealDecades) * concentrationPenalty),
  );

  const overallScore = (
    parityBalance * 0.14 +
    sumProximity * 0.16 +
    sequencePenalty * 0.13 +
    rowBalance * 0.09 +
    colBalance * 0.09 +
    frameCenterBalance * 0.09 +
    repeatScore * 0.10 +
    dispersalScore * 0.10 +
    decadeBalance * 0.10
  );

  return {
    parityBalance, sumProximity, sequencePenalty,
    rowBalance, colBalance, frameCenterBalance,
    repeatScore, dispersalScore, decadeBalance, overallScore,
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

  return patterns;
}
