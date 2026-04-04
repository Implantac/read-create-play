/**
 * Native AI — Ranking Engine
 * Multi-dimensional scoring for lottery games
 */

import { NumberStats } from "@/engine/statistics";
import { DrawResult } from "@/data/lotteries";
import { computePatternProfile } from "./patternEngine";
import { getLotteryRules } from "../knowledge/lotteriesKnowledge";
import { AI_CONFIG } from "../core/aiConfig";
import { computeSpecialNumberScore, computeHistoricalHitRate, computeClusterScore, computeHumanPatternPenalty, lightMonteCarlo, computeCoOccurrence } from "./advancedAnalysisEngine";
import { estimateROI, detectContext, selfCalibrateWeights, applyContextAdjustments, extractWinningPatterns, scoreAgainstWinningPatterns, getAdaptiveSimCount, optimizeWeightsFromHistory, recordPerformance, evaluatePortfolio, optimizePortfolio } from "./adaptiveEngine";
import { smoothWeights, computeProgressivePenalty, computeCoOccurrenceBonus, computeAntiPairPenalty } from "./stabilityEngine";
import { computeEntropyReport, computeConsecutiveEntropy, computeEdgeInteriorBalance } from "./entropyEngine";
import { computeCycleProfiles, scoreByCycleAlignment } from "./cycleEngine";
import { computeRegressionCandidates, scoreByRegression, computeMultiWindowRegression, computeSmoothedTrends } from "./regressionEngine";
import { computeRecencyWeightedFrequency } from "./probabilityEngine";
import type { ScoredGame, GameScores, RiskProfile } from "../core/aiTypes";

