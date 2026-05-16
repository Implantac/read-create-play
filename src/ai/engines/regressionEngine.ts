/**
 * Native AI — Regression to Mean Engine
 * Detects numbers deviating from expected frequency and predicts
 * regression candidates for smarter number selection.
 * PURE OVERLAY — no existing logic modified.
 */

import { DrawResult } from "@/data/lotteries";
import { NumberStats } from "@/features/statistics/engine";
import { getLotteryRules } from "../knowledge/lotteriesKnowledge";

// ═══════════════════════════════════════════════════════
// 1. DEVIATION ANALYSIS — Z-Score based
// ═══════════════════════════════════════════════════════

export interface RegressionCandidate {
  number: number;
  observedFreq: number;      // actual frequency in window
  expectedFreq: number;      // theoretical expected frequency
  zScore: number;            // standard deviations from expected
  deviation: string;         // "over" | "under" | "normal"
  regressionProbability: number; // 0-1, likelihood of reverting
  regressionDirection: "up" | "down" | "stable";
  confidence: number;        // 0-1, based on sample size
}

/** Compute regression candidates from frequency deviation */
export function computeRegressionCandidates(
  draws: DrawResult[],
  stats: NumberStats[],
  lotteryId: string,
  window: number = 100
): RegressionCandidate[] {
  const rules = getLotteryRules(lotteryId);
  const subset = draws.slice(0, Math.min(window, draws.length));
  if (subset.length < 20) return [];

  const n = subset.length;
  const pick = rules.pick;
  const total = rules.totalNumbers;

  // Expected frequency: each number should appear pick/total of the time
  const expectedRate = pick / total;
  const expectedCount = expectedRate * n;

  // Standard deviation for binomial distribution
  const stdDev = Math.sqrt(n * expectedRate * (1 - expectedRate));

  const candidates: RegressionCandidate[] = [];

  for (const s of stats) {
    // Count actual appearances in window
    let observed = 0;
    for (const d of subset) {
      if (d.numbers.includes(s.number)) observed++;
    }

    const zScore = stdDev > 0 ? (observed - expectedCount) / stdDev : 0;
    const absZ = Math.abs(zScore);

    const deviation: RegressionCandidate["deviation"] =
      zScore > 1.5 ? "over" : zScore < -1.5 ? "under" : "normal";

    // Regression probability increases with deviation magnitude
    // Based on statistical mean reversion principle
    const regressionProbability = absZ > 1
      ? Math.min(0.95, 0.3 + (absZ - 1) * 0.25)
      : absZ * 0.3;

    const regressionDirection: RegressionCandidate["regressionDirection"] =
      zScore > 1.5 ? "down" : zScore < -1.5 ? "up" : "stable";

    // Confidence increases with sample size
    const confidence = Math.min(1, n / 80);

    candidates.push({
      number: s.number,
      observedFreq: observed,
      expectedFreq: expectedCount,
      zScore,
      deviation,
      regressionProbability,
      regressionDirection,
      confidence,
    });
  }

  return candidates;
}

// ═══════════════════════════════════════════════════════
// 2. REGRESSION-FAVORED NUMBERS
// ═══════════════════════════════════════════════════════

/** Get numbers likely to regress upward (currently underperforming) */
export function getUpwardRegressionNumbers(
  candidates: RegressionCandidate[],
  topN: number = 10
): number[] {
  return candidates
    .filter(c => c.regressionDirection === "up" && c.confidence > 0.3)
    .sort((a, b) => b.regressionProbability - a.regressionProbability)
    .slice(0, topN)
    .map(c => c.number);
}

/** Get numbers likely to regress downward (currently overperforming) */
export function getDownwardRegressionNumbers(
  candidates: RegressionCandidate[],
  topN: number = 10
): number[] {
  return candidates
    .filter(c => c.regressionDirection === "down" && c.confidence > 0.3)
    .sort((a, b) => b.regressionProbability - a.regressionProbability)
    .slice(0, topN)
    .map(c => c.number);
}

// ═══════════════════════════════════════════════════════
// 3. REGRESSION-BASED GAME SCORING
// ═══════════════════════════════════════════════════════

/** Score a game based on regression analysis */
export function scoreByRegression(
  game: number[],
  candidates: RegressionCandidate[],
  strategy: "balanced" | "contrarian" | "momentum" = "balanced"
): number {
  if (candidates.length === 0) return 50;

  const candidateMap = new Map(candidates.map(c => [c.number, c]));
  let score = 0;
  let count = 0;

  for (const n of game) {
    const c = candidateMap.get(n);
    if (!c) continue;
    count++;

    switch (strategy) {
      case "contrarian":
        // Favor underperforming numbers (bet on regression up)
        if (c.regressionDirection === "up") {
          score += c.regressionProbability * c.confidence * 100;
        } else if (c.regressionDirection === "down") {
          score -= c.regressionProbability * c.confidence * 30;
        } else {
          score += 40;
        }
        break;

      case "momentum":
        // Favor overperforming numbers (ride the trend)
        if (c.regressionDirection === "down") {
          // Currently hot — ride until regression
          score += (1 - c.regressionProbability) * 80;
        } else if (c.regressionDirection === "up") {
          score += 30;
        } else {
          score += 50;
        }
        break;

      case "balanced":
      default:
        // Prefer numbers near their mean (stable)
        if (c.deviation === "normal") {
          score += 60;
        } else {
          // Slight bonus for regression candidates
          score += 40 + c.regressionProbability * 20;
        }
        break;
    }
  }

  return count > 0 ? Math.round(Math.min(100, Math.max(0, score / count))) : 50;
}

