/**
 * Strategy Evolution Engine — Core
 * Backtesting, ranking, auto-evolution and recommendations
 */

import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats, computeFrequencyStats } from "@/features/statistics/engine";
import { generateByStrategy, Strategy } from "@/engine/strategies";
import { analyzeEvidence, runMonteCarloSim } from "@/engine/stats/evidence-engine";

import {
  StrategyDefinition,
  StrategyMetrics,
  RankingEntry,
  EvolutionSuggestion,
  LabConfig,
  LabResult,
  StrategyParams,
  StrategyGames,
} from "./types";
import { getStrategiesForLottery, getStrategy, STRATEGY_REGISTRY } from "./strategies-registry";

// ═══════════════════════════════════════════════════════
// BACKTESTING
// ═══════════════════════════════════════════════════════

function backtestStrategy(
  strategyDef: StrategyDefinition,
  games: number[][],
  draws: DrawResult[],
  config: LotteryConfig,
): StrategyMetrics {
  const hitDistribution: Record<number, number> = {};
  let totalHits = 0;
  let bestHits = 0;
  let worstHits = config.pick;
  const hitsPerDraw: number[] = [];

  for (const draw of draws) {
    if (!draw?.numbers?.length) continue;
    const drawSet = new Set(draw.numbers);

    for (const game of games) {
      const hits = game.filter(n => drawSet.has(n)).length;
      hitDistribution[hits] = (hitDistribution[hits] || 0) + 1;
      totalHits += hits;
      if (hits > bestHits) bestHits = hits;
      if (hits < worstHits) worstHits = hits;
      hitsPerDraw.push(hits);
    }
  }

  const totalComparisons = draws.length * games.length;
  const avgHits = totalComparisons > 0 ? totalHits / totalComparisons : 0;

  // Consistency: 1 - coefficient of variation
  let consistency = 0;
  if (hitsPerDraw.length > 1 && avgHits > 0) {
    const variance = hitsPerDraw.reduce((s, h) => s + (h - avgHits) ** 2, 0) / hitsPerDraw.length;
    const stdDev = Math.sqrt(variance);
    consistency = Math.max(0, Math.min(1, 1 - stdDev / avgHits));
  }

  // Prize count (simplified: consider hits >= pick-2 as prize-worthy)
  const prizeThreshold = Math.max(config.pick - 4, Math.floor(config.pick * 0.7));
  let totalPrizes = 0;
  for (const [hits, count] of Object.entries(hitDistribution)) {
    if (Number(hits) >= prizeThreshold) totalPrizes += count;
  }

  // Diversity between generated games
  let diversitySum = 0;
  let pairCount = 0;
  for (let i = 0; i < games.length; i++) {
    for (let j = i + 1; j < games.length; j++) {
      const setA = new Set(games[i]);
      const overlap = games[j].filter(n => setA.has(n)).length;
      diversitySum += 1 - overlap / config.pick;
      pairCount++;
    }
  }
  const diversityScore = pairCount > 0 ? (diversitySum / pairCount) * 100 : 50;

  // Redundancy
  const redundancyIndex = pairCount > 0 ? 1 - diversitySum / pairCount : 0;

  // Coverage: unique numbers used
  const allNums = new Set(games.flat());
  const coverageScore = (allNums.size / config.numbers) * 100;

  // Evidence Engine integration
  const evidence = analyzeEvidence(totalHits, games, draws, config, 1000);
  const lift = evidence.lift;
  const monteCarloData = runMonteCarloSim(games, draws, config, 200);
  const accuracy = draws.length >= 20 ? Math.min(98, Math.max(0, Math.round((Math.max(0, lift - 1) * 2 + consistency / 2) * 100))) : null;

  // Global composite score
  const globalScore = Math.min(100,
    avgHits * 8 +
    consistency * 20 +
    diversityScore * 0.15 +
    coverageScore * 0.1 +
    (totalPrizes > 0 ? 15 : 0) -
    redundancyIndex * 10
  );

  return {
    avgHits,
    bestHits,
    worstHits,
    consistency,
    hitDistribution,
    totalPrizes,
    costPerGame: getCostForLottery(config.id),
    coverageScore,
    diversityScore,
    redundancyIndex,
    globalScore,
    accuracy,
    lift,
    pValue: evidence.pValue,
    zScore: evidence.zScore,
    confidenceInterval: evidence.confidenceInterval,
    monteCarloData,
    evidenceGrade: evidence.grade,
    evidenceExplanation: evidence.explanation
  };
}