export function scoreGame(
  numbers: number[],
  lotteryId: string,
  stats: NumberStats[],
  draws: DrawResult[],
  riskProfile: RiskProfile = "balanced"
): ScoredGame {
  const rules = getLotteryRules(lotteryId);
  const sorted = [...numbers].sort((a, b) => a - b);
  const prevDraw = draws.length > 0 ? draws[0].numbers : undefined;
  const pattern = computePatternProfile(sorted, lotteryId, prevDraw);
  const riskConfig = AI_CONFIG.riskProfiles[riskProfile];

  // ADAPTIVE: Self-calibrate weights from historical patterns
  const adaptiveW = selfCalibrateWeights(draws, lotteryId);
  const context = detectContext(draws, lotteryId);
  let contextW = applyContextAdjustments(adaptiveW, context, riskProfile);

  // STABILITY: Smooth weights with EMA to prevent erratic changes
  contextW = smoothWeights(contextW, lotteryId, riskProfile);

  // SELF-LEARNING: Apply weight optimizations from performance history
  const learned = optimizeWeightsFromHistory(lotteryId, riskProfile);
  if (learned.confidence > 0.3) {
    for (const [key, mult] of Object.entries(learned.adjustments)) {
      if (key in contextW) {
        (contextW as any)[key] *= mult as number;
      }
    }
  }

  // WINNING PATTERNS: Extract and score against real historical patterns
  const winningPatterns = extractWinningPatterns(draws, lotteryId);

  // Statistical score: based on frequency alignment
  const selectedStats = sorted.map(n => stats.find(s => s.number === n)).filter(Boolean) as NumberStats[];
  const hotCount = selectedStats.filter(s => s.status === "hot").length;
  const coldCount = selectedStats.filter(s => s.status === "cold").length;
  const idealHot = Math.round(rules.pick * riskConfig.hotBias);
  const idealCold = Math.round(rules.pick * riskConfig.coldBias);
  const statScore = Math.max(0, 100 - Math.abs(hotCount - idealHot) * 8 - Math.abs(coldCount - idealCold) * 5);

  // Structural score: pattern profile (weighted by adaptive calibration)
  const structScore = Math.round(
    pattern.overallScore * 100 * 0.7 +
    pattern.parityBalance * contextW.parityWeight * 10 +
    pattern.sumProximity * contextW.sumWeight * 10 +
    pattern.dispersalScore * contextW.dispersalWeight * 10
  );

  // Coverage score: backtesting with advanced hit rate analysis
  const hitRate = computeHistoricalHitRate(sorted, draws, lotteryId);
  const expectedHits = rules.pick * sorted.length / rules.totalNumbers;
  const coverageScore = Math.min(100, Math.round((hitRate.avgHits / expectedHits) * 100));

  // Win rate bonus — games that historically hit prize tiers
  const winRateBonus = Math.round(hitRate.winRate * 50);

  // Diversity score: how different from average
  const avgFreq = selectedStats.reduce((s, st) => s + st.frequency, 0) / selectedStats.length;
  const freqVariance = selectedStats.reduce((s, st) => s + (st.frequency - avgFreq) ** 2, 0) / selectedStats.length;
  const diversityScore = Math.min(100, Math.round(Math.sqrt(freqVariance) * riskConfig.diversityWeight * 5));

  // Special numbers score (primes/fibonacci alignment)
  const specialScore = computeSpecialNumberScore(sorted).specialScore;

  // Cluster concentration score
  const clusterScore = computeClusterScore(sorted, rules.totalNumbers);

  // Human pattern penalty (dates, arithmetic, visual lines) — PROGRESSIVE
  const progressivePenalty = computeProgressivePenalty(sorted, rules.totalNumbers);
  const humanPenalty = progressivePenalty.totalPenalty;

  // CO-OCCURRENCE: reward historically co-occurring pairs
  const coOcc = computeCoOccurrence(draws, rules.totalNumbers, 30);
  const coOccBonus = computeCoOccurrenceBonus(sorted, coOcc.topPairs);
  const antiPairPenalty = computeAntiPairPenalty(sorted, coOcc.antiPairs, draws.length);

  // ENTROPY: information-theoretic quality assessment
  const entropyReport = computeEntropyReport(sorted, rules.totalNumbers);
  const entropyBonus = Math.round((entropyReport.compositeScore - 50) * 0.3);

  // CYCLE ALIGNMENT: how well numbers align with their natural cycles
  const cycleProfiles = computeCycleProfiles(draws, lotteryId, 150);
  const cycleScore = scoreByCycleAlignment(sorted, cycleProfiles);
  const cycleBonus = Math.round((cycleScore - 50) * 0.2);

  // REGRESSION: favor numbers regressing toward the mean
  const regressionCandidates = computeRegressionCandidates(draws, stats, lotteryId, 80);
  const regressionStrategy = riskProfile === "momentum" ? "momentum" 
    : riskProfile === "regression" ? "contrarian" : "balanced";
  const regressionScore = scoreByRegression(sorted, regressionCandidates, regressionStrategy);
  const regressionBonus = Math.round((regressionScore - 50) * 0.15);

  // ADAPTIVE Monte Carlo — variable depth based on context
  const adaptiveSimCount = getAdaptiveSimCount(context, riskProfile, draws.length);
  const monteCarlo = lightMonteCarlo(sorted, draws, adaptiveSimCount);
  const monteCarloBonus = Math.round(
    monteCarlo.consistency * 30 + monteCarlo.prizeRate * 20
  );

  // ADAPTIVE: ROI estimation
  const roi = estimateROI(sorted, draws, lotteryId);
  const roiBonus = Math.round(roi.riskAdjustedScore * 15);

  // WINNING PATTERNS: Score against real historical winning patterns
  const winPatternScore = scoreAgainstWinningPatterns(sorted, winningPatterns, lotteryId);
  const winPatternBonus = Math.round((winPatternScore - 50) * 0.2); // centered around 50

  // Strategy fit with adaptive cluster/context awareness
  const strategyFit = Math.round(
    (pattern.parityBalance * contextW.parityWeight * 8 +
    pattern.sumProximity * contextW.sumWeight * 8 +
    pattern.sequencePenalty * riskConfig.sequencePenalty * 10 +
    pattern.dispersalScore * contextW.dispersalWeight * 7 +
    pattern.rowBalance * 7 +
    pattern.colBalance * 7 +
    (statScore / 100) * contextW.frequencyWeight * 10 +
    (clusterScore / 100) * contextW.clusterWeight * 8 +
    pattern.repeatScore * contextW.repeatWeight * 5)
  );

  // Probability score incorporating zone balance, entropy and co-occurrence
  const probScore = Math.round(
    (pattern.sumProximity * 18 + 
     pattern.parityBalance * 18 + 
     pattern.dispersalScore * 18 + 
     pattern.repeatScore * 10 +
     (specialScore / 100) * 8 +
     (clusterScore / 100) * 10 +
     (entropyReport.compositeScore / 100) * 10 +
     (cycleScore / 100) * 8)
  );

  const w = AI_CONFIG.scoringWeights;
  const rawScore = Math.round(
    statScore * w.statistical +
    structScore * w.structural +
    (coverageScore + winRateBonus) * w.coverage +
    diversityScore * w.diversity +
    strategyFit * w.strategyFit +
    probScore * w.probability
  );

  // Apply all overlays: Monte Carlo + ROI + winning patterns + entropy + cycle + regression + co-occurrence - penalties
  const totalScore = Math.max(0, Math.min(100,
    rawScore
    + monteCarloBonus * 0.12
    + roiBonus * 0.10
    + winPatternBonus * 0.10
    + entropyBonus * 0.08
    + cycleBonus * 0.08
    + regressionBonus * 0.07
    + coOccBonus * 0.07
    - humanPenalty * 0.35
    - antiPairPenalty * 0.12
  ));

  const grade = totalScore >= 85 ? "S" : totalScore >= 70 ? "A" : totalScore >= 55 ? "B" :
    totalScore >= 40 ? "C" : totalScore >= 25 ? "D" : "F";

  const explanation = buildExplanation(sorted, lotteryId, pattern, { statistical: statScore, structural: structScore, coverage: coverageScore, diversity: diversityScore, strategyFit, probability: probScore }, totalScore, grade, clusterScore, humanPenalty, monteCarlo, roi, context, entropyReport, cycleScore, regressionScore);

  return {
    numbers: sorted,
    scores: { statistical: statScore, structural: structScore, coverage: coverageScore, diversity: diversityScore, strategyFit, probability: probScore },
    totalScore: Math.round(totalScore),
    grade,
    explanation,
    roiTier: roi.roiTier,
    roiScore: Math.round(roi.riskAdjustedScore * 100),
  };
}

