/**
 * Native AI — Statistics Engine
 * Comprehensive statistical analysis, reusing and extending existing engine
 */

import { DrawResult } from "@/data/lotteries";
import { NumberStats, computeFrequencyStats } from "@/features/statistics/engine";
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

  // CHI-SQUARE TEST: assess randomness deviation
  const chiSquare = computeChiSquare(subset, rules.totalNumbers, rules.pick);
  if (chiSquare.significant) {
    patterns.push(`⚠️ Teste Chi² indica desvio significativo da aleatoriedade (χ²=${chiSquare.value.toFixed(1)}, p<0.05)`);
    recommendations.push("Distribuição não-uniforme detectada — explorar números sub-representados");
  } else {
    patterns.push(`✅ Teste Chi²: distribuição dentro do esperado (χ²=${chiSquare.value.toFixed(1)})`);
  }

  // AUTOCORRELATION: detect lag patterns
  const autocorr = computeAutocorrelation(subset, rules.totalNumbers);
  const significantLags = autocorr.filter(a => Math.abs(a.correlation) > 0.15);
  if (significantLags.length > 0) {
    patterns.push(`🔄 Autocorrelação significativa nos lags: ${significantLags.map(a => `${a.lag}(${a.correlation > 0 ? '+' : ''}${a.correlation.toFixed(2)})`).join(", ")}`);
    recommendations.push(`Considerar padrões cíclicos de período ${significantLags[0].lag} concursos`);
  }

  // GAP DISTRIBUTION ANALYSIS
  const gapAnalysis = analyzeGapDistribution(subset, rules.totalNumbers);
  if (gapAnalysis.overdueNumbers.length > 0) {
    patterns.push(`⏰ Números com atraso extremo (>2σ): ${gapAnalysis.overdueNumbers.slice(0, 5).join(", ")}`);
    recommendations.push(`Forte candidato por atraso estatístico: ${gapAnalysis.overdueNumbers[0]}`);
  }

  return { window, hotNumbers, coldNumbers, dueNumbers, avgSum, avgEven, avgRepeat, patterns, recommendations };
}

// ═══════════════════════════════════════════════════════
// CHI-SQUARE UNIFORMITY TEST
// ═══════════════════════════════════════════════════════

interface ChiSquareResult {
  value: number;
  degreesOfFreedom: number;
  significant: boolean; // p < 0.05
}

function computeChiSquare(draws: DrawResult[], totalNumbers: number, pick: number): ChiSquareResult {
  const observed = new Array(totalNumbers).fill(0);
  for (const d of draws) {
    for (const n of d.numbers) {
      if (n >= 1 && n <= totalNumbers) observed[n - 1]++;
    }
  }
  const totalObs = draws.length * pick;
  const expected = totalObs / totalNumbers;
  
  let chiSq = 0;
  for (let i = 0; i < totalNumbers; i++) {
    chiSq += (observed[i] - expected) ** 2 / expected;
  }
  
  const df = totalNumbers - 1;
  // Approximation: for df > 30, chi-square critical at p=0.05 ≈ df + 1.645*sqrt(2*df)
  const critical = df > 30
    ? df + 1.645 * Math.sqrt(2 * df)
    : df * 1.5; // rough approximation for smaller df

  return { value: chiSq, degreesOfFreedom: df, significant: chiSq > critical };
}

// ═══════════════════════════════════════════════════════
// AUTOCORRELATION ANALYSIS
// ═══════════════════════════════════════════════════════

interface AutocorrelationResult {
  lag: number;
  correlation: number;
}

function computeAutocorrelation(draws: DrawResult[], totalNumbers: number): AutocorrelationResult[] {
  if (draws.length < 20) return [];
  
  const results: AutocorrelationResult[] = [];
  const maxLag = Math.min(10, Math.floor(draws.length / 4));
  
  // Create a time series: sum of each draw
  const series = draws.map(d => d.numbers.reduce((a, b) => a + b, 0));
  const mean = series.reduce((a, b) => a + b, 0) / series.length;
  const variance = series.reduce((s, v) => s + (v - mean) ** 2, 0) / series.length;
  
  if (variance < 1e-6) return [];
  
  for (let lag = 1; lag <= maxLag; lag++) {
    let cov = 0;
    const n = series.length - lag;
    for (let i = 0; i < n; i++) {
      cov += (series[i] - mean) * (series[i + lag] - mean);
    }
    cov /= n;
    results.push({ lag, correlation: cov / variance });
  }
  
  return results;
}

// ═══════════════════════════════════════════════════════
// GAP DISTRIBUTION ANALYSIS
// ═══════════════════════════════════════════════════════

interface GapAnalysis {
  avgGap: number;
  gapStdDev: number;
  overdueNumbers: number[];
  underperformingNumbers: number[];
}

function analyzeGapDistribution(draws: DrawResult[], totalNumbers: number): GapAnalysis {
  if (draws.length < 10) return { avgGap: 0, gapStdDev: 0, overdueNumbers: [], underperformingNumbers: [] };
  
  // For each number, compute current gap (draws since last appearance)
  const currentGaps: Map<number, number> = new Map();
  const allGaps: Map<number, number[]> = new Map();
  
  for (let n = 1; n <= totalNumbers; n++) {
    currentGaps.set(n, draws.length); // default: never appeared
    allGaps.set(n, []);
  }
  
  for (let i = 0; i < draws.length; i++) {
    for (const n of draws[i].numbers) {
      if (!allGaps.has(n)) continue;
      const gaps = allGaps.get(n)!;
      if (gaps.length === 0 && i > 0) {
        currentGaps.set(n, i);
      }
      if (gaps.length > 0 || i > 0) {
        // Track gap from previous appearance
      }
    }
  }
  
  // Simplified: just track last appearance index
  const lastSeen = new Map<number, number>();
  for (let i = draws.length - 1; i >= 0; i--) {
    for (const n of draws[i].numbers) {
      if (!lastSeen.has(n)) lastSeen.set(n, draws.length - 1 - i);
    }
  }
  
  const gaps: number[] = [];
  for (let n = 1; n <= totalNumbers; n++) {
    gaps.push(lastSeen.get(n) ?? draws.length);
  }
  
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const gapStdDev = Math.sqrt(gaps.reduce((s, g) => s + (g - avgGap) ** 2, 0) / gaps.length);
  
  const threshold = avgGap + 2 * gapStdDev;
  const overdueNumbers: number[] = [];
  const underperformingNumbers: number[] = [];
  
  for (let n = 1; n <= totalNumbers; n++) {
    const gap = lastSeen.get(n) ?? draws.length;
    if (gap > threshold) overdueNumbers.push(n);
    if (gap > avgGap + gapStdDev) underperformingNumbers.push(n);
  }
  
  overdueNumbers.sort((a, b) => (lastSeen.get(b) ?? 0) - (lastSeen.get(a) ?? 0));
  
  return { avgGap, gapStdDev, overdueNumbers, underperformingNumbers };
}
