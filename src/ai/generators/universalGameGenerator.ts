/**
 * Native AI — Universal Game Generator
 * Generates optimized games for any lottery using statistical engines
 */

import { DrawResult } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";
import { getLotteryRules } from "../knowledge/lotteriesKnowledge";
import { getStrategy } from "../knowledge/strategiesKnowledge";
import { computePatternProfile } from "../engines/patternEngine";
import type { RiskProfile, IntentFilters, ScoredGame } from "../core/aiTypes";
import { scoreGame } from "../engines/rankingEngine";
import { buildAdvancedWeightMap, analyzeZoneDistribution, computeCoOccurrence } from "../engines/advancedAnalysisEngine";

interface GeneratorConfig {
  lotteryId: string;
  count: number;
  riskProfile: RiskProfile;
  filters: IntentFilters;
  stats: NumberStats[];
  draws: DrawResult[];
}

/** Main generation function — generates, filters and ranks games */
export function generateGames(config: GeneratorConfig): ScoredGame[] {
  const rules = getLotteryRules(config.lotteryId);
  const strategy = getStrategy(config.riskProfile);
  const prevDraw = config.draws.length > 0 ? config.draws[0].numbers : undefined;

  // Build weighted pool
  const pool = buildWeightedPool(config.stats, strategy.filters, config.filters);

  // Generate candidates (10x requested count for filtering)
  const candidateCount = Math.max(config.count * 20, 500);
  const candidates: number[][] = [];

  for (let attempt = 0; attempt < candidateCount * 3 && candidates.length < candidateCount; attempt++) {
    const game = weightedSample(pool, rules.pick);
    if (!game) continue;

    // Quick filter
    if (config.filters.customNumbers) {
      const gameSet = new Set(game);
      if (!config.filters.customNumbers.every(n => gameSet.has(n))) continue;
    }
    if (config.filters.excludeNumbers) {
      if (game.some(n => config.filters.excludeNumbers!.includes(n))) continue;
    }

    const pattern = computePatternProfile(game, config.lotteryId, prevDraw);

    // Apply filters
    if (config.filters.balanceParity && pattern.parityBalance < 0.5) continue;
    if (config.filters.avoidSequences && pattern.sequencePenalty < 0.5) continue;
    if (pattern.sumProximity < 0.3) continue; // always filter extreme sums

    candidates.push(game);
  }

  // Score and rank all candidates
  const scored = candidates.map(g =>
    scoreGame(g, config.lotteryId, config.stats, config.draws, config.riskProfile)
  );

  // Sort by score and take top N, ensuring diversity
  scored.sort((a, b) => b.totalScore - a.totalScore);

  const selected = selectDiverse(scored, config.count, rules.pick);
  return selected;
}

/** Build weighted number pool based on strategy and stats */
function buildWeightedPool(
  stats: NumberStats[],
  strategyFilters: { hotBias: number; coldBias: number },
  intentFilters: IntentFilters
): { number: number; weight: number }[] {
  return stats.map(s => {
    let weight = 1;

    // Frequency weighting
    if (s.status === "hot") weight += strategyFilters.hotBias * 3;
    else if (s.status === "cold") weight += strategyFilters.coldBias * 3;

    // Trend boost
    if (s.trend > 0) weight += s.trend * 0.3;

    // Cycle due boost
    if (s.cycleScore > 1) weight += (s.cycleScore - 1) * 1.5;

    // Momentum
    if (s.momentum > 0) weight += s.momentum * 0.002;

    // Intent-specific
    if (intentFilters.prioritizeHot && s.status === "hot") weight *= 1.5;
    if (intentFilters.prioritizeCold && s.status === "cold") weight *= 1.5;

    // Exclude
    if (intentFilters.excludeNumbers?.includes(s.number)) weight = 0;

    return { number: s.number, weight: Math.max(0.01, weight) };
  });
}

/** Weighted random sampling without replacement */
function weightedSample(pool: { number: number; weight: number }[], pick: number): number[] | null {
  const available = pool.filter(p => p.weight > 0);
  if (available.length < pick) return null;

  const selected: number[] = [];
  const remaining = [...available];

  for (let i = 0; i < pick; i++) {
    const totalWeight = remaining.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * totalWeight;
    let idx = 0;
    for (; idx < remaining.length; idx++) {
      r -= remaining[idx].weight;
      if (r <= 0) break;
    }
    idx = Math.min(idx, remaining.length - 1);
    selected.push(remaining[idx].number);
    remaining.splice(idx, 1);
  }

  return selected.sort((a, b) => a - b);
}

/** Select diverse set of games — avoid too-similar combinations */
function selectDiverse(scored: ScoredGame[], count: number, pick: number): ScoredGame[] {
  if (scored.length <= count) return scored;

  const selected: ScoredGame[] = [scored[0]];
  const minDiff = Math.max(2, Math.floor(pick * 0.3));

  for (const game of scored.slice(1)) {
    if (selected.length >= count) break;

    // Check diversity from all selected
    const isDiverse = selected.every(sel => {
      const setA = new Set(sel.numbers);
      const overlap = game.numbers.filter(n => setA.has(n)).length;
      return pick - overlap >= minDiff;
    });

    if (isDiverse) selected.push(game);
  }

  // Fill remaining if diversity was too strict
  if (selected.length < count) {
    for (const game of scored) {
      if (selected.length >= count) break;
      if (!selected.includes(game)) selected.push(game);
    }
  }

  return selected;
}