function buildExplanation(
  numbers: number[],
  lotteryId: string,
  pattern: ReturnType<typeof computePatternProfile>,
  scores: GameScores,
  total: number,
  grade: string,
  clusterScore?: number,
  humanPenalty?: number,
  monteCarlo?: { avgHits: number; consistency: number; prizeRate: number },
  roi?: { expectedPrizeRate: number; consistencyScore: number; riskAdjustedScore: number; roiTier: string },
  context?: { recentSumTrend: string; volatilityIndex: number; regimeStability: number },
  entropyReport?: { compositeScore: number; zoneEntropy: number; gapEntropy: number; dispersionIndex: number; quadrantBalance: number },
  cycleScore?: number,
  regressionScore?: number
): string[] {
  const lines: string[] = [];
  lines.push(`Score geral: ${total}/100 (${grade})`);

  if (scores.statistical >= 70) lines.push("✅ Boa aderência ao perfil de frequência selecionado");
  else lines.push("⚠️ Frequência dos números diverge do perfil ideal");

  if (pattern.parityBalance >= 0.8) lines.push("✅ Equilíbrio par/ímpar dentro da faixa ideal");
  else lines.push("⚠️ Distribuição par/ímpar fora da faixa histórica");

  if (pattern.sumProximity >= 0.8) lines.push("✅ Soma dentro da faixa histórica");
  else lines.push("⚠️ Soma distante da média histórica");

  if (pattern.sequencePenalty >= 0.8) lines.push("✅ Sem sequências longas");
  else lines.push("⚠️ Sequências consecutivas acima do recomendado");

  if (pattern.dispersalScore >= 0.7) lines.push("✅ Boa dispersão numérica");
  else lines.push("⚠️ Números concentrados em uma faixa");

  if (pattern.rowBalance >= 0.7) lines.push("✅ Distribuição equilibrada entre linhas");
  if (pattern.colBalance >= 0.7) lines.push("✅ Distribuição equilibrada entre colunas");

  if (pattern.repeatScore >= 0.8) lines.push("✅ Repetições do concurso anterior dentro da média");
  else if (pattern.repeatScore < 0.5) lines.push("⚠️ Repetições fora do padrão histórico");

  if (lotteryId === "lotofacil" && pattern.frameCenterBalance >= 0.8)
    lines.push("✅ Equilíbrio moldura/centro adequado");

  if (scores.coverage >= 70) lines.push("✅ Boa performance no backtesting histórico");
  else lines.push("⚠️ Performance abaixo da média no backtesting");

  if (clusterScore !== undefined) {
    if (clusterScore >= 70) lines.push("✅ Boa distribuição entre faixas numéricas");
    else lines.push("⚠️ Números concentrados em poucas faixas");
  }
  if (humanPenalty !== undefined && humanPenalty > 10) {
    lines.push("⚠️ Padrão comum detectado (datas/sequências aritméticas)");
  }

  // ENTROPY insights
  if (entropyReport) {
    if (entropyReport.compositeScore >= 70) {
      lines.push(`✅ Entropia informacional alta: ${entropyReport.compositeScore}/100 — excelente distribuição`);
    } else if (entropyReport.compositeScore >= 45) {
      lines.push(`📊 Entropia moderada: ${entropyReport.compositeScore}/100`);
    } else {
      lines.push(`⚠️ Entropia baixa: ${entropyReport.compositeScore}/100 — números mal distribuídos`);
    }
    if (entropyReport.quadrantBalance < 0.5) {
      lines.push("⚠️ Desequilíbrio entre quadrantes do volante");
    }
  }

  // CYCLE insights
  if (cycleScore !== undefined) {
    if (cycleScore >= 65) lines.push(`✅ Alinhamento cíclico forte: ${cycleScore}/100 — números no momento certo do ciclo`);
    else if (cycleScore >= 45) lines.push(`📊 Alinhamento cíclico moderado: ${cycleScore}/100`);
    else lines.push(`⚠️ Alinhamento cíclico fraco: ${cycleScore}/100 — números fora da janela ideal`);
  }

  // REGRESSION insights
  if (regressionScore !== undefined) {
    if (regressionScore >= 65) lines.push(`✅ Regressão à média favorável: ${regressionScore}/100`);
    else if (regressionScore < 40) lines.push(`⚠️ Números com desvio estatístico significativo da média`);
  }

  if (monteCarlo) {
    if (monteCarlo.consistency >= 0.6) lines.push(`✅ Consistência Monte Carlo: ${Math.round(monteCarlo.consistency * 100)}%`);
    if (monteCarlo.prizeRate >= 0.3) lines.push(`✅ Taxa de premiação simulada: ${Math.round(monteCarlo.prizeRate * 100)}%`);
  }

  // ADAPTIVE: ROI and context explanations
  if (roi) {
    const tierLabels: Record<string, string> = { excellent: "Excelente", good: "Bom", average: "Médio", below_average: "Abaixo da média" };
    lines.push(`📊 ROI estimado: ${tierLabels[roi.roiTier] || roi.roiTier} (consistência ${Math.round(roi.consistencyScore * 100)}%)`);
  }
  if (context) {
    if (context.volatilityIndex > 0.6) lines.push("⚡ Volatilidade alta detectada — pesos adaptativos ajustados");
    if (context.regimeStability < 0.4) lines.push("🔄 Regime instável — tendências com menor peso");
  }

  return lines;
}

