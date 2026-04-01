/**
 * Native AI — Ranking Engine
 * Multi-dimensional scoring for lottery games
 */

import { NumberStats } from "@/engine/statistics";
import { DrawResult } from "@/data/lotteries";
import { computePatternProfile } from "./patternEngine";
import { getLotteryRules } from "../knowledge/lotteriesKnowledge";
import { AI_CONFIG } from "../core/aiConfig";
import { computeSpecialNumberScore, computeHistoricalHitRate } from "./advancedAnalysisEngine";
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

  // Statistical score: based on frequency alignment
  const selectedStats = sorted.map(n => stats.find(s => s.number === n)).filter(Boolean) as NumberStats[];
  const hotCount = selectedStats.filter(s => s.status === "hot").length;
  const coldCount = selectedStats.filter(s => s.status === "cold").length;
  const idealHot = Math.round(rules.pick * riskConfig.hotBias);
  const idealCold = Math.round(rules.pick * riskConfig.coldBias);
  const statScore = Math.max(0, 100 - Math.abs(hotCount - idealHot) * 8 - Math.abs(coldCount - idealCold) * 5);

  // Structural score: pattern profile
  const structScore = Math.round(pattern.overallScore * 100);

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

  // Strategy fit with advanced metrics
  const strategyFit = Math.round(
    (pattern.parityBalance * 18 +
    pattern.sumProximity * 18 +
    pattern.sequencePenalty * riskConfig.sequencePenalty * 12 +
    pattern.dispersalScore * 15 +
    pattern.rowBalance * 7 +
    pattern.colBalance * 7 +
    (statScore / 100) * 23) 
  );

  // Probability score incorporating zone balance and co-occurrence potential
  const probScore = Math.round(
    (pattern.sumProximity * 25 + 
     pattern.parityBalance * 25 + 
     pattern.dispersalScore * 25 + 
     pattern.repeatScore * 15 +
     (specialScore / 100) * 10)
  );

  const w = AI_CONFIG.scoringWeights;
  const totalScore = Math.round(
    statScore * w.statistical +
    structScore * w.structural +
    (coverageScore + winRateBonus) * w.coverage +
    diversityScore * w.diversity +
    strategyFit * w.strategyFit +
    probScore * w.probability
  );

  const grade = totalScore >= 85 ? "S" : totalScore >= 70 ? "A" : totalScore >= 55 ? "B" :
    totalScore >= 40 ? "C" : totalScore >= 25 ? "D" : "F";

  const explanation = buildExplanation(sorted, lotteryId, pattern, { statistical: statScore, structural: structScore, coverage: coverageScore, diversity: diversityScore, strategyFit, probability: probScore }, totalScore, grade);

  return {
    numbers: sorted,
    scores: { statistical: statScore, structural: structScore, coverage: coverageScore, diversity: diversityScore, strategyFit, probability: probScore },
    totalScore,
    grade,
    explanation,
  };
}

function buildExplanation(
  numbers: number[],
  lotteryId: string,
  pattern: ReturnType<typeof computePatternProfile>,
  scores: GameScores,
  total: number,
  grade: string
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
  return games
    .map(g => scoreGame(g, lotteryId, stats, draws, riskProfile))
    .sort((a, b) => b.totalScore - a.totalScore);
}
