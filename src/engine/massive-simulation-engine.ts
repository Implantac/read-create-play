// ═══════════════════════════════════════════════════════════════════
// MOTOR DE SIMULAÇÃO MASSIVA v3.0 — ENTERPRISE QUANTUM EDITION
// Bitset comparisons, multi-strategy generation, intelligent filtering
// Suporta milhões de combinações contra histórico completo
// ═══════════════════════════════════════════════════════════════════

import { NumberStats } from "@/features/statistics/engine";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { seedRNG, fastGenerateDraw, fastWeightedDraw, fastCountHits, fastRandom } from "./hp-math-engine";

import { 
  GenerationMode, MassiveSimJob, SimulatedGame, 
  MassiveSimProgress, MassiveSimResult, PatternInsight, 
  DistributionSummary 
} from "@/types/engine";

export type { 
  GenerationMode, MassiveSimJob, SimulatedGame, 
  MassiveSimProgress, MassiveSimResult, PatternInsight, 
  DistributionSummary 
};

// ─── Bitset Utilities ────────────────────────────────────────────

/** Convert a sorted numbers array to a Uint32 bitset (supports up to 128 numbers) */
function toBitset(numbers: number[]): Uint32Array {
  const bs = new Uint32Array(4); // 4 * 32 = 128 bits
  for (const n of numbers) {
    const idx = (n - 1) >> 5; // which Uint32
    const bit = (n - 1) & 31;
    bs[idx] |= (1 << bit);
  }
  return bs;
}

/** Count matching bits (popcount of AND) */
function bitsetIntersectionCount(a: Uint32Array, b: Uint32Array): number {
  let count = 0;
  for (let i = 0; i < 4; i++) {
    let v = a[i] & b[i];
    // Hamming weight (bit count)
    v = v - ((v >> 1) & 0x55555555);
    v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
    count += (((v + (v >> 4)) & 0x0F0F0F0F) * 0x01010101) >> 24;
  }
  return count;
}

// ─── Weight Building ─────────────────────────────────────────────

function buildWeights(stats: NumberStats[], config: LotteryConfig, mode: GenerationMode): Float32Array {
  const w = new Float32Array(config.numbers);

  if (mode === "random") {
    for (let i = 0; i < config.numbers; i++) w[i] = 1;
    return w;
  }

  for (let i = 0; i < config.numbers; i++) {
    const s = stats[i];
    if (!s) { w[i] = 1; continue; }

    if (mode === "statistical") {
      // Blend frequency + recency + cycle
      w[i] = s.percentage * 0.3 + s.recentFreq * 0.4 + s.cycleScore * 0.3;
    } else if (mode === "ai_weighted") {
      // Advanced: trend + momentum + cycle
      const trendBoost = s.trend > 0 ? 1 + s.trend * 0.5 : 1;
      const momentumBoost = s.momentum > 0 ? 1 + s.momentum * 0.3 : 1;
      const cycleBoost = s.cycleScore > 0.5 ? 1 + (s.cycleScore - 0.5) : 1;
      const recencyBoost = s.lastSeen < 5 ? 1.2 : s.lastSeen > 15 ? 0.8 : 1;
      w[i] = s.percentage * trendBoost * momentumBoost * cycleBoost * recencyBoost;
    } else {
      // hybrid: mix of all
      const base = s.percentage * 0.25 + s.recentFreq * 0.25;
      const trend = s.trend > 0 ? 1 + s.trend * 0.3 : 1;
      const cycle = 1 + s.cycleScore * 0.2;
      w[i] = base * trend * cycle;
    }

    w[i] = Math.max(0.01, w[i]);
  }

  return w;
}

// ─── Pattern Analysis ────────────────────────────────────────────