/** Rank multiple games and return sorted by score */
export function rankGames(
  games: number[][],
  lotteryId: string,
  stats: NumberStats[],
  draws: DrawResult[],
  riskProfile: RiskProfile = "balanced"
): ScoredGame[] {
  const rules = getLotteryRules(lotteryId);

  // Score all games
  const scored = games.map(g => scoreGame(g, lotteryId, stats, draws, riskProfile));
  scored.sort((a, b) => b.totalScore - a.totalScore);

  // PORTFOLIO OPTIMIZATION: if many games, diversify the selection
  if (scored.length > 3) {
    const candidates = scored.map(s => ({ numbers: s.numbers, score: s.totalScore }));
    const optimized = optimizePortfolio(candidates, scored.length, rules.totalNumbers, rules.pick);
    const optimizedSet = new Set(optimized.map(o => o.join(",")));

    // Re-order: optimized games first, rest after
    const primary = scored.filter(s => optimizedSet.has(s.numbers.join(",")));
    const secondary = scored.filter(s => !optimizedSet.has(s.numbers.join(",")));
    const result = [...primary, ...secondary];

    // SELF-LEARNING: Record performance for future optimization
    const avgScore = result.reduce((s, g) => s + g.totalScore, 0) / result.length;
    const roi = estimateROI(result[0].numbers, draws, lotteryId);
    const portfolio = evaluatePortfolio(result.map(r => r.numbers), rules.totalNumbers);
    recordPerformance(lotteryId, riskProfile, avgScore, roi.riskAdjustedScore, portfolio.diversityScore);

    return result;
  }

  return scored;
}
