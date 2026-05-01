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
import { smoothWeights, computeProgressivePenalty, computeCoOccurrenceBonus, computeAntiPairPenalty, detectRegimeChange, computeHistoricalNorms, checkGameOutlier } from "./stabilityEngine";
import { computeEntropyReport, computeConsecutiveEntropy, computeEdgeInteriorBalance, computeEnhancedEntropyReport, computeJointEntropy } from "./entropyEngine";
import { computeCycleProfiles, scoreByCycleAlignment, multiScaleCycleAnalysis, scoreByMultiScaleCycles, computeBayesianPredictions } from "./cycleEngine";
import { scoreAdvancedPatterns, computeHarmonicProfile, detectPositionalPatterns } from "./patternEngine";
import { computeRegressionCandidates, scoreByRegression, computeMultiWindowRegression, computeSmoothedTrends } from "./regressionEngine";
import { computeRecencyWeightedFrequency, computeCovarianceNetwork, scoreByCorrelationNetwork, computeTemporalVolatility, scoreByVolatility } from "./probabilityEngine";
import { buildTransitionMatrix, scoreByTransitionMatrix, buildPairTransitions, scoreByPairTransitions, computeStationaryDistribution, scoreByStationaryDist, buildRecencyWeightedMatrix, scoreByRecencyWeightedMatrix, computeVelocityProfiles, scoreByVelocity } from "./markovEngine";
import { buildConditionalNetwork, scoreByBayesianNetwork, computeMutualInformation, scoreByMutualInformation } from "./bayesianNetworkEngine";
import { scoreJackpotAlignment, computeAntiPopularityPenalty } from "../knowledge/jackpotMasterStrategies";
import type { ScoredGame, GameScores, RiskProfile } from "../core/aiTypes";