function getCostForLottery(lotteryId: string): number {
  // Preços oficiais Caixa — vigentes desde nov/2024
  const costs: Record<string, number> = {
    lotofacil: 3.5, megasena: 6.0, quina: 3.0, lotomania: 3.5,
    duplasena: 3.0, timemania: 4.5, diadesorte: 3.0, supersete: 2.5,
  };
  return costs[lotteryId] || 3.0;
}

// ═══════════════════════════════════════════════════════
// RANKING
// ═══════════════════════════════════════════════════════

function buildRanking(
  results: { def: StrategyDefinition; metrics: StrategyMetrics }[],
  lotteryId: string,
): RankingEntry[] {
  const sorted = [...results].sort((a, b) => b.metrics.globalScore - a.metrics.globalScore);

  return sorted.map((r, idx) => ({
    rank: idx + 1,
    strategyId: r.def.id,
    strategyName: r.def.name,
    lotteryId,
    metrics: r.metrics,
    trend: "stable" as const,
    executions: 1,
    lastTestedAt: Date.now(),
    explanation: buildExplanation(r.def, r.metrics, idx + 1),
  }));
}

function buildExplanation(def: StrategyDefinition, m: StrategyMetrics, rank: number): string {
  const parts: string[] = [];
  if (rank === 1) {
    parts.push(`${def.name} ficou em 1º lugar`);
  } else {
    parts.push(`${def.name} ficou na posição ${rank}`);
  }

  if (m.consistency > 0.7) parts.push("com alta consistência");
  else if (m.consistency < 0.3) parts.push("com baixa consistência");

  if (m.avgHits > 0) parts.push(`média de ${m.avgHits.toFixed(2)} acertos`);
  if (m.totalPrizes > 0) parts.push(`${m.totalPrizes} premiações detectadas`);
  if (m.diversityScore > 70) parts.push("boa diversidade entre jogos");
  if (m.lift > 1.05) parts.push(`evidência estatística positiva (${m.lift.toFixed(2)}x)`);

  return parts.join(", ") + ".";
}

// ═══════════════════════════════════════════════════════
// AUTO-EVOLUTION
// ═══════════════════════════════════════════════════════

function generateEvolutionSuggestions(
  rankings: RankingEntry[],
  results: { def: StrategyDefinition; metrics: StrategyMetrics }[],
): EvolutionSuggestion[] {
  const suggestions: EvolutionSuggestion[] = [];
  if (rankings.length < 2) return suggestions;

  const top = results.find(r => r.def.id === rankings[0].strategyId);
  const bottom = results.find(r => r.def.id === rankings[rankings.length - 1].strategyId);

  // Suggest promoting top performer
  if (top && top.metrics.globalScore > 60) {
    suggestions.push({
      type: "promote",
      sourceStrategy: top.def.id,
      reason: `${top.def.name} apresentou a melhor performance geral com score ${top.metrics.globalScore.toFixed(1)}`,
      expectedImprovement: 0,
      confidence: Math.min(1, top.metrics.consistency + 0.2),
    });
  }

  // Suggest discarding bottom performer
  if (bottom && bottom.metrics.globalScore < 30) {
    suggestions.push({
      type: "discard",
      sourceStrategy: bottom.def.id,
      reason: `${bottom.def.name} apresentou performance muito baixa (score ${bottom.metrics.globalScore.toFixed(1)})`,
      expectedImprovement: 0,
      confidence: 0.8,
    });
  }

  // Suggest parameter adjustments based on patterns
  for (const r of results) {
    if (r.metrics.consistency < 0.4 && r.metrics.avgHits > 0) {
      suggestions.push({
        type: "adjust_param",
        sourceStrategy: r.def.id,
        targetParam: "parityWeight",
        suggestedValue: Math.min(1, r.def.params.parityWeight + 0.2),
        reason: `${r.def.name} tem baixa consistência — aumentar peso de paridade pode estabilizar`,
        expectedImprovement: 8,
        confidence: 0.5,
      });
    }

    if (r.metrics.redundancyIndex > 0.6) {
      suggestions.push({
        type: "adjust_param",
        sourceStrategy: r.def.id,
        targetParam: "dispersalWeight",
        suggestedValue: Math.min(1, r.def.params.dispersalWeight + 0.3),
        reason: `${r.def.name} gera jogos muito parecidos — aumentar dispersão reduz redundância`,
        expectedImprovement: 12,
        confidence: 0.6,
      });
    }
  }

  // Suggest combining top 2
  if (rankings.length >= 2) {
    suggestions.push({
      type: "combine",
      sourceStrategy: `${rankings[0].strategyId}+${rankings[1].strategyId}`,
      reason: `Combinar ${rankings[0].strategyName} com ${rankings[1].strategyName} pode melhorar performance geral`,
      expectedImprovement: 5,
      confidence: 0.4,
    });
  }

  return suggestions;
}

