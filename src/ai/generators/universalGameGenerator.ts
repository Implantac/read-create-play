/**
 * Native AI — Universal Game Generator
 * Generates optimized games for any lottery using statistical engines
 */

import { DrawResult } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";
import { getLotteryRules } from "../knowledge/lotteriesKnowledge";
import { getStrategy, getAllStrategyIds } from "../knowledge/strategiesKnowledge";
import { computePatternProfile } from "../engines/patternEngine";
import type { RiskProfile, IntentFilters, ScoredGame } from "../core/aiTypes";
import { scoreGame } from "../engines/rankingEngine";
import { buildAdvancedWeightMap, analyzeZoneDistribution, computeCoOccurrence, computeHumanPatternPenalty } from "../engines/advancedAnalysisEngine";
import { optimizePortfolio, evaluatePortfolio, recordPerformance, estimateROI } from "../engines/adaptiveEngine";

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

  // Build advanced weighted pool using multi-dimensional analysis
  const advancedWeights = buildAdvancedWeightMap(
    config.stats, config.draws, config.lotteryId, strategy.engineWeights
  );
  const zoneAnalysis = analyzeZoneDistribution(config.draws, config.lotteryId);
  const coOcc = computeCoOccurrence(config.draws, rules.totalNumbers, 30);
  const topPairSet = new Map<number, Set<number>>();
  for (const p of coOcc.topPairs.slice(0, 15)) {
    if (!topPairSet.has(p.a)) topPairSet.set(p.a, new Set());
    if (!topPairSet.has(p.b)) topPairSet.set(p.b, new Set());
    topPairSet.get(p.a)!.add(p.b);
    topPairSet.get(p.b)!.add(p.a);
  }

  const pool = buildWeightedPool(config.stats, strategy.filters, config.filters, advancedWeights);

  // Generate candidates (10x requested count for filtering)
  const candidateCount = Math.max(config.count * 20, 500);
  const candidates: { game: number[]; coOccBonus: number }[] = [];

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

    // NEW: Reject human-like patterns (dates, arithmetic sequences)
    const humanPenalty = computeHumanPatternPenalty(game);
    if (humanPenalty > 25) continue;

    // Advanced zone distribution filter
    const zoneSize = 10;
    const zoneCount = Math.ceil(rules.totalNumbers / zoneSize);
    const gamezones = new Array(zoneCount).fill(0);
    for (const n of game) gamezones[Math.min(Math.floor((n - 1) / zoneSize), zoneCount - 1)]++;
    const emptyZones = gamezones.filter(c => c === 0).length;
    if (emptyZones > Math.ceil(zoneCount * 0.4)) continue; // reject poor zone coverage

    // NEW: Reject high concentration in single zone
    const maxInZone = Math.max(...gamezones);
    if (maxInZone > rules.pick * 0.6) continue;

    // Co-occurrence bonus: prefer games with proven pairs
    let coOccBonus = 0;
    for (let i = 0; i < game.length; i++) {
      const partners = topPairSet.get(game[i]);
      if (partners) {
        for (let j = i + 1; j < game.length; j++) {
          if (partners.has(game[j])) coOccBonus++;
        }
      }
    }

    candidates.push({ game, coOccBonus });
  }

  // Sort candidates by co-occurrence bonus first, then score
  candidates.sort((a, b) => b.coOccBonus - a.coOccBonus);

  // Score and rank all candidates
  const scored = candidates.map(c =>
    scoreGame(c.game, config.lotteryId, config.stats, config.draws, config.riskProfile)
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
  intentFilters: IntentFilters,
  advancedWeights?: Map<number, number>
): { number: number; weight: number }[] {
  return stats.map(s => {
    // Start with advanced weight if available (includes co-occurrence, gap, trend, regime)
    let weight = advancedWeights?.get(s.number) ?? 1;

    // Strategy bias overlay
    if (s.status === "hot") weight += strategyFilters.hotBias * 2;
    else if (s.status === "cold") weight += strategyFilters.coldBias * 2;

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

/** Select diverse set of games — avoid too-similar combinations and global number overuse */
function selectDiverse(scored: ScoredGame[], count: number, pick: number): ScoredGame[] {
  if (scored.length <= count) return scored;

  const selected: ScoredGame[] = [scored[0]];
  const minDiff = Math.max(2, Math.floor(pick * 0.3));
  const globalFreq = new Map<number, number>();
  
  // Track global frequency of selected numbers
  for (const n of scored[0].numbers) globalFreq.set(n, 1);

  for (const game of scored.slice(1)) {
    if (selected.length >= count) break;

    // Check diversity from all selected
    const isDiverse = selected.every(sel => {
      const setA = new Set(sel.numbers);
      const overlap = game.numbers.filter(n => setA.has(n)).length;
      return pick - overlap >= minDiff;
    });

    if (!isDiverse) continue;

    // NEW: Penalize games that reuse globally overrepresented numbers
    const overuseCount = game.numbers.filter(n => (globalFreq.get(n) || 0) >= Math.ceil(count * 0.5)).length;
    if (overuseCount > pick * 0.4) continue;

    selected.push(game);
    for (const n of game.numbers) globalFreq.set(n, (globalFreq.get(n) || 0) + 1);
  }

  // Fill remaining if diversity was too strict
  if (selected.length < count) {
    for (const game of scored) {
      if (selected.length >= count) break;
      if (!selected.includes(game)) {
        selected.push(game);
        for (const n of game.numbers) globalFreq.set(n, (globalFreq.get(n) || 0) + 1);
      }
    }
  }

  return selected;
}
