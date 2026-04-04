/**
 * Native AI — Cycle & Periodicity Engine
 * Detects periodic patterns in number appearances to predict
 * which numbers are due based on their historical cycles.
 * PURE OVERLAY — no existing logic modified.
 */

import { DrawResult } from "@/data/lotteries";
import { getLotteryRules } from "../knowledge/lotteriesKnowledge";

// ═══════════════════════════════════════════════════════
// 1. CYCLE DETECTION — Find each number's natural period
// ═══════════════════════════════════════════════════════

export interface NumberCycleProfile {
  number: number;
  avgCycle: number;        // average draws between appearances
  medianCycle: number;     // median gap (more robust than avg)
  stdDevCycle: number;     // consistency of the cycle
  currentGap: number;      // draws since last appearance
  cyclePhase: number;      // 0-1, where 0 = just appeared, 1 = overdue
  dueScore: number;        // 0-100, how "due" this number is
  consistency: number;     // 0-1, how regular the cycle is (low stddev = high)
  lastSeen: number;        // index of most recent appearance
  recentAcceleration: number; // is cycle shortening or lengthening?
}

/** Compute full cycle profile for every number */
export function computeCycleProfiles(
  draws: DrawResult[],
  lotteryId: string,
  window: number = 200
): NumberCycleProfile[] {
  const rules = getLotteryRules(lotteryId);
  const subset = draws.slice(0, Math.min(window, draws.length));
  if (subset.length < 10) return [];

  const profiles: NumberCycleProfile[] = [];

  for (let num = 1; num <= rules.totalNumbers; num++) {
    // Find all appearance indices
    const appearances: number[] = [];
    for (let i = 0; i < subset.length; i++) {
      if (subset[i].numbers.includes(num)) {
        appearances.push(i);
      }
    }

    if (appearances.length < 3) {
      profiles.push({
        number: num, avgCycle: subset.length, medianCycle: subset.length,
        stdDevCycle: 0, currentGap: subset.length, cyclePhase: 1,
        dueScore: 80, consistency: 0, lastSeen: subset.length,
        recentAcceleration: 0,
      });
      continue;
    }

    // Compute gaps between consecutive appearances
    const gaps: number[] = [];
    for (let i = 0; i < appearances.length - 1; i++) {
      gaps.push(appearances[i + 1] - appearances[i]);
    }

    const avgCycle = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const sortedGaps = [...gaps].sort((a, b) => a - b);
    const medianCycle = sortedGaps[Math.floor(sortedGaps.length / 2)];
    const variance = gaps.reduce((s, g) => s + (g - avgCycle) ** 2, 0) / gaps.length;
    const stdDevCycle = Math.sqrt(variance);
    const currentGap = appearances[0]; // distance from draw 0

    // Cycle phase: how far through current cycle
    const cyclePhase = Math.min(2, currentGap / Math.max(1, medianCycle));

    // Consistency: inverse of coefficient of variation
    const cv = stdDevCycle / Math.max(1, avgCycle);
    const consistency = Math.max(0, Math.min(1, 1 - cv));

    // Due score: combines phase and consistency
    // Numbers with consistent cycles that are overdue get highest scores
    const phaseBonus = cyclePhase > 1 ? (cyclePhase - 1) * 40 : cyclePhase * 20;
    const consistencyBonus = consistency * 30;
    const dueScore = Math.min(100, Math.round(phaseBonus + consistencyBonus));

    // Recent acceleration: compare last 3 gaps to overall average
    const recentGaps = gaps.slice(0, Math.min(3, gaps.length));
    const recentAvg = recentGaps.reduce((a, b) => a + b, 0) / recentGaps.length;
    const recentAcceleration = (avgCycle - recentAvg) / Math.max(1, avgCycle);

    profiles.push({
      number: num, avgCycle, medianCycle, stdDevCycle,
      currentGap, cyclePhase, dueScore, consistency,
      lastSeen: appearances[0], recentAcceleration,
    });
  }

  return profiles;
}

// ═══════════════════════════════════════════════════════
// 2. CYCLE-BASED SCORING — Score a game by cycle alignment
// ═══════════════════════════════════════════════════════