// ═══════════════════════════════════════════════════════
// INSIGHTS
// ═══════════════════════════════════════════════════════

function generateInsights(rankings: RankingEntry[], lotteryId: string): string[] {
  const insights: string[] = [];

  if (rankings.length === 0) return ["Nenhuma estratégia testada ainda."];

  const best = rankings[0];
  insights.push(`🏆 Melhor estratégia para ${lotteryId}: ${best.strategyName} (Score: ${best.metrics.globalScore.toFixed(1)})`);

  const avgScore = rankings.reduce((s, r) => s + r.metrics.globalScore, 0) / rankings.length;
  insights.push(`📊 Score médio entre ${rankings.length} estratégias: ${avgScore.toFixed(1)}`);

  const consistent = rankings.filter(r => r.metrics.consistency > 0.6);
  if (consistent.length > 0) {
    insights.push(`✅ ${consistent.length} estratégia(s) com alta consistência`);
  }

  const withPrizes = rankings.filter(r => r.metrics.totalPrizes > 0);
  if (withPrizes.length > 0) {
    insights.push(`🎯 ${withPrizes.length} estratégia(s) geraram premiações no backtesting`);
  }

  if (best.metrics.avgHits > 0) {
    insights.push(`📈 Média de acertos da melhor: ${best.metrics.avgHits.toFixed(2)} por jogo/concurso`);
  }

  return insights;
}

// ═══════════════════════════════════════════════════════
// MAIN LAB RUNNER
// ═══════════════════════════════════════════════════════

export function runStrategyLab(
  labConfig: LabConfig,
  allDraws: DrawResult[],
  config: LotteryConfig,
): LabResult {
  const start = performance.now();

  // Filter draws to range
  const draws = allDraws.filter(d =>
    d.concurso >= labConfig.drawRange[0] && d.concurso <= labConfig.drawRange[1]
  );

  if (draws.length === 0) {
    return {
      config: labConfig,
      rankings: [],
      suggestions: [],
      bestStrategy: null,
      insights: ["Sem sorteios disponíveis no intervalo selecionado."],
      elapsedMs: Math.round(performance.now() - start),
      generatedGames: [],
    };
  }

  // Initial stats are deferred to avoid leakage.

  // Get strategies
  const available = getStrategiesForLottery(labConfig.lotteryId);
  const selectedDefs = labConfig.strategies.length > 0
    ? labConfig.strategies.map(id => getStrategy(id)).filter(Boolean) as StrategyDefinition[]
    : available;

  // Split data: 70% Train, 30% Evaluation (Paired)
  const trainCount = Math.floor(draws.length * 0.7);
  const trainDraws = draws.slice(0, trainCount);
  const evalDraws = draws.slice(trainCount);

  // Compute stats only from Train data to avoid leakage
  const trainStats = computeFrequencyStats(trainDraws, config.numbers);

  // Generate games and backtest each strategy on Eval data
  const results: { def: StrategyDefinition; metrics: StrategyMetrics; games: number[][] }[] = [];

  for (const def of selectedDefs) {
    const games: number[][] = [];
    const seen = new Set<string>();

    for (let i = 0; i < labConfig.gamesPerStrategy * 3 && games.length < labConfig.gamesPerStrategy; i++) {
      const game = generateByStrategy(def.baseStrategy as any, trainStats, config);
      const sorted = [...game].sort((a, b) => a - b);
      const key = sorted.join(",");
      if (!seen.has(key)) {
        seen.add(key);
        games.push(sorted);
      }
    }

    const metrics = backtestStrategy(def, games, evalDraws, config);
    results.push({ def, metrics, games });
  }

  // Build ranking
  const rankings = buildRanking(results, labConfig.lotteryId);

  // Generate evolution suggestions
  const suggestions = generateEvolutionSuggestions(rankings, results);

  // Generate insights
  const insights = generateInsights(rankings, labConfig.lotteryId);

  // Build generated games sorted by ranking order
  const generatedGames: StrategyGames[] = rankings.map(r => {
    const entry = results.find(res => res.def.id === r.strategyId)!;
    return {
      strategyId: r.strategyId,
      strategyName: r.strategyName,
      games: entry.games,
      metrics: entry.metrics,
    };
  });

  return {
    config: labConfig,
    rankings,
    suggestions,
    bestStrategy: rankings[0] || null,
    insights,
    elapsedMs: Math.round(performance.now() - start),
    generatedGames,
  };
}

export { STRATEGY_REGISTRY, getStrategiesForLottery, getStrategy };
