/**
 * Native AI — Statistics Engine
 * Comprehensive statistical analysis, reusing and extending existing engine
 */

import { DrawResult } from "@/data/lotteries";
import { NumberStats, computeFrequencyStats } from "@/engine/statistics";
import { getLotteryRules, PRIMES, FIBONACCI, LOTOFACIL_FRAME, LOTOFACIL_CENTER } from "../knowledge/lotteriesKnowledge";
import type { PatternAnalysis, HistoricalAnalysis } from "../core/aiTypes";
import { computeCycleProfiles, getCycleDueNumbers, getAcceleratingNumbers } from "./cycleEngine";
import { computeRegressionCandidates, getUpwardRegressionNumbers, getDownwardRegressionNumbers, computeMultiWindowRegression } from "./regressionEngine";
import { multiWindowTrend } from "./advancedAnalysisEngine";

/** Extended stats for AI engines — wraps existing computeFrequencyStats */
export function computeExtendedStats(draws: DrawResult[], lotteryId: string): NumberStats[] {
  const rules = getLotteryRules(lotteryId);
  return computeFrequencyStats(draws, rules.totalNumbers);
}

/** Compute pattern analysis for a single game */
export function analyzeGamePattern(
  numbers: number[],
  lotteryId: string,
  previousDraw?: number[]
): PatternAnalysis {
  const rules = getLotteryRules(lotteryId);
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = rules.totalNumbers / 2;

  const even = sorted.filter(n => n % 2 === 0).length;
  const odd = sorted.length - even;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const high = sorted.filter(n => n > mid).length;
  const low = sorted.length - high;

  // Row & col distribution
  const rows = new Array(rules.gridRows).fill(0);
  const cols = new Array(rules.gridCols).fill(0);
  for (const n of sorted) {
    const idx = n - 1;
    if (rules.gridCols > 0) {
      rows[Math.floor(idx / rules.gridCols)]++;
      cols[idx % rules.gridCols]++;
    }
  }

  // Frame/center (Lotofácil specific)
  let frameCount = 0, centerCount = 0;
  if (lotteryId === "lotofacil") {
    frameCount = sorted.filter(n => LOTOFACIL_FRAME.has(n)).length;
    centerCount = sorted.filter(n => LOTOFACIL_CENTER.has(n)).length;
  }

  // Max sequence
  let maxSeq = 1, curSeq = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) { curSeq++; maxSeq = Math.max(maxSeq, curSeq); }
    else curSeq = 1;
  }

  // Consecutive pairs
  let consec = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) consec++;
  }

  // Repeat from previous
  const prevSet = new Set(previousDraw || []);
  const repeatFromPrevious = sorted.filter(n => prevSet.has(n)).length;

  const [lo, hi] = rules.idealSumRange;
  const sumZone = sum < lo ? "low" : sum > hi ? "high" : "normal";

  return {
    parityRatio: { even, odd },
    sumValue: sum,
    sumZone,
    rowDistribution: rows,
    colDistribution: cols,
    frameCount,
    centerCount,
    maxSequence: maxSeq,
    consecutivePairs: consec,
    highLowRatio: { high, low },
    primeCount: sorted.filter(n => PRIMES.has(n)).length,
    fibonacciCount: sorted.filter(n => FIBONACCI.has(n)).length,
    repeatFromPrevious,
  };
}