/** Score how well a game aligns with cycle predictions */
export function scoreByCycleAlignment(
  game: number[],
  profiles: NumberCycleProfile[]
): number {
  if (profiles.length === 0) return 50;

  const profileMap = new Map(profiles.map(p => [p.number, p]));
  let totalScore = 0;
  let totalWeight = 0;

  for (const n of game) {
    const p = profileMap.get(n);
    if (!p) continue;

    // Weight by consistency: trust regular cycles more
    const weight = 0.5 + p.consistency * 0.5;
    totalScore += p.dueScore * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
}

// ═══════════════════════════════════════════════════════
// 3. CYCLE-INFORMED NUMBER RANKING
// ═══════════════════════════════════════════════════════

/** Get top N numbers ranked by cycle-due analysis */
export function getCycleDueNumbers(
  profiles: NumberCycleProfile[],
  topN: number = 10
): number[] {
  return [...profiles]
    .sort((a, b) => b.dueScore - a.dueScore)
    .slice(0, topN)
    .map(p => p.number);
}

/** Get numbers with accelerating (shortening) cycles */
export function getAcceleratingNumbers(
  profiles: NumberCycleProfile[],
  topN: number = 8
): number[] {
  return [...profiles]
    .filter(p => p.recentAcceleration > 0.1 && p.consistency > 0.3)
    .sort((a, b) => b.recentAcceleration - a.recentAcceleration)
    .slice(0, topN)
    .map(p => p.number);
}

// ═══════════════════════════════════════════════════════
// 4. HARMONIC CYCLE DETECTION — Multi-period patterns
// ═══════════════════════════════════════════════════════

export interface HarmonicPattern {
  number: number;
  dominantPeriod: number;
  harmonicStrength: number; // 0-1, how strong the periodic signal is
  nextPredictedDraw: number; // estimated draws until next appearance
}

/** Detect dominant periodicity using autocorrelation approximation */
export function detectHarmonicPatterns(
  draws: DrawResult[],
  lotteryId: string,
  maxPeriod: number = 30
): HarmonicPattern[] {
  const rules = getLotteryRules(lotteryId);
  const subset = draws.slice(0, Math.min(200, draws.length));
  if (subset.length < maxPeriod * 2) return [];

  const patterns: HarmonicPattern[] = [];

  for (let num = 1; num <= rules.totalNumbers; num++) {
    const presence = subset.map(d => d.numbers.includes(num) ? 1 : 0);

    let bestPeriod = 0;
    let bestCorr = 0;

    for (let period = 2; period <= maxPeriod; period++) {
      let corr = 0;
      let count = 0;
      for (let i = 0; i + period < presence.length; i++) {
        corr += presence[i] * presence[i + period];
        count++;
      }
      const normalizedCorr = count > 0 ? corr / count : 0;
      if (normalizedCorr > bestCorr) {
        bestCorr = normalizedCorr;
        bestPeriod = period;
      }
    }

    const baseRate = presence.reduce((a, b) => a + b, 0) / presence.length;
    const expectedCorr = baseRate * baseRate;
    const harmonicStrength = expectedCorr > 0
      ? Math.min(1, Math.max(0, (bestCorr - expectedCorr) / Math.max(0.01, expectedCorr)))
      : 0;

    if (harmonicStrength > 0.1 && bestPeriod > 0) {
      const lastIdx = presence.indexOf(1);
      const nextPredicted = Math.max(0, bestPeriod - lastIdx);

      patterns.push({
        number: num,
        dominantPeriod: bestPeriod,
        harmonicStrength,
        nextPredictedDraw: nextPredicted,
      });
    }
  }

  return patterns.sort((a, b) => b.harmonicStrength - a.harmonicStrength);
}

// ═══════════════════════════════════════════════════════
// 5. BAYESIAN CYCLE PREDICTION — Posterior probability of appearance
// ═══════════════════════════════════════════════════════

export interface BayesianPrediction {
  number: number;
  priorProbability: number;       // base rate
  posteriorProbability: number;   // adjusted by cycle evidence
  likelihoodRatio: number;        // how much cycle info shifts the prior
  confidenceInterval: [number, number]; // 90% CI for next appearance gap
}

/** Use Bayesian updating to estimate next-draw appearance probability */
export function computeBayesianPredictions(
  profiles: NumberCycleProfile[],
  draws: DrawResult[],
  lotteryId: string
): BayesianPrediction[] {
  const rules = getLotteryRules(lotteryId);
  const subset = draws.slice(0, Math.min(200, draws.length));
  if (subset.length < 20 || profiles.length === 0) return [];

  const predictions: BayesianPrediction[] = [];

  for (const p of profiles) {
    // Prior: base appearance rate = pick/totalNumbers
    const prior = rules.pick / rules.totalNumbers;

    // Likelihood: how likely is this gap length given the number's cycle?
    // Model as exponential distribution with rate = 1/avgCycle
    const rate = 1 / Math.max(1, p.avgCycle);
    // P(gap >= currentGap | cycle) using survival function
    const survivalProb = Math.exp(-rate * p.currentGap);
    // Hazard rate: conditional probability of appearing NOW given survived this long
    const hazardRate = rate; // constant for exponential

    // Likelihood ratio: how much more likely to appear now vs baseline
    const cyclePhaseFactor = p.cyclePhase > 1
      ? 1 + (p.cyclePhase - 1) * p.consistency * 2
      : 0.5 + p.cyclePhase * 0.5;

    // Posterior using simplified Bayes
    const likelihoodRatio = cyclePhaseFactor * (1 + p.recentAcceleration);
    const unnormalized = prior * likelihoodRatio;
    const posterior = Math.min(0.95, Math.max(0.01, unnormalized));

    // Confidence interval: based on stdDev of gaps
    const lowerGap = Math.max(0, Math.round(p.avgCycle - 1.645 * p.stdDevCycle));
    const upperGap = Math.round(p.avgCycle + 1.645 * p.stdDevCycle);
    const remainingLower = Math.max(0, lowerGap - p.currentGap);
    const remainingUpper = Math.max(0, upperGap - p.currentGap);

    predictions.push({
      number: p.number,
      priorProbability: prior,
      posteriorProbability: posterior,
      likelihoodRatio,
      confidenceInterval: [remainingLower, remainingUpper],
    });
  }

  return predictions.sort((a, b) => b.posteriorProbability - a.posteriorProbability);
}

// ═══════════════════════════════════════════════════════
// 6. MULTI-SCALE CYCLE ANALYSIS — Short/Medium/Long term
// ═══════════════════════════════════════════════════════

export interface MultiScaleCycleSignal {
  number: number;
  shortTermDue: number;   // 0-100 based on last 30 draws
  mediumTermDue: number;  // 0-100 based on last 80 draws
  longTermDue: number;    // 0-100 based on last 200 draws
  consensus: "strong_due" | "moderate_due" | "mixed" | "not_due";
  compositeScore: number; // 0-100 weighted blend
}

/** Analyze cycle due-ness across multiple time horizons */
export function multiScaleCycleAnalysis(
  draws: DrawResult[],
  lotteryId: string
): MultiScaleCycleSignal[] {
  const windows = [30, 80, 200];
  const profilesByWindow = windows.map(w => computeCycleProfiles(draws, lotteryId, w));

  if (profilesByWindow[0].length === 0) return [];

  const rules = getLotteryRules(lotteryId);
  const signals: MultiScaleCycleSignal[] = [];

  for (let num = 1; num <= rules.totalNumbers; num++) {
    const short = profilesByWindow[0].find(p => p.number === num);
    const medium = profilesByWindow[1].find(p => p.number === num);
    const long = profilesByWindow[2].find(p => p.number === num);

    const shortDue = short?.dueScore ?? 50;
    const mediumDue = medium?.dueScore ?? 50;
    const longDue = long?.dueScore ?? 50;

    // Consensus
    const allHigh = shortDue >= 65 && mediumDue >= 60 && longDue >= 55;
    const mostHigh = (shortDue >= 65 ? 1 : 0) + (mediumDue >= 60 ? 1 : 0) + (longDue >= 55 ? 1 : 0);
    const allLow = shortDue < 40 && mediumDue < 40 && longDue < 40;

    const consensus: MultiScaleCycleSignal["consensus"] =
      allHigh ? "strong_due" :
      mostHigh >= 2 ? "moderate_due" :
      allLow ? "not_due" : "mixed";

    // Weighted composite: short-term matters most
    const compositeScore = Math.round(shortDue * 0.5 + mediumDue * 0.3 + longDue * 0.2);

    signals.push({
      number: num,
      shortTermDue: shortDue,
      mediumTermDue: mediumDue,
      longTermDue: longDue,
      consensus,
      compositeScore,
    });
  }

  return signals.sort((a, b) => b.compositeScore - a.compositeScore);
}

/** Score a game using multi-scale cycle consensus */
export function scoreByMultiScaleCycles(
  game: number[],
  signals: MultiScaleCycleSignal[]
): number {
  if (signals.length === 0) return 50;

  const signalMap = new Map(signals.map(s => [s.number, s]));
  let totalScore = 0;
  let count = 0;

  for (const n of game) {
    const s = signalMap.get(n);
    if (!s) continue;

    // Bonus for consensus
    const consensusMultiplier =
      s.consensus === "strong_due" ? 1.3 :
      s.consensus === "moderate_due" ? 1.1 :
      s.consensus === "not_due" ? 0.7 : 1.0;

    totalScore += s.compositeScore * consensusMultiplier;
    count++;
  }

  return count > 0 ? Math.min(100, Math.round(totalScore / count)) : 50;
}