// ═══════════════════════════════════════════════════════
// 4. MULTI-WINDOW REGRESSION — Cross-validate across timeframes
// ═══════════════════════════════════════════════════════

export interface MultiWindowRegression {
  number: number;
  shortTermZ: number;  // 30 draws
  midTermZ: number;    // 80 draws
  longTermZ: number;   // 150+ draws
  consensus: "strong_up" | "up" | "neutral" | "down" | "strong_down";
  consensusStrength: number; // 0-1
  trendAcceleration: number; // positive = accelerating upward
}

/** Cross-validate regression signals across multiple timeframes */
export function computeMultiWindowRegression(
  draws: DrawResult[],
  stats: NumberStats[],
  lotteryId: string
): MultiWindowRegression[] {
  const short = computeRegressionCandidates(draws, stats, lotteryId, 30);
  const mid = computeRegressionCandidates(draws, stats, lotteryId, 80);
  const long = computeRegressionCandidates(draws, stats, lotteryId, 150);

  if (short.length === 0) return [];

  const midMap = new Map(mid.map(c => [c.number, c]));
  const longMap = new Map(long.map(c => [c.number, c]));

  const results: MultiWindowRegression[] = [];

  for (const s of short) {
    const m = midMap.get(s.number);
    const l = longMap.get(s.number);

    const shortZ = s.zScore;
    const midZ = m?.zScore ?? 0;
    const longZ = l?.zScore ?? 0;

    // Trend acceleration: is the z-score changing faster in short term?
    const trendAcceleration = (shortZ - midZ) * 0.6 + (midZ - longZ) * 0.4;

    // Count how many windows agree on direction
    const upSignals = [shortZ < -1.5, midZ < -1.5, longZ < -1.5].filter(Boolean).length;
    const downSignals = [shortZ > 1.5, midZ > 1.5, longZ > 1.5].filter(Boolean).length;

    // Enhanced consensus with acceleration factor
    let consensus: MultiWindowRegression["consensus"];
    let consensusStrength: number;

    if (upSignals >= 3) {
      consensus = "strong_up";
      consensusStrength = Math.min(1, 0.85 + Math.abs(trendAcceleration) * 0.1);
    } else if (upSignals >= 2) {
      consensus = "up";
      consensusStrength = 0.55 + Math.abs(trendAcceleration) * 0.1;
    } else if (downSignals >= 3) {
      consensus = "strong_down";
      consensusStrength = Math.min(1, 0.85 + Math.abs(trendAcceleration) * 0.1);
    } else if (downSignals >= 2) {
      consensus = "down";
      consensusStrength = 0.55 + Math.abs(trendAcceleration) * 0.1;
    } else {
      consensus = "neutral";
      consensusStrength = 0.3;
    }

    results.push({
      number: s.number,
      shortTermZ: shortZ,
      midTermZ: midZ,
      longTermZ: longZ,
      consensus,
      consensusStrength,
      trendAcceleration,
    });
  }

  return results;
}

// ═══════════════════════════════════════════════════════
// 5. EXPONENTIAL SMOOTHING (Holt-Winters inspired)
// ═══════════════════════════════════════════════════════

export interface SmoothedTrend {
  number: number;
  level: number;        // smoothed frequency level
  trend: number;        // trend component (rising/falling)
  forecast: number;     // predicted next-period frequency
  forecastConfidence: number; // 0-1
}

/** Holt-Winters double exponential smoothing for frequency forecasting */
export function computeSmoothedTrends(
  draws: DrawResult[],
  lotteryId: string,
  alpha: number = 0.3,
  beta: number = 0.15
): SmoothedTrend[] {
  const rules = getLotteryRules(lotteryId);
  const windowSize = 10; // group draws into windows of 10
  const totalWindows = Math.floor(Math.min(draws.length, 200) / windowSize);

  if (totalWindows < 3) return [];

  const results: SmoothedTrend[] = [];

  for (let num = 1; num <= rules.totalNumbers; num++) {
    // Build frequency time series (most recent first → reverse for chronological)
    const freqSeries: number[] = [];
    for (let w = totalWindows - 1; w >= 0; w--) {
      const windowDraws = draws.slice(w * windowSize, (w + 1) * windowSize);
      const count = windowDraws.filter(d => d.numbers.includes(num)).length;
      freqSeries.push(count / windowSize);
    }

    if (freqSeries.length < 3) continue;

    // Initialize Holt-Winters
    let level = freqSeries[0];
    let trend = freqSeries[1] - freqSeries[0];

    // Apply smoothing
    for (let t = 1; t < freqSeries.length; t++) {
      const prevLevel = level;
      level = alpha * freqSeries[t] + (1 - alpha) * (prevLevel + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    const forecast = level + trend;

    // Confidence based on how well the model fits recent data
    const lastActual = freqSeries[freqSeries.length - 1];
    const fitError = Math.abs(level - lastActual);
    const forecastConfidence = Math.max(0, Math.min(1, 1 - fitError * 3));

    results.push({ number: num, level, trend, forecast, forecastConfidence });
  }

  return results;
}
