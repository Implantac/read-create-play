import { NumberStats } from "@/engine/stats/statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { generateByStrategy, Strategy, STRATEGIES } from "@/engine/strategies";

// ═══════════════════════════════════════════════════════
// Simulador Massivo de Monte Carlo
// Suporta milhões de iterações com batching assíncrono
// ═══════════════════════════════════════════════════════

export interface MassiveSimConfig {
  iterations: number;
  strategies: Strategy[];
  config: LotteryConfig;
  compareWithRandom: boolean;
}

export interface StrategyPerformance {
  strategy: Strategy;
  label: string;
  totalGames: number;
  hitDistribution: Record<number, number>; // hits -> count
  avgHits: number;
  bestHit: number;
  hitRate4Plus: number; // % of games with 4+ hits
  hitRate5Plus: number;
  hitRateFull: number; // % of games with all hits
  expectedValue: number; // estimated monetary return ratio
  consistency: number; // 0-1, lower variance = higher
}

export interface MassiveSimResult {
  totalIterations: number;
  elapsedMs: number;
  performances: StrategyPerformance[];
  convergenceData: { iteration: number; avgHits: number; strategy: string }[];
  yearlyProjection: YearlyProjection[];
}

export interface YearlyProjection {
  strategy: string;
  gamesPerYear: number;
  expectedHits4Plus: number;
  expectedHits5Plus: number;
  expectedFullHits: number;
  roi: number; // return on investment ratio
}

/**
 * Generate a random draw based on config
 */
function generateRandomDraw(config: LotteryConfig): number[] {
  const nums: number[] = [];
  while (nums.length < config.pick) {
    const n = Math.floor(Math.random() * config.numbers) + 1;
    if (!nums.includes(n)) nums.push(n);
  }
  return nums.sort((a, b) => a - b);
}

/**
 * Count hits between a bet and a draw
 */
function countHits(bet: number[], draw: number[]): number {
  let hits = 0;
  const drawSet = new Set(draw);
  for (const n of bet) {
    if (drawSet.has(n)) hits++;
  }
  return hits;
}

/**
 * Prize multipliers by lottery type (approximate relative to bet cost)
 */
function getPrizeMultipliers(lotteryId: string, pick: number): Record<number, number> {
  const base: Record<number, number> = {};
  for (let i = 0; i <= pick; i++) base[i] = 0;

  switch (lotteryId) {
    case "megasena":
      base[4] = 50; base[5] = 5000; base[6] = 500000;
      break;
    case "lotofacil":
      base[11] = 5; base[12] = 10; base[13] = 25; base[14] = 1500; base[15] = 100000;
      break;
    case "quina":
      base[2] = 1; base[3] = 5; base[4] = 200; base[5] = 50000;
      break;
    case "lotomania":
      base[0] = 5; base[15] = 10; base[16] = 25; base[17] = 100;
      base[18] = 1000; base[19] = 20000; base[20] = 500000;
      break;
    case "duplasena":
      base[3] = 3; base[4] = 50; base[5] = 5000; base[6] = 300000;
      break;
    case "timemania":
      base[3] = 2; base[4] = 10; base[5] = 50; base[6] = 500; base[7] = 50000;
      break;
    case "diadesorte":
      base[4] = 10; base[5] = 50; base[6] = 2000; base[7] = 200000;
      break;
    case "supersete":
      base[3] = 5; base[4] = 20; base[5] = 200; base[6] = 10000; base[7] = 500000;
      break;
    default:
      base[pick - 2] = 10; base[pick - 1] = 1000; base[pick] = 100000;
  }
  return base;
}

/**
 * Run massive simulation in a synchronous batch
 * For very large iterations, call this in chunks via setTimeout
 */
export function runMassiveBatch(
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[],
  strategy: Strategy,
  iterations: number
): { hitDist: Record<number, number>; totalHits: number; bestHit: number; convergence: number[] } {
  const hitDist: Record<number, number> = {};
  for (let i = 0; i <= config.pick; i++) hitDist[i] = 0;

  let totalHits = 0;
  let bestHit = 0;
  const convergence: number[] = [];
  const sampleInterval = Math.max(1, Math.floor(iterations / 50));

  for (let i = 0; i < iterations; i++) {
    // Generate bet using strategy
    const bet = strategy === "smart" || strategy === "hot" || strategy === "cold" || strategy === "balanced"
      || strategy === "fibonacci" || strategy === "primes" || strategy === "golden"
      || strategy === "pattern" || strategy === "lowDelay" || strategy === "sectors"
      || strategy === "trend" || strategy === "cycle" || strategy === "hybrid" || strategy === "ml"
      ? generateByStrategy(strategy, stats, config)
      : generateByStrategy("smart", stats, config);

    // Generate random draw to test against
    const draw = draws.length > 0
      ? draws[Math.floor(Math.random() * draws.length)].numbers
      : generateRandomDraw(config);

    const hits = countHits(bet, draw);
    hitDist[hits] = (hitDist[hits] || 0) + 1;
    totalHits += hits;
    if (hits > bestHit) bestHit = hits;

    if ((i + 1) % sampleInterval === 0) {
      convergence.push(totalHits / (i + 1));
    }
  }

  return { hitDist, totalHits, bestHit, convergence };
}

