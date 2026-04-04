/**
 * Native AI — Simulation Engine
 * High-performance simulation with prize tier analysis and historical backtesting
 */

import { DrawResult } from "@/data/lotteries";
import { getLotteryRules } from "../knowledge/lotteriesKnowledge";
import type { SimulationResult, SimulatedGameResult, StrategyComparison } from "../core/aiTypes";

let _seed = 1;
function fastRandom(): number {
  _seed ^= _seed << 13; _seed ^= _seed >> 17; _seed ^= _seed << 5;
  return ((_seed >>> 0) / 4294967296);
}

function generateRandomDraw(total: number, pick: number): number[] {
  const nums: number[] = [];
  const used = new Set<number>();
  while (used.size < pick) {
    const n = Math.floor(fastRandom() * total) + 1;
    if (!used.has(n)) { used.add(n); nums.push(n); }
  }
  return nums;
}

export function simulateGames(
  games: number[][],
  lotteryId: string,
  iterations: number = 10000
): SimulationResult {
  const rules = getLotteryRules(lotteryId);
  _seed = Date.now() | 0;

  const gameSets = games.map(g => new Set(g));
  const gameResults: SimulatedGameResult[] = gameSets.map((gs, idx) => {
    const hitDist: Record<number, number> = {};
    let totalHits = 0, maxHits = 0, minHits = rules.pick;
    let prizeCount = 0;

    // Prize tier thresholds
    const prizeTiers = rules.prizeTiers || [];
    const minPrizeHits = prizeTiers.length > 0
      ? prizeTiers[prizeTiers.length - 1].hits
      : Math.ceil(games[idx].length * 0.6);

    // Track prize tier distribution
    const prizeDistribution: Record<number, number> = {};

    for (let i = 0; i < iterations; i++) {
      const draw = generateRandomDraw(rules.totalNumbers, rules.pick);
      const hits = draw.filter(n => gs.has(n)).length;
      totalHits += hits;
      maxHits = Math.max(maxHits, hits);
      minHits = Math.min(minHits, hits);
      hitDist[hits] = (hitDist[hits] || 0) + 1;

      if (hits >= minPrizeHits) {
        prizeCount++;
        prizeDistribution[hits] = (prizeDistribution[hits] || 0) + 1;
      }
    }

    const avgHits = totalHits / iterations;

    // Stability: lower variance = higher stability
    let variance = 0;
    for (const [h, count] of Object.entries(hitDist)) {
      variance += ((Number(h) - avgHits) ** 2) * count;
    }
    variance /= iterations;
    const stabilityScore = Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(variance) * 20)));

    // Prize rate
    const prizeRate = prizeCount / iterations;

    // Consistency score: how often does the game hit near its average
    const nearAvgCount = Object.entries(hitDist)
      .filter(([h]) => Math.abs(Number(h) - avgHits) <= 1)
      .reduce((s, [, c]) => s + c, 0);
    const consistencyScore = Math.round((nearAvgCount / iterations) * 100);

    return {
      numbers: games[idx],
      avgHits,
      maxHits,
      minHits,
      hitDistribution: hitDist,
      stabilityScore,
      prizeRate,
      consistencyScore,
      prizeDistribution,
    };
  });

  const avgHits = gameResults.reduce((s, g) => s + g.avgHits, 0) / gameResults.length;
  const bestGame = gameResults.reduce((best, g) => g.avgHits > best.avgHits ? g : best);
  const worstGame = gameResults.reduce((worst, g) => g.avgHits < worst.avgHits ? g : worst);

  // Aggregate hit distribution
  const hitDistribution: Record<number, number> = {};
  for (const gr of gameResults) {
    for (const [h, c] of Object.entries(gr.hitDistribution)) {
      hitDistribution[Number(h)] = (hitDistribution[Number(h)] || 0) + c;
    }
  }

  // Portfolio consistency: how correlated are the games
  const avgPrizeRate = gameResults.reduce((s, g) => s + (g.prizeRate || 0), 0) / gameResults.length;
  const avgStability = gameResults.reduce((s, g) => s + g.stabilityScore, 0) / gameResults.length;

  return {
    totalSimulations: iterations * games.length,
    games: gameResults.sort((a, b) => b.avgHits - a.avgHits),
    avgHits,
    hitDistribution,
    bestGame: { numbers: bestGame.numbers, avgHits: bestGame.avgHits },
    worstGame: { numbers: worstGame.numbers, avgHits: worstGame.avgHits },
    avgPrizeRate,
    avgStability,
  };
}

/** Backtest games against real historical draws */
export function backtestGames(
  games: number[][],
  draws: DrawResult[],
  lotteryId: string,
  window: number = 50
): { game: number[]; totalHits: number; prizeHits: number; avgHits: number; bestDraw: number; hitsByDraw: number[] }[] {
  const rules = getLotteryRules(lotteryId);
  const subset = draws.slice(0, Math.min(window, draws.length));
  const prizeTiers = rules.prizeTiers || [];
  const minPrizeHits = prizeTiers.length > 0
    ? prizeTiers[prizeTiers.length - 1].hits
    : Math.ceil(rules.pick * 0.6);

  return games.map(game => {
    const gameSet = new Set(game);
    let totalHits = 0;
    let prizeHits = 0;
    let bestDraw = 0;
    const hitsByDraw: number[] = [];

    for (const d of subset) {
      const hits = d.numbers.filter(n => gameSet.has(n)).length;
      totalHits += hits;
      hitsByDraw.push(hits);
      bestDraw = Math.max(bestDraw, hits);
      if (hits >= minPrizeHits) prizeHits++;
    }

    return {
      game,
      totalHits,
      prizeHits,
      avgHits: subset.length > 0 ? totalHits / subset.length : 0,
      bestDraw,
      hitsByDraw,
    };
  });
}
