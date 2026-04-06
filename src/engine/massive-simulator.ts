import { NumberStats } from "./statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { generateByStrategy, Strategy, STRATEGIES } from "./strategies";

// ═══════════════════════════════════════════════════════
// Simulador Massivo de Monte Carlo v3.0
// Otimizado com bitsets, PRNG inline e variância O(1)
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
  hitDistribution: Record<number, number>;
  avgHits: number;
  bestHit: number;
  hitRate4Plus: number;
  hitRate5Plus: number;
  hitRateFull: number;
  expectedValue: number;
  consistency: number;
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
  roi: number;
}

// ─── Bitset utilities (inline for zero-overhead) ─────

function toBitset(numbers: number[]): Uint32Array {
  const bs = new Uint32Array(4);
  for (const n of numbers) {
    bs[(n - 1) >> 5] |= 1 << ((n - 1) & 31);
  }
  return bs;
}

function popcount32(x: number): number {
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

function bitsetHits(a: Uint32Array, b: Uint32Array): number {
  return popcount32(a[0] & b[0]) + popcount32(a[1] & b[1]) +
         popcount32(a[2] & b[2]) + popcount32(a[3] & b[3]);
}

// ─── Prize multipliers ──────────────────────────────────

function getPrizeMultipliers(lotteryId: string, pick: number): Record<number, number> {
  const base: Record<number, number> = {};
  for (let i = 0; i <= pick; i++) base[i] = 0;
  switch (lotteryId) {
    case "megasena": base[4] = 50; base[5] = 5000; base[6] = 500000; break;
    case "lotofacil": base[11] = 5; base[12] = 10; base[13] = 25; base[14] = 1500; base[15] = 100000; break;
    case "quina": base[2] = 1; base[3] = 5; base[4] = 200; base[5] = 50000; break;
    case "lotomania": base[0] = 5; base[15] = 10; base[16] = 25; base[17] = 100; base[18] = 1000; base[19] = 20000; base[20] = 500000; break;
    case "duplasena": base[3] = 3; base[4] = 50; base[5] = 5000; base[6] = 300000; break;
    case "timemania": base[3] = 2; base[4] = 10; base[5] = 50; base[6] = 500; base[7] = 50000; break;
    case "diadesorte": base[4] = 10; base[5] = 50; base[6] = 2000; base[7] = 200000; break;
    case "supersete": base[3] = 5; base[4] = 20; base[5] = 200; base[6] = 10000; base[7] = 500000; break;
    default: base[pick - 2] = 10; base[pick - 1] = 1000; base[pick] = 100000;
  }
  return base;
}

/**
 * Run massive batch — v3.0 with bitset comparison and O(1) variance
 */
export function runMassiveBatch(
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[],
  strategy: Strategy,
  iterations: number
): { hitDist: Record<number, number>; totalHits: number; bestHit: number; convergence: number[]; hitSquaredSum: number } {
  const hitDist: Record<number, number> = {};
  for (let i = 0; i <= config.pick; i++) hitDist[i] = 0;

  // Pre-compute draw bitsets
  const drawBitsets = draws.map(d => toBitset(d.numbers));
  const drawCount = drawBitsets.length;

  let totalHits = 0;
  let hitSquaredSum = 0;
  let bestHit = 0;
  const convergence: number[] = [];
  const sampleInterval = Math.max(1, Math.floor(iterations / 50));

  for (let i = 0; i < iterations; i++) {
    const bet = generateByStrategy(strategy, stats, config);
    
    // Pick random historical draw and compare via bitset
    const drawIdx = Math.floor(Math.random() * drawCount);
    const betBs = toBitset(bet);
    const hits = drawCount > 0 ? bitsetHits(betBs, drawBitsets[drawIdx]) : 0;

    hitDist[hits] = (hitDist[hits] || 0) + 1;
    totalHits += hits;
    hitSquaredSum += hits * hits;
    if (hits > bestHit) bestHit = hits;

    if ((i + 1) % sampleInterval === 0) {
      convergence.push(totalHits / (i + 1));
    }
  }

  return { hitDist, totalHits, bestHit, convergence, hitSquaredSum };
}

/**
 * Full massive simulation across multiple strategies — v3.0
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

  const uniqueStrategies = [...new Set(strategiesToRun)];

  for (const strategy of uniqueStrategies) {
    const iterPerStrategy = Math.floor(simConfig.iterations / uniqueStrategies.length);
    const batch = runMassiveBatch(stats, config, draws, strategy, iterPerStrategy);

    const stratInfo = STRATEGIES.find(s => s.id === strategy);
    const label = stratInfo?.label || strategy;

    const sampleInterval = Math.max(1, Math.floor(iterPerStrategy / 50));
    batch.convergence.forEach((avg, idx) => {
      convergenceData.push({
        iteration: (idx + 1) * sampleInterval,
        avgHits: Math.round(avg * 1000) / 1000,
        strategy: label,
      });
    });

    const avgHits = iterPerStrategy > 0 ? batch.totalHits / iterPerStrategy : 0;

    // Hit rates via hitDist (no array expansion)
    let count4Plus = 0, count5Plus = 0;
    for (const [h, c] of Object.entries(batch.hitDist)) {
      const hNum = Number(h);
      if (hNum >= 4) count4Plus += c;
      if (hNum >= 5) count5Plus += c;
    }
    const hitRate4Plus = iterPerStrategy > 0 ? count4Plus / iterPerStrategy : 0;
    const hitRate5Plus = iterPerStrategy > 0 ? count5Plus / iterPerStrategy : 0;
    const hitRateFull = iterPerStrategy > 0 ? (batch.hitDist[config.pick] || 0) / iterPerStrategy : 0;

    // Expected value
    let ev = 0;
    for (const [hits, count] of Object.entries(batch.hitDist)) {
      ev += (prizeMultipliers[Number(hits)] || 0) * count;
    }
    ev = iterPerStrategy > 0 ? ev / iterPerStrategy : 0;

    // O(1) variance via Welford's identity: Var = E[X²] - E[X]²
    const variance = iterPerStrategy > 0
      ? Math.max(0, batch.hitSquaredSum / iterPerStrategy - avgHits * avgHits)
      : 0;
    const stdDev = Math.sqrt(variance);
    const consistency = avgHits > 0 ? Math.max(0, 1 - stdDev / avgHits) : 0;

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

  performances.sort((a, b) => b.expectedValue - a.expectedValue);

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