function analyzePattern(numbers: number[], maxNumber: number): {
  evenCount: number; oddCount: number; sum: number;
  consecutivePairs: number; rangeSpread: number; clusters: number;
} {
  let evenCount = 0, sum = 0, consecutivePairs = 0, clusters = 1;

  for (let i = 0; i < numbers.length; i++) {
    const n = numbers[i];
    sum += n;
    if (n % 2 === 0) evenCount++;
    if (i > 0) {
      if (numbers[i] - numbers[i - 1] === 1) {
        consecutivePairs++;
      } else if (numbers[i] - numbers[i - 1] > 3) {
        clusters++;
      }
    }
  }

  return {
    evenCount,
    oddCount: numbers.length - evenCount,
    sum,
    consecutivePairs,
    rangeSpread: numbers[numbers.length - 1] - numbers[0],
    clusters,
  };
}

// ─── Prize Thresholds ────────────────────────────────────────────

function getPrizeThreshold(config: LotteryConfig): number {
  if (config.prizeTiers && config.prizeTiers.length > 0) {
    // Return the minimum hits required for any prize
    return Math.min(...config.prizeTiers.map(t => t.hits).filter(h => h > 0));
  }
  
  // Fallback to legacy logic
  const thresholds: Record<string, number> = {
    megasena: 4, lotofacil: 11, quina: 2, lotomania: 15,
    duplasena: 3, timemania: 3, diadesorte: 4, supersete: 3,
  };
  return thresholds[config.id] ?? Math.max(2, config.pick - 3);
}

// ─── Core Simulation Engine ──────────────────────────────────────

/**
 * Run a synchronous batch of massive simulation.
 * Generates games, evaluates against ALL historical draws using bitsets.
 */
export function runMassiveSimBatch(job: MassiveSimJob): MassiveSimResult {
  const start = performance.now();
  const { config, draws, stats, totalGames, mode, topN } = job;

  if (draws.length === 0) {
    return {
      topGames: [], totalGenerated: 0, totalEvaluated: 0,
      elapsedMs: 0, opsPerSecond: 0, patternInsights: [], distributionSummary: {
        avgSum: 0, avgEvenRatio: 0, avgConsecutive: 0, avgSpread: 0, bestHitOverall: 0, avgPrizeRate: 0,
      },
    };
  }

  // Pre-compute bitsets for all historical draws
  const drawBitsets = draws.map(d => toBitset(d.numbers));
  const drawCount = draws.length;
  const prizeThreshold = getPrizeThreshold(config);

  // Build weights
  const weights = buildWeights(stats, config, mode);
  const pool = new Uint8Array(config.numbers);

  seedRNG(Date.now() | 0);

  // Min-heap to keep top N games (sorted by score descending)
  const topGames: SimulatedGame[] = [];
  let minTopScore = -Infinity;

  let totalEvaluated = 0;

  // Binary insert helper for top-N (avoids full re-sort)
  function binaryInsert(arr: SimulatedGame[], item: SimulatedGame, maxLen: number): void {
    const score = item.score;
    let lo = 0, hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (arr[mid].score > score) lo = mid + 1;
      else hi = mid;
    }
    if (lo < maxLen) {
      arr.splice(lo, 0, item);
      if (arr.length > maxLen) arr.length = maxLen;
    }
  }

  for (let g = 0; g < totalGames; g++) {
    // Generate game based on mode
    let gameNumbers: number[];
    if (mode === "random") {
      const raw = fastGenerateDraw(config.numbers, config.pick, pool);
      gameNumbers = Array.from(raw);
    } else {
      const raw = fastWeightedDraw(weights, config.pick);
      gameNumbers = Array.from(raw);
    }

    // Convert to bitset for fast comparison
    const gameBitset = toBitset(gameNumbers);

    // Use typed array for hit distribution (faster than object)
    const hitDistArr = new Uint32Array(config.pick + 1);

    let totalHits = 0;
    let bestHit = 0;
    let prizeCount = 0;
    let hitSquaredSum = 0;

    for (let d = 0; d < drawCount; d++) {
      const hits = bitsetIntersectionCount(gameBitset, drawBitsets[d]);
      hitDistArr[hits]++;
      totalHits += hits;
      hitSquaredSum += hits * hits;
      if (hits > bestHit) bestHit = hits;
      if (hits >= prizeThreshold) prizeCount++;
    }

    totalEvaluated += drawCount;

    const avgHits = totalHits / drawCount;
    const variance = (hitSquaredSum / drawCount) - (avgHits * avgHits);
    const stability = Math.sqrt(Math.max(0, variance));

    // Pattern analysis
    const pattern = analyzePattern(gameNumbers, config.numbers);

    // Composite score
    const score =
      avgHits * 30 +
      bestHit * 20 +
      (prizeCount / drawCount) * 100 * 25 +
      (1 / (1 + stability)) * 15 +
      (pattern.rangeSpread / config.numbers) * 10;

    // Keep only top N games via binary insert
    if (topGames.length < topN || score > minTopScore) {
      // Convert typed array to object only for stored games
      const hitDistribution: Record<number, number> = {};
      for (let h = 0; h <= config.pick; h++) hitDistribution[h] = hitDistArr[h];

      const game: SimulatedGame = {
        numbers: gameNumbers,
        totalHits, avgHits: Math.round(avgHits * 1000) / 1000,
        bestHit, prizeCount,
        hitDistribution,
        stability: Math.round(stability * 1000) / 1000,
        score: Math.round(score * 100) / 100,
        ...pattern,
      };

      binaryInsert(topGames, game, topN);
      minTopScore = topGames.length >= topN ? topGames[topGames.length - 1].score : -Infinity;
    }
  }

  // Final sort
  topGames.sort((a, b) => b.score - a.score);

  const elapsedMs = Math.round(performance.now() - start);

  // Generate pattern insights from top games
  const patternInsights = generatePatternInsights(topGames, config);
  const distributionSummary = computeDistributionSummary(topGames, drawCount);

  return {
    topGames,
    totalGenerated: totalGames,
    totalEvaluated,
    elapsedMs,
    opsPerSecond: Math.round(totalEvaluated / (elapsedMs / 1000)),
    patternInsights,
    distributionSummary,
  };
}