/**
 * Full massive simulation across multiple strategies
 */
export function runMassiveSimulation(
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[],
  simConfig: MassiveSimConfig
): MassiveSimResult {
  const start = performance.now();
  const prizeMultipliers = getPrizeMultipliers(config.id, config.pick);

  const performances: StrategyPerformance[] = [];
  const convergenceData: { iteration: number; avgHits: number; strategy: string }[] = [];

  const strategiesToRun = simConfig.compareWithRandom
    ? [...simConfig.strategies, "smart" as Strategy]
    : simConfig.strategies;

  // Deduplicate
  const uniqueStrategies = [...new Set(strategiesToRun)];

  for (const strategy of uniqueStrategies) {
    const iterPerStrategy = Math.floor(simConfig.iterations / uniqueStrategies.length);
    const batch = runMassiveBatch(stats, config, draws, strategy, iterPerStrategy);

    const stratInfo = STRATEGIES.find(s => s.id === strategy);
    const label = stratInfo?.label || strategy;

    // Convergence data
    const sampleInterval = Math.max(1, Math.floor(iterPerStrategy / 50));
    batch.convergence.forEach((avg, idx) => {
      convergenceData.push({
        iteration: (idx + 1) * sampleInterval,
        avgHits: Math.round(avg * 1000) / 1000,
        strategy: label,
      });
    });

    // Compute metrics
    const avgHits = batch.totalHits / iterPerStrategy;
    const hitRate4Plus = Object.entries(batch.hitDist)
      .filter(([h]) => Number(h) >= 4)
      .reduce((s, [, c]) => s + c, 0) / iterPerStrategy;
    const hitRate5Plus = Object.entries(batch.hitDist)
      .filter(([h]) => Number(h) >= 5)
      .reduce((s, [, c]) => s + c, 0) / iterPerStrategy;
    const hitRateFull = (batch.hitDist[config.pick] || 0) / iterPerStrategy;

    // Expected value
    let ev = 0;
    for (const [hits, count] of Object.entries(batch.hitDist)) {
      ev += (prizeMultipliers[Number(hits)] || 0) * count;
    }
    ev /= iterPerStrategy;

    // Consistency (inverse of coefficient of variation of hits)
    const hitValues = Object.entries(batch.hitDist).flatMap(([h, c]) =>
      Array(c).fill(Number(h))
    );
    const mean = avgHits;
    const variance = hitValues.reduce((s, v) => s + (v - mean) ** 2, 0) / hitValues.length;
    const stdDev = Math.sqrt(variance);
    const consistency = mean > 0 ? Math.max(0, 1 - stdDev / mean) : 0;

    performances.push({
      strategy,
      label,
      totalGames: iterPerStrategy,
      hitDistribution: batch.hitDist,
      avgHits: Math.round(avgHits * 1000) / 1000,
      bestHit: batch.bestHit,
      hitRate4Plus: Math.round(hitRate4Plus * 10000) / 100,
      hitRate5Plus: Math.round(hitRate5Plus * 10000) / 100,
      hitRateFull: Math.round(hitRateFull * 1000000) / 10000,
      expectedValue: Math.round(ev * 100) / 100,
      consistency: Math.round(consistency * 1000) / 1000,
    });
  }

  // Sort by expected value
  performances.sort((a, b) => b.expectedValue - a.expectedValue);

  // Yearly projections (assuming 3 games per week = 156/year)
  const gamesPerYear = 156;
  const yearlyProjection: YearlyProjection[] = performances.map(p => ({
    strategy: p.label,
    gamesPerYear,
    expectedHits4Plus: Math.round(p.hitRate4Plus / 100 * gamesPerYear * 10) / 10,
    expectedHits5Plus: Math.round(p.hitRate5Plus / 100 * gamesPerYear * 10) / 10,
    expectedFullHits: Math.round(p.hitRateFull / 100 * gamesPerYear * 10000) / 10000,
    roi: Math.round(p.expectedValue * 100) / 100,
  }));

  return {
    totalIterations: simConfig.iterations,
    elapsedMs: Math.round(performance.now() - start),
    performances,
    convergenceData,
    yearlyProjection,
  };
}
