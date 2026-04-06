import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";
import { getPrizeTiers } from "@/services/lotteryApi";

export interface GameEntry {
  id: number;
  numbers: number[];
  label: string;
}

export interface GameResult {
  gameId: number;
  gameNumbers: number[];
  label: string;
  results: ConcursoResult[];
  bestHits: number;
  averageHits: number;
  totalPrizes: Record<string, number>;
  score: number;
}

export interface ConcursoResult {
  concurso: number;
  date: string;
  hits: number;
  matchedNumbers: number[];
}

export interface SimulationSummary {
  totalGames: number;
  totalConcursos: number;
  totalComparisons: number;
  bestGame: GameResult | null;
  worstGame: GameResult | null;
  averageScore: number;
  prizeDistribution: Record<string, number>;
  hitsDistribution: Record<number, number>;
  insights: string[];
}

// ─── Bitset helpers (inline, zero-import) ────────────

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

/** Extract matched numbers from two bitsets */
function bitsetMatchedNumbers(a: Uint32Array, b: Uint32Array, maxNum: number): number[] {
  const matched: number[] = [];
  for (let w = 0; w < 4; w++) {
    let bits = a[w] & b[w];
    while (bits !== 0) {
      const bit = bits & (-bits); // lowest set bit
      const pos = (w << 5) + (31 - Math.clz32(bit)) + 1;
      if (pos <= maxNum) matched.push(pos);
      bits ^= bit;
    }
  }
  return matched.sort((a, b) => a - b);
}

// ─── Game generators ─────────────────────────────────