// ─── Async chunked runner ────────────────────────────────────────

export async function runMassiveSimAsync(
  job: MassiveSimJob,
  onProgress?: (p: MassiveSimProgress) => void
): Promise<MassiveSimResult> {
  const { totalGames, batchSize } = job;
  const chunks = Math.ceil(totalGames / batchSize);
  const allResults: MassiveSimResult[] = [];
  const startTime = performance.now();

  for (let c = 0; c < chunks; c++) {
    const chunkGames = Math.min(batchSize, totalGames - c * batchSize);
    const chunkJob = { ...job, totalGames: chunkGames };

    // Run synchronous batch
    const result = runMassiveSimBatch(chunkJob);
    allResults.push(result);

    // Report progress
    const gamesGenerated = Math.min((c + 1) * batchSize, totalGames);
    onProgress?.({
      gamesGenerated,
      gamesEvaluated: allResults.reduce((s, r) => s + r.totalEvaluated, 0),
      totalGames,
      elapsedMs: Math.round(performance.now() - startTime),
      opsPerSecond: result.opsPerSecond,
      phase: c === chunks - 1 ? "filtering" : "evaluating",
    });

    // Yield to UI
    await new Promise(r => setTimeout(r, 0));
  }

  // Merge all results: combine top games and re-sort
  const allTopGames = allResults
    .flatMap(r => r.topGames)
    .sort((a, b) => b.score - a.score)
    .slice(0, job.topN);

  const totalElapsed = Math.round(performance.now() - startTime);
  const totalEval = allResults.reduce((s, r) => s + r.totalEvaluated, 0);

  const patternInsights = generatePatternInsights(allTopGames, job.config);
  const distributionSummary = computeDistributionSummary(allTopGames, job.draws.length);

  onProgress?.({
    gamesGenerated: totalGames,
    gamesEvaluated: totalEval,
    totalGames,
    elapsedMs: totalElapsed,
    opsPerSecond: Math.round(totalEval / (totalElapsed / 1000)),
    phase: "done",
  });

  return {
    topGames: allTopGames,
    totalGenerated: totalGames,
    totalEvaluated: totalEval,
    elapsedMs: totalElapsed,
    opsPerSecond: Math.round(totalEval / (totalElapsed / 1000)),
    patternInsights,
    distributionSummary,
  };
}

// ─── Pattern Insights Generator ──────────────────────────────────