export function scoreGame(
  numbers: number[],
  lotteryId: string,
  stats: NumberStats[],
  draws: DrawResult[],
  riskProfile: RiskProfile = "balanced"
): ScoredGame {
  const breakdown: any[] = [];
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
        (contextW as unknown as Record<string, number>)[key] *= mult as number;
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

  // ENTROPY: information-theoretic quality assessment (enhanced)
  const enhancedEntropy = computeEnhancedEntropyReport(sorted, rules.totalNumbers);
  const entropyReport = enhancedEntropy; // backward compatible
  const consecutiveEntropy = computeConsecutiveEntropy(sorted);
  const edgeBalance = computeEdgeInteriorBalance(sorted, rules.totalNumbers);
  const entropyBonus = Math.round((entropyReport.compositeScore - 50) * 0.3);
  const uniformityBonus = Math.round((enhancedEntropy.uniformityScore - 50) * 0.12);
  const klPenalty = Math.round(enhancedEntropy.klDivergence * 8);

  // JOINT ENTROPY: novelty relative to recent draws
  const jointEnt = computeJointEntropy(sorted, draws, rules.totalNumbers, 10);
  const jointEntropyBonus = Math.round(jointEnt.noveltyScore * 6 - jointEnt.redundancyPenalty * 10);

  // CYCLE ALIGNMENT: how well numbers align with their natural cycles
  const cycleProfiles = computeCycleProfiles(draws, lotteryId, 150);
  const cycleScore = scoreByCycleAlignment(sorted, cycleProfiles);
  const cycleBonus = Math.round((cycleScore - 50) * 0.2);

  // MULTI-SCALE CYCLES: cross-validated short/medium/long term
  const multiScaleSignals = multiScaleCycleAnalysis(draws, lotteryId);
  const multiScaleCycleScore = scoreByMultiScaleCycles(sorted, multiScaleSignals);
  const multiScaleCycleBonus = Math.round((multiScaleCycleScore - 50) * 0.15);

  // BAYESIAN PREDICTIONS: posterior probability boost
  const bayesianPreds = computeBayesianPredictions(cycleProfiles, draws, lotteryId);
  let bayesianBonus = 0;
  if (bayesianPreds.length > 0) {
    const bayesMap = new Map(bayesianPreds.map(b => [b.number, b]));
    let bScore = 0;
    let bCount = 0;
    for (const n of sorted) {
      const b = bayesMap.get(n);
      if (b) {
        bScore += b.posteriorProbability / b.priorProbability; // likelihood ratio
        bCount++;
      }
    }
    bayesianBonus = bCount > 0 ? Math.round(Math.min(8, (bScore / bCount - 1) * 5)) : 0;
  }

  // ADVANCED PATTERN METRICS: primes, quadrants, gap variance + harmonics
  const advPatternScore = scoreAdvancedPatterns(sorted, lotteryId);
  const advPatternBonus = Math.round((advPatternScore - 50) * 0.12);

  // HARMONIC ANALYSIS: golden ratio, modular balance, geometric spread
  const harmonicProfile = computeHarmonicProfile(sorted, rules.totalNumbers);
  const harmonicBonus = Math.round((harmonicProfile.harmonicScore - 50) * 0.1);

  // POSITIONAL PATTERNS: arithmetic runs, mirror symmetry, terminal clusters
  const positionalReport = detectPositionalPatterns(sorted, rules.totalNumbers);
  const positionalBonus = Math.round((positionalReport.positionalScore - 50) * 0.08);

  // REGIME CHANGE DETECTION: adjust confidence if regime shifted
  const regimeReport = detectRegimeChange(draws, rules.totalNumbers, rules.pick);
  const regimePenalty = regimeReport.detected ? Math.round(regimeReport.shiftMagnitude * 5) : 0;

  // OUTLIER FILTER: penalize statistical outliers
  const histNorms = computeHistoricalNorms(draws, 100);
  const outlierCheck = checkGameOutlier(sorted, histNorms);
  const outlierPenalty = outlierCheck.isOutlier ? Math.round((outlierCheck.zScoreSum + outlierCheck.zScoreParity + outlierCheck.zScoreDispersal) * 2) : 0;

  // REGRESSION: favor numbers regressing toward the mean
  const regressionCandidates = computeRegressionCandidates(draws, stats, lotteryId, 80);
  const regressionStrategy = riskProfile === "momentum" ? "momentum" 
    : riskProfile === "regression" ? "contrarian" : "balanced";
  const regressionScore = scoreByRegression(sorted, regressionCandidates, regressionStrategy);
  const regressionBonus = Math.round((regressionScore - 50) * 0.15);

  // MULTI-WINDOW REGRESSION CONSENSUS: cross-validated signals
  const multiWindowReg = computeMultiWindowRegression(draws, stats, lotteryId);
  let multiWindowBonus = 0;
  if (multiWindowReg.length > 0) {
    const regMap = new Map(multiWindowReg.map(r => [r.number, r]));
    let consensusScore = 0;
    let consensusCount = 0;
    for (const n of sorted) {
      const r = regMap.get(n);
      if (r) {
        consensusCount++;
        if (r.consensus === "strong_up") consensusScore += r.consensusStrength * 1.2;
        else if (r.consensus === "up") consensusScore += r.consensusStrength * 0.8;
        else if (r.consensus === "neutral") consensusScore += 0.4;
        else if (r.consensus === "down") consensusScore -= r.consensusStrength * 0.3;
        else consensusScore -= r.consensusStrength * 0.5;
        // Trend acceleration bonus
        if (r.trendAcceleration > 0.1) consensusScore += 0.15;
      }
    }
    multiWindowBonus = consensusCount > 0
      ? Math.round((consensusScore / consensusCount) * 12)
      : 0;
  }

  // RECENCY-WEIGHTED FREQUENCY: boost numbers with recent momentum
  const recencyWeights = computeRecencyWeightedFrequency(draws, rules.totalNumbers, 40);
  let recencyBonus = 0;
  for (const n of sorted) {
    recencyBonus += (recencyWeights.get(n) || 0);
  }
  recencyBonus = Math.round((recencyBonus / sorted.length) * 8);

  // SMOOTHED TREND FORECAST: Holt-Winters prediction alignment
  const smoothedTrends = computeSmoothedTrends(draws, lotteryId);
  let forecastBonus = 0;
  if (smoothedTrends.length > 0) {
    const trendMap = new Map(smoothedTrends.map(t => [t.number, t]));
    let forecastScore = 0;
    let forecastCount = 0;
    for (const n of sorted) {
      const t = trendMap.get(n);
      if (t && t.forecastConfidence > 0.3) {
        forecastCount++;
        // Favor numbers with positive trend forecast
        if (t.forecast > t.level) forecastScore += t.forecastConfidence * 0.8;
        else forecastScore += (1 - t.forecastConfidence) * 0.3;
      }
    }
    forecastBonus = forecastCount > 0
      ? Math.round((forecastScore / forecastCount) * 8)
      : 0;
  }

  // CONSECUTIVE & EDGE BALANCE: structural quality
  const consecutiveBonus = Math.round(consecutiveEntropy.score * 5);
  const edgeBonus = Math.round(edgeBalance * 4);

  // CORRELATION NETWORK: reward leveraging correlated pairs
  const covNetwork = computeCovarianceNetwork(draws, rules.totalNumbers, 0.1);
  const correlationScore = scoreByCorrelationNetwork(sorted, covNetwork);
  const correlationBonus = Math.round((correlationScore - 50) * 0.12);

  // TEMPORAL VOLATILITY: prefer stable, predictable numbers
  const volatilityProfiles = computeTemporalVolatility(draws, rules.totalNumbers);
  const volatilityScore = scoreByVolatility(sorted, volatilityProfiles, riskProfile !== "aggressive");
  const volatilityBonus = Math.round((volatilityScore - 50) * 0.08);

  // MARKOV TRANSITION MATRIX: first-order transition probabilities
  const transitionMatrix = buildTransitionMatrix(draws, lotteryId, 100);
  const markovResult = prevDraw
    ? scoreByTransitionMatrix(sorted, prevDraw, transitionMatrix)
    : { markovScore: 50, avgTransitionProb: 0, highProbCount: 0, strongSignals: [] };
  const markovBonus = Math.round((markovResult.markovScore - 50) * 0.15);

  // PAIR TRANSITIONS: second-order Markov (pair → next number)
  const pairTransitions = buildPairTransitions(draws, lotteryId, 30, 80);
  const pairTransScore = prevDraw
    ? scoreByPairTransitions(sorted, prevDraw, pairTransitions)
    : 50;
  const pairTransBonus = Math.round((pairTransScore - 50) * 0.1);

  // STATIONARY DISTRIBUTION: long-term equilibrium alignment
  const stationaryDist = computeStationaryDistribution(transitionMatrix, 50);
  const stationaryScore = scoreByStationaryDist(sorted, stationaryDist);
  const stationaryBonus = Math.round((stationaryScore - 50) * 0.08);

  // BAYESIAN NETWORK: conditional dependency modeling
  const bayesNetwork = buildConditionalNetwork(draws, lotteryId, 120);
  const bayesNetScore = scoreByBayesianNetwork(sorted, bayesNetwork);
  const bayesNetBonus = Math.round((bayesNetScore.networkScore - 50) * 0.12);

  // MUTUAL INFORMATION: self-predictability scoring
  const miScores = computeMutualInformation(draws, lotteryId, 100);
  const miScore = scoreByMutualInformation(sorted, miScores);
  const miBonus = Math.round((miScore - 50) * 0.06);

  // RECENCY-WEIGHTED MARKOV: transitions with exponential decay
  const rwMatrix = buildRecencyWeightedMatrix(draws, lotteryId, 100, 0.03);
  const rwMarkovScore = prevDraw
    ? scoreByRecencyWeightedMatrix(sorted, prevDraw, rwMatrix)
    : 50;
  const rwMarkovBonus = Math.round((rwMarkovScore - 50) * 0.08);

  // VELOCITY PREDICTOR: favor accelerating numbers
  const velocityProfiles = computeVelocityProfiles(draws, lotteryId);
  const velocityScore = scoreByVelocity(sorted, velocityProfiles, riskProfile !== "regression");
  const velocityBonus = Math.round((velocityScore - 50) * 0.06);

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
  const winPatternBonus = Math.round((winPatternScore - 50) * 0.2);

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
    (pattern.sumProximity * 16 + 
     pattern.parityBalance * 16 + 
     pattern.dispersalScore * 16 + 
     pattern.repeatScore * 8 +
     (specialScore / 100) * 7 +
     (clusterScore / 100) * 9 +
     (entropyReport.compositeScore / 100) * 10 +
     (cycleScore / 100) * 8 +
     consecutiveEntropy.score * 5 +
     edgeBalance * 5)
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

  breakdown.push({ metric: "Base (Estatístico/Estrutural)", value: rawScore, type: "base", description: "Pontuação inicial baseada em frequência e padrões" });

  // Apply all overlays with enhanced signals
  let runningScore = rawScore;
  
  const applyAdjustment = (metric: string, bonus: number, weight: number, desc: string) => {
    const adj = bonus * weight;
    runningScore += adj;
    if (adj !== 0) {
      breakdown.push({ 
        metric, 
        value: Number(adj.toFixed(2)), 
        type: adj > 0 ? "bonus" : "penalty", 
        description: desc 
      });
    }
  };

  applyAdjustment("Monte Carlo", monteCarloBonus, 0.10, "Simulações de consistência");
  applyAdjustment("ROI Estimado", roiBonus, 0.08, "Expectativa de retorno financeiro");
  applyAdjustment("Padrões Ganhadores", winPatternBonus, 0.08, "Alinhamento com sorteios reais");
  applyAdjustment("Entropia", entropyBonus, 0.06, "Qualidade da distribuição de informação");
  applyAdjustment("Ciclos", cycleBonus, 0.06, "Momento do número no ciclo natural");
  applyAdjustment("Ciclos Multi-Escala", multiScaleCycleBonus, 0.05, "Consenso de janelas temporais");
  applyAdjustment("Bayes (Predição)", bayesianBonus, 0.04, "Probabilidade condicional posterior");
  applyAdjustment("Padrões Avançados", advPatternBonus, 0.04, "Harmonia e geometria numérica");
  applyAdjustment("Harmônicos", harmonicBonus, 0.04, "Equilíbrio modular e proporção áurea");
  applyAdjustment("Posicional", positionalBonus, 0.03, "Simetria e clusters terminais");
  applyAdjustment("Regressão", regressionBonus, 0.06, "Tendência de retorno à média");
  applyAdjustment("Consenso Regressão", multiWindowBonus, 0.05, "Validação multi-janela");
  applyAdjustment("Recência", recencyBonus, 0.05, "Momentum de sorteios recentes");
  applyAdjustment("Previsão (Forecast)", forecastBonus, 0.05, "Tendência Holt-Winters");
  applyAdjustment("Consecutivos", consecutiveBonus, 0.03, "Qualidade das sequências");
  applyAdjustment("Borda/Interior", edgeBonus, 0.03, "Equilíbrio geográfico no volante");
  applyAdjustment("Co-ocorrência", coOccBonus, 0.05, "Pares que costumam sair juntos");
  applyAdjustment("Correlação", correlationBonus, 0.04, "Rede de dependência estatística");
  applyAdjustment("Volatilidade", volatilityBonus, 0.03, "Estabilidade do comportamento numérico");
  applyAdjustment("Markov", markovBonus, 0.06, "Probabilidades de transição");
  applyAdjustment("Transição de Pares", pairTransBonus, 0.04, "Markov de segunda ordem");
  applyAdjustment("Distribuição Estacionária", stationaryBonus, 0.03, "Equilíbrio de longo prazo");
  applyAdjustment("Uniformidade", uniformityBonus, 0.04, "Rényi + KL Divergence");
  applyAdjustment("Entropia Conjunta", jointEntropyBonus, 0.03, "Novidade relativa a sorteios recentes");
  applyAdjustment("Rede Bayesiana", bayesNetBonus, 0.05, "Dependência condicional complexa");
  applyAdjustment("Informação Mútua", miBonus, 0.03, "Auto-previsibilidade");
  applyAdjustment("Markov Ponderado", rwMarkovBonus, 0.04, "Transições com decaimento temporal");
  applyAdjustment("Velocidade", velocityScore, 0.03, "Aceleração de frequência");

  // Alinhamento Mestre (novo)
  const alignment = scoreJackpotAlignment(numbers, draws, lotteryId);
  const alignmentAdj = (alignment.score - 50) * 0.15;
  applyAdjustment("Alinhamento Mestre", alignmentAdj, 1, "Aderência ao perfil campeão");

  // Penalties
  applyAdjustment("Padrão Humano", humanPenalty, -0.30, "Evita datas e desenhos comuns");
  applyAdjustment("Anti-Pares", antiPairPenalty, -0.08, "Evita combinações improváveis");
  applyAdjustment("Mudança de Regime", regimePenalty, -0.04, "Instabilidade no padrão de sorteio");
  applyAdjustment("Outliers", outlierPenalty, -0.06, "Desvios estatísticos extremos");
  applyAdjustment("Divergência KL", klPenalty, -0.03, "Afastamento da distribuição uniforme");

  // Anti-Popularidade (novo)
  const antiPopPenalty = computeAntiPopularityPenalty(numbers, lotteryId);
  if (antiPopPenalty < 1) {
    const antiPopVal = runningScore * (antiPopPenalty - 1);
    runningScore += antiPopVal;
    breakdown.push({
      metric: "Anti-Popularidade",
      value: Number(antiPopVal.toFixed(2)),
      type: "penalty",
      description: "Proteção contra rateio baixo (apostas comuns)"
    });
  }

  const totalScore = Math.max(0, Math.min(100, runningScore));

  const grade = totalScore >= 85 ? "S" : totalScore >= 70 ? "A" : totalScore >= 55 ? "B" :
    totalScore >= 40 ? "C" : totalScore >= 25 ? "D" : "F";

  const alignment = scoreJackpotAlignment(sorted, draws, lotteryId);
  const antiPopPenalty = computeAntiPopularityPenalty(sorted, lotteryId);

  const explanation = buildExplanation(sorted, lotteryId, pattern, { statistical: statScore, structural: structScore, coverage: coverageScore, diversity: diversityScore, strategyFit, probability: probScore }, totalScore, grade, clusterScore, humanPenalty, monteCarlo, roi, context, entropyReport, cycleScore, regressionScore, multiWindowBonus, forecastBonus, consecutiveEntropy, edgeBalance, markovResult, enhancedEntropy, bayesNetScore, { bayesianBonus, alignmentScore: alignment.score, antiPopPenalty });

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
  regressionScore?: number,
  multiWindowBonus?: number,
  forecastBonus?: number,
  consecutiveEntropy?: { score: number; consecutivePairs: number; maxRun: number },
  edgeBalance?: number,
  markovResult?: { markovScore: number; highProbCount: number; strongSignals: { number: number; probability: number }[] },
  enhancedEntropy?: { uniformityScore: number; renyiEntropy: number; klDivergence: number },
  bayesNetScore?: { networkScore: number; centralityCount: number; internalConsistency: number },
  extraInsights?: { bayesianBonus: number; alignmentScore: number; antiPopPenalty: number }
): string[] {
  const lines: string[] = [];
  lines.push(`Score geral: ${total}/100 (${grade})`);

  // PRINCIPAIS RAZÕES DO RANKING
  if (extraInsights) {
    if (extraInsights.bayesianBonus > 0) {
      lines.push(`🎯 Probabilidades Bayesianas: +${extraInsights.bayesianBonus} pontos de confiança condicional`);
    }
    if (extraInsights.alignmentScore >= 60) {
      lines.push(`🏆 Alinhamento Mestre: ${extraInsights.alignmentScore}/100 — alta aderência ao perfil vencedor`);
    }
    if (extraInsights.antiPopPenalty < 1) {
      const reduction = Math.round((1 - extraInsights.antiPopPenalty) * 100);
      lines.push(`🛡️ Anti-Popularidade: penalidade de ${reduction}% aplicada para proteger o prêmio (evita apostas comuns)`);
    }
  }

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

  // ENHANCED ENTROPY insights
  if (enhancedEntropy) {
    if (enhancedEntropy.uniformityScore >= 70) {
      lines.push(`✅ Uniformidade estatística alta: ${enhancedEntropy.uniformityScore}/100 (Rényi + KL)`);
    } else if (enhancedEntropy.klDivergence > 0.4) {
      lines.push(`⚠️ Divergência KL elevada: distribuição distante do uniforme`);
    }
  }

  // MARKOV insights
  if (markovResult) {
    if (markovResult.markovScore >= 65) {
      lines.push(`✅ Alinhamento Markov forte: ${markovResult.markovScore}/100 — ${markovResult.highProbCount} números com alta probabilidade de transição`);
    } else if (markovResult.markovScore >= 45) {
      lines.push(`📊 Alinhamento Markov moderado: ${markovResult.markovScore}/100`);
    } else {
      lines.push(`⚠️ Baixa coerência com padrões de transição: ${markovResult.markovScore}/100`);
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

  // MULTI-WINDOW & FORECAST insights
  if (multiWindowBonus !== undefined && multiWindowBonus > 3) {
    lines.push("✅ Consenso multi-janela positivo: sinais de regressão alinhados em 30/80/150 sorteios");
  } else if (multiWindowBonus !== undefined && multiWindowBonus < -2) {
    lines.push("⚠️ Sinais de regressão divergentes entre janelas temporais");
  }

  if (forecastBonus !== undefined && forecastBonus > 3) {
    lines.push("📈 Previsão Holt-Winters favorável: tendência ascendente confirmada");
  }

  if (consecutiveEntropy) {
    if (consecutiveEntropy.maxRun > 3) lines.push(`⚠️ Sequência longa de ${consecutiveEntropy.maxRun} consecutivos detectada`);
    else if (consecutiveEntropy.consecutivePairs >= 1 && consecutiveEntropy.score > 0.7)
      lines.push("✅ Padrão de consecutivos dentro do ideal histórico");
  }

  if (edgeBalance !== undefined) {
    if (edgeBalance >= 0.7) lines.push("✅ Equilíbrio entre extremos e centro do volante");
    else if (edgeBalance < 0.4) lines.push("⚠️ Desequilíbrio entre números extremos e centrais");
  }

  // BAYESIAN NETWORK insights
  if (bayesNetScore) {
    if (bayesNetScore.networkScore >= 65) {
      lines.push(`✅ Rede Bayesiana favorável: ${bayesNetScore.networkScore}/100 — ${bayesNetScore.centralityCount} números de alta centralidade`);
    } else if (bayesNetScore.networkScore >= 45) {
      lines.push(`📊 Rede Bayesiana moderada: ${bayesNetScore.networkScore}/100`);
    } else {
      lines.push(`⚠️ Baixa coerência na rede condicional: ${bayesNetScore.networkScore}/100`);
    }
    if (bayesNetScore.internalConsistency >= 0.7) {
      lines.push("✅ Alta consistência interna: números se reforçam mutuamente");
    }
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