/** Full historical analysis for a given window */
export function analyzeHistory(
  draws: DrawResult[],
  lotteryId: string,
  window: number = 100
): HistoricalAnalysis {
  const rules = getLotteryRules(lotteryId);
  const subset = draws.slice(0, Math.min(window, draws.length));
  const stats = computeFrequencyStats(subset, rules.totalNumbers);

  const avgFreq = subset.length > 0 ? (subset[0]?.numbers.length || rules.pick) / rules.totalNumbers : 0;
  const hotThreshold = avgFreq * 100 * 1.15;
  const coldThreshold = avgFreq * 100 * 0.85;

  const hotNumbers = stats.filter(s => s.percentage > hotThreshold).map(s => s.number).slice(0, 10);
  const coldNumbers = stats.filter(s => s.percentage < coldThreshold).map(s => s.number).slice(0, 10);
  const dueNumbers = stats.filter(s => s.cycleScore > 1.2).sort((a, b) => b.cycleScore - a.cycleScore).map(s => s.number).slice(0, 10);

  const sums = subset.map(d => d.numbers.reduce((a, b) => a + b, 0));
  const avgSum = sums.length > 0 ? Math.round(sums.reduce((a, b) => a + b, 0) / sums.length) : 0;

  const evenCounts = subset.map(d => d.numbers.filter(n => n % 2 === 0).length);
  const avgEven = evenCounts.length > 0 ? Math.round(evenCounts.reduce((a, b) => a + b, 0) / evenCounts.length * 10) / 10 : 0;

  // Avg repeat
  let totalRepeat = 0, repeatCount = 0;
  for (let i = 0; i < subset.length - 1; i++) {
    const prevSet = new Set(subset[i + 1].numbers);
    totalRepeat += subset[i].numbers.filter(n => prevSet.has(n)).length;
    repeatCount++;
  }
  const avgRepeat = repeatCount > 0 ? Math.round(totalRepeat / repeatCount * 10) / 10 : 0;

  const patterns: string[] = [];
  const recommendations: string[] = [];

  if (hotNumbers.length > 0) patterns.push(`Números quentes: ${hotNumbers.slice(0, 5).join(", ")}`);
  if (dueNumbers.length > 0) patterns.push(`Números atrasados: ${dueNumbers.slice(0, 5).join(", ")}`);
  patterns.push(`Soma média: ${avgSum} (faixa ideal: ${rules.idealSumRange[0]}-${rules.idealSumRange[1]})`);
  patterns.push(`Pares médio: ${avgEven} (faixa ideal: ${rules.idealParityRange[0]}-${rules.idealParityRange[1]})`);
  patterns.push(`Repetição média do concurso anterior: ${avgRepeat}`);

  // CYCLE ANALYSIS: identify numbers with strong periodic behavior
  const cycleProfiles = computeCycleProfiles(draws, lotteryId, Math.max(window, 150));
  const cycleDue = getCycleDueNumbers(cycleProfiles, 5);
  const accelerating = getAcceleratingNumbers(cycleProfiles, 5);
  if (cycleDue.length > 0) {
    patterns.push(`📈 Números no pico do ciclo (esperados em breve): ${cycleDue.join(", ")}`);
  }
  if (accelerating.length > 0) {
    patterns.push(`🚀 Números com ciclo acelerando: ${accelerating.join(", ")}`);
  }

  // REGRESSION ANALYSIS: identify numbers deviating from expected frequency
  const regressionCandidates = computeRegressionCandidates(draws, stats, lotteryId, window);
  const upwardRegression = getUpwardRegressionNumbers(regressionCandidates, 5);
  const downwardRegression = getDownwardRegressionNumbers(regressionCandidates, 5);
  if (upwardRegression.length > 0) {
    patterns.push(`📊 Regressão à média (subindo): ${upwardRegression.join(", ")}`);
  }
  if (downwardRegression.length > 0) {
    patterns.push(`📉 Sobreperformando (possível queda): ${downwardRegression.join(", ")}`);
  }

  // MULTI-WINDOW REGRESSION: cross-validated signals
  const multiWindow = computeMultiWindowRegression(draws, stats, lotteryId);
  const strongUp = multiWindow.filter(m => m.consensus === "strong_up").map(m => m.number).slice(0, 5);
  if (strongUp.length > 0) {
    patterns.push(`🎯 Consenso forte de regressão (3 janelas concordam): ${strongUp.join(", ")}`);
  }

  // TREND ANALYSIS: momentum signals
  const trends = multiWindowTrend(draws, rules.totalNumbers);
  const ascending = trends.filter(t => t.regime === "ascending" && t.acceleration > 0.02).slice(0, 5);
  const descending = trends.filter(t => t.regime === "descending" && t.acceleration < -0.02).slice(0, 5);
  if (ascending.length > 0) {
    patterns.push(`⬆️ Tendência ascendente com aceleração: ${ascending.map(t => t.number).join(", ")}`);
  }
  if (descending.length > 0) {
    patterns.push(`⬇️ Tendência descendente: ${descending.map(t => t.number).join(", ")}`);
  }

  // Enhanced recommendations
  recommendations.push(`Incluir mix de ${Math.ceil(rules.pick * 0.4)} quentes e ${Math.ceil(rules.pick * 0.25)} frios`);
  recommendations.push(`Manter soma entre ${rules.idealSumRange[0]} e ${rules.idealSumRange[1]}`);
  recommendations.push(`Limitar sequências consecutivas a ${rules.maxRecommendedSequence}`);

  if (cycleDue.length > 0) {
    recommendations.push(`Considerar inclusão dos números cíclicos: ${cycleDue.slice(0, 3).join(", ")}`);
  }
  if (strongUp.length > 0) {
    recommendations.push(`Priorizar números com consenso de regressão: ${strongUp.slice(0, 3).join(", ")}`);
  }
  if (ascending.length > 0) {
    recommendations.push(`Aproveitar momentum ascendente: ${ascending.map(t => t.number).slice(0, 3).join(", ")}`);
  }

  return { window, hotNumbers, coldNumbers, dueNumbers, avgSum, avgEven, avgRepeat, patterns, recommendations };
}