function generatePatternInsights(games: SimulatedGame[], config: LotteryConfig): PatternInsight[] {
  if (games.length === 0) return [];

  const insights: PatternInsight[] = [];
  const n = games.length;

  // Even/Odd ratio
  const avgEven = games.reduce((s, g) => s + g.evenCount, 0) / n;
  const evenRatio = avgEven / config.pick;
  insights.push({
    label: "Equilíbrio Par/Ímpar",
    description: `Jogos top têm em média ${avgEven.toFixed(1)} pares e ${(config.pick - avgEven).toFixed(1)} ímpares`,
    value: `${(evenRatio * 100).toFixed(0)}% / ${((1 - evenRatio) * 100).toFixed(0)}%`,
    trend: Math.abs(evenRatio - 0.5) < 0.1 ? "positive" : "neutral",
  });

  // Sum range
  const avgSum = games.reduce((s, g) => s + g.sum, 0) / n;
  const minSum = Math.min(...games.map(g => g.sum));
  const maxSum = Math.max(...games.map(g => g.sum));
  insights.push({
    label: "Soma das Dezenas",
    description: `Faixa ideal: ${minSum} a ${maxSum}`,
    value: `Média: ${avgSum.toFixed(0)}`,
    trend: "neutral",
  });

  // Consecutive pairs
  const avgConsec = games.reduce((s, g) => s + g.consecutivePairs, 0) / n;
  insights.push({
    label: "Pares Consecutivos",
    description: `Jogos eficientes têm ~${avgConsec.toFixed(1)} pares consecutivos`,
    value: avgConsec.toFixed(1),
    trend: avgConsec > 0.5 && avgConsec < 3 ? "positive" : "neutral",
  });

  // Spread
  const avgSpread = games.reduce((s, g) => s + g.rangeSpread, 0) / n;
  insights.push({
    label: "Cobertura de Faixa",
    description: `Amplitude média dos jogos top`,
    value: `${avgSpread.toFixed(0)} de ${config.numbers}`,
    trend: avgSpread / config.numbers > 0.6 ? "positive" : "negative",
  });

  // Number frequency in top games
  const numFreq = new Map<number, number>();
  for (const g of games) {
    for (const n of g.numbers) {
      numFreq.set(n, (numFreq.get(n) || 0) + 1);
    }
  }
  const topNums = [...numFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  insights.push({
    label: "Dezenas Mais Frequentes nos Top",
    description: `Números que aparecem mais nos jogos de melhor desempenho`,
    value: topNums.map(([n]) => n.toString().padStart(2, "0")).join(", "),
    trend: "positive",
  });

  // Least frequent in top
  const bottomNums = [...numFreq.entries()].sort((a, b) => a[1] - b[1]).slice(0, 5);
  insights.push({
    label: "Dezenas Raras nos Top Games",
    description: `Números que pouco aparecem nos jogos de melhor desempenho`,
    value: bottomNums.map(([n]) => n.toString().padStart(2, "0")).join(", "),
    trend: "negative",
  });

  return insights;
}

function computeDistributionSummary(games: SimulatedGame[], drawCount: number): DistributionSummary {
  if (games.length === 0) {
    return { avgSum: 0, avgEvenRatio: 0, avgConsecutive: 0, avgSpread: 0, bestHitOverall: 0, avgPrizeRate: 0 };
  }

  const n = games.length;
  return {
    avgSum: Math.round(games.reduce((s, g) => s + g.sum, 0) / n),
    avgEvenRatio: Math.round((games.reduce((s, g) => s + g.evenCount / (g.evenCount + g.oddCount), 0) / n) * 100) / 100,
    avgConsecutive: Math.round((games.reduce((s, g) => s + g.consecutivePairs, 0) / n) * 10) / 10,
    avgSpread: Math.round(games.reduce((s, g) => s + g.rangeSpread, 0) / n),
    bestHitOverall: Math.max(...games.map(g => g.bestHit)),
    avgPrizeRate: Math.round((games.reduce((s, g) => s + g.prizeCount / drawCount, 0) / n) * 10000) / 100,
  };
}