/** Fisher-Yates partial shuffle — O(pick) */
function fastRandomPick(maxNumber: number, pick: number): number[] {
  const pool = new Uint8Array(maxNumber);
  for (let i = 0; i < maxNumber; i++) pool[i] = i + 1;
  for (let i = 0; i < pick; i++) {
    const j = i + Math.floor(Math.random() * (maxNumber - i));
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  const result: number[] = [];
  for (let i = 0; i < pick; i++) result.push(pool[i]);
  return result.sort((a, b) => a - b);
}

export function generateGames(
  count: number,
  config: LotteryConfig,
  stats: NumberStats[],
  mode: "random" | "balanced" | "frequency" | "delayed" | "ai"
): GameEntry[] {
  const games: GameEntry[] = [];
  const seen = new Set<string>();
  const modeLabels: Record<string, string> = {
    random: "Aleatório", balanced: "Equilibrado",
    frequency: "Frequência", delayed: "Atrasados", ai: "IA",
  };

  let attempts = 0;
  const maxAttempts = count * 10;

  while (games.length < count && attempts < maxAttempts) {
    attempts++;
    let numbers: number[];
    switch (mode) {
      case "balanced": numbers = generateBalanced(config, stats); break;
      case "frequency": numbers = generateByFrequency(config, stats); break;
      case "delayed": numbers = generateByDelay(config, stats); break;
      case "ai": numbers = generateAI(config, stats); break;
      default: numbers = fastRandomPick(config.numbers, config.pick);
    }
    const sorted = numbers.sort((a, b) => a - b);
    const key = sorted.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    games.push({ id: games.length + 1, numbers: sorted, label: `${modeLabels[mode]} #${games.length + 1}` });
  }
  return games;
}

function generateBalanced(config: LotteryConfig, stats: NumberStats[]): number[] {
  const evens = stats.filter(s => s.number % 2 === 0 && s.number <= config.numbers);
  const odds = stats.filter(s => s.number % 2 !== 0 && s.number <= config.numbers);
  const halfEven = Math.floor(config.pick / 2);
  const halfOdd = config.pick - halfEven;
  const shuffled = (arr: NumberStats[]) => [...arr].sort(() => Math.random() - 0.5);
  const picked: number[] = [];
  shuffled(evens).slice(0, halfEven).forEach(s => picked.push(s.number));
  shuffled(odds).slice(0, halfOdd).forEach(s => picked.push(s.number));
  while (picked.length < config.pick) {
    const n = Math.floor(Math.random() * config.numbers) + 1;
    if (!picked.includes(n)) picked.push(n);
  }
  return picked.slice(0, config.pick);
}

function generateByFrequency(config: LotteryConfig, stats: NumberStats[]): number[] {
  const sorted = [...stats].filter(s => s.number >= 1 && s.number <= config.numbers).sort((a, b) => b.frequency - a.frequency);
  const pool = sorted.slice(0, Math.ceil(sorted.length * 0.6));
  return pool.sort(() => Math.random() - 0.5).slice(0, config.pick).map(s => s.number);
}

function generateByDelay(config: LotteryConfig, stats: NumberStats[]): number[] {
  const sorted = [...stats].filter(s => s.number >= 1 && s.number <= config.numbers).sort((a, b) => b.lastSeen - a.lastSeen);
  const pool = sorted.slice(0, Math.ceil(sorted.length * 0.5));
  return pool.sort(() => Math.random() - 0.5).slice(0, config.pick).map(s => s.number);
}

function generateAI(config: LotteryConfig, stats: NumberStats[]): number[] {
  const validStats = stats.filter(s => s.number >= 1 && s.number <= config.numbers);
  const weights = validStats.map(s => ({
    number: s.number,
    weight: s.frequency * 0.3 + s.lastSeen * 0.2 + Math.max(0, s.trend) * 0.25 + s.cycleScore * 0.25 + Math.random() * 2,
  }));
  weights.sort((a, b) => b.weight - a.weight);
  return weights.slice(0, config.pick).map(w => w.number);
}

// ─── Core simulation — bitset-optimized ─────────────

export function runHistoricalSimulation(
  games: GameEntry[],
  draws: DrawResult[],
  config: LotteryConfig,
  concursoLimit: number | "all"
): { results: GameResult[]; summary: SimulationSummary } {
  const prizeTiers = getPrizeTiers(config.id);
  const selectedDraws = concursoLimit === "all" ? draws : draws.slice(0, concursoLimit);
  const drawCount = selectedDraws.length;

  // Pre-compute ALL draw bitsets once
  const drawBitsets = new Array<Uint32Array>(drawCount);
  for (let i = 0; i < drawCount; i++) {
    drawBitsets[i] = toBitset(selectedDraws[i].numbers);
  }

  // Determine minimum hits threshold for storing detailed results
  const minDetailThreshold = Math.max(1, Math.min(...prizeTiers.map(p => p.hits)) - 2);

  const results: GameResult[] = games.map(game => {
    const gameBs = toBitset(game.numbers);
    const concursoResults: ConcursoResult[] = [];
    const prizeCount: Record<string, number> = {};
    prizeTiers.forEach(p => { prizeCount[p.label] = 0; });

    let totalHits = 0;
    let bestHits = 0;

    for (let d = 0; d < drawCount; d++) {
      const hits = bitsetHits(gameBs, drawBitsets[d]);
      totalHits += hits;
      if (hits > bestHits) bestHits = hits;

      // Only extract matched numbers for significant hits
      if (hits >= minDetailThreshold) {
        const matched = bitsetMatchedNumbers(gameBs, drawBitsets[d], config.numbers);
        concursoResults.push({
          concurso: selectedDraws[d].concurso,
          date: selectedDraws[d].date,
          hits,
          matchedNumbers: matched,
        });
      }

      for (const tier of prizeTiers) {
        if (hits >= tier.hits) {
          prizeCount[tier.label] = (prizeCount[tier.label] || 0) + 1;
        }
      }
    }

    const avg = drawCount > 0 ? totalHits / drawCount : 0;
    const maxPossible = config.pick;
    const bestNorm = (bestHits / maxPossible) * 40;
    const avgNorm = (avg / maxPossible) * 30;
    const prizeNorm = Object.values(prizeCount).reduce((s, v) => s + v, 0) * 5;
    const score = Math.min(100, Math.round(bestNorm + avgNorm + prizeNorm));

    return {
      gameId: game.id,
      gameNumbers: game.numbers,
      label: game.label,
      results: concursoResults.sort((a, b) => b.hits - a.hits),
      bestHits,
      averageHits: parseFloat(avg.toFixed(2)),
      totalPrizes: prizeCount,
      score,
    };
  });

  results.sort((a, b) => b.score - a.score);

  // Build summary
  const hitsDistribution: Record<number, number> = {};
  const totalPrizeDistribution: Record<string, number> = {};
  prizeTiers.forEach(p => { totalPrizeDistribution[p.label] = 0; });

  results.forEach(r => {
    r.results.forEach(cr => {
      hitsDistribution[cr.hits] = (hitsDistribution[cr.hits] || 0) + 1;
    });
    Object.entries(r.totalPrizes).forEach(([k, v]) => {
      totalPrizeDistribution[k] = (totalPrizeDistribution[k] || 0) + v;
    });
  });

  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;

  const insights: string[] = [];
  if (results.length > 0) {
    const best = results[0];
    insights.push(`🏆 Melhor jogo: "${best.label}" com score ${best.score}/100 e máximo de ${best.bestHits} acertos`);
    insights.push(`📊 Média geral de acertos: ${(results.reduce((s, r) => s + r.averageHits, 0) / results.length).toFixed(2)}`);
    const topPrize = Object.entries(totalPrizeDistribution).find(([, v]) => v > 0);
    if (topPrize) insights.push(`🎯 ${topPrize[1]}x premiações na faixa "${topPrize[0]}"`);
    const bestNums = best.gameNumbers;
    const evens = bestNums.filter(n => n % 2 === 0).length;
    insights.push(`⚖️ Melhor jogo: ${evens} pares / ${bestNums.length - evens} ímpares`);
    insights.push(`🔢 Soma do melhor jogo: ${bestNums.reduce((s, n) => s + n, 0)}`);
  }

  return {
    results,
    summary: {
      totalGames: games.length,
      totalConcursos: drawCount,
      totalComparisons: games.length * drawCount,
      bestGame: results[0] || null,
      worstGame: results[results.length - 1] || null,
      averageScore: avgScore,
      prizeDistribution: totalPrizeDistribution,
      hitsDistribution,
      insights,
    },
  };
}
