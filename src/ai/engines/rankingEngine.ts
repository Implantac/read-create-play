/**
 * Native AI — Ranking Engine
 * Multi-dimensional scoring for lottery games
 */

import { NumberStats } from "@/engine/statistics";
import { DrawResult } from "@/data/lotteries";
import { computePatternProfile } from "./patternEngine";
import { getLotteryRules } from "../knowledge/lotteriesKnowledge";
import { AI_CONFIG } from "../core/aiConfig";
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

  // Coverage score: lift observado vs esperado nos últimos 30 sorteios.
  // Lift = média de acertos / acertos esperados pela hipótese de uniformidade.
  // Lift = 1.0 → uniforme (50 pts); >1.0 boost; <1.0 penalidade.
  const recent = draws.slice(0, 30);
  const gameSet = new Set(sorted);
  let totalHits = 0;
  for (const d of recent) {
    totalHits += d.numbers.filter(n => gameSet.has(n)).length;
  }
  const avgHits = recent.length > 0 ? totalHits / recent.length : 0;
  const expectedHits = (rules.pick * sorted.length) / rules.totalNumbers;
  const lift = expectedHits > 0 ? avgHits / expectedHits : 1;
  // Mapeia lift∈[0.5,1.5] → score∈[0,100], com 1.0 = 50.
  const coverageScore = Math.max(0, Math.min(100, Math.round(50 + (lift - 1) * 100)));

  // Diversity score: how different from average
  const avgFreq = selectedStats.reduce((s, st) => s + st.frequency, 0) / selectedStats.length;
  const freqVariance = selectedStats.reduce((s, st) => s + (st.frequency - avgFreq) ** 2, 0) / selectedStats.length;
  const diversityScore = Math.min(100, Math.round(Math.sqrt(freqVariance) * riskConfig.diversityWeight * 5));

  // Strategy fit — agora inclui repeatScore (alinhamento histórico) e decadeBalance (variedade).
  const strategyFit = Math.round(
    pattern.parityBalance * 15 +
    pattern.sumProximity * 18 +
    pattern.sequencePenalty * riskConfig.sequencePenalty * 12 +
    pattern.dispersalScore * 12 +
    pattern.repeatScore * 10 +
    pattern.decadeBalance * 8 +
    (statScore / 100) * 25
  );

  // Probability score — inclui equilíbrio par/ímpar, soma, dispersão e décadas.
  const probScore = Math.round(
    pattern.sumProximity * 25 +
    pattern.parityBalance * 25 +
    pattern.dispersalScore * 25 +
    pattern.decadeBalance * 25
  );

  const w = AI_CONFIG.scoringWeights;
  const totalScore = Math.round(
    statScore * w.statistical +
    structScore * w.structural +
    coverageScore * w.coverage +
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

  if (pattern.decadeBalance >= 0.7) lines.push("✅ Variedade adequada entre as dezenas");
  else lines.push("⚠️ Dezenas concentradas em poucas décadas");

  if (pattern.repeatScore >= 0.7) lines.push("✅ Repetição vs sorteio anterior dentro da faixa histórica");

  if (lotteryId === "lotofacil" && pattern.frameCenterBalance >= 0.8)
    lines.push("✅ Equilíbrio moldura/centro adequado");

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
