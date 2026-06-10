import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "@/engine/stats/statistics";
import { getPrizeTiers } from "@/services/api/lottery";;

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

/** Generate games using different strategies */
export function generateGames(
  count: number,
  config: LotteryConfig,
  stats: NumberStats[],
  mode: "random" | "balanced" | "frequency" | "delayed" | "ai"
): GameEntry[] {
  const games: GameEntry[] = [];
  const seen = new Set<string>();
  const modeLabels: Record<string, string> = {
    random: "Aleatório",
    balanced: "Equilibrado",
    frequency: "Frequência",
    delayed: "Atrasados",
    ai: "IA",
  };

  let attempts = 0;
  const maxAttempts = count * 10;

  while (games.length < count && attempts < maxAttempts) {
    attempts++;
    let numbers: number[];
    switch (mode) {
      case "balanced":
        numbers = generateBalanced(config, stats);
        break;
      case "frequency":
        numbers = generateByFrequency(config, stats);
        break;
      case "delayed":
        numbers = generateByDelay(config, stats);
        break;
      case "ai":
        numbers = generateAI(config, stats);
        break;
      default:
        numbers = generateRandom(config);
    }
    const sorted = numbers.sort((a, b) => a - b);
    const key = sorted.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    games.push({
      id: games.length + 1,
      numbers: sorted,
      label: `${modeLabels[mode]} #${games.length + 1}`,
    });
  }
  return games;
}

function generateRandom(config: LotteryConfig): number[] {
  const nums: number[] = [];
  while (nums.length < config.pick) {
    const n = Math.floor(Math.random() * config.numbers) + 1;
    if (!nums.includes(n)) nums.push(n);
  }
  return nums;
}

function generateBalanced(config: LotteryConfig, stats: NumberStats[]): number[] {
  // Half even, half odd, spread across ranges
  const evens = stats.filter(s => s.number % 2 === 0 && s.number <= config.numbers);
  const odds = stats.filter(s => s.number % 2 !== 0 && s.number <= config.numbers);
  const halfEven = Math.floor(config.pick / 2);
  const halfOdd = config.pick - halfEven;

  const picked: number[] = [];
  const shuffled = (arr: NumberStats[]) => [...arr].sort(() => Math.random() - 0.5);

  shuffled(evens).slice(0, halfEven).forEach(s => picked.push(s.number));
  shuffled(odds).slice(0, halfOdd).forEach(s => picked.push(s.number));

  // Fill remaining if needed
  while (picked.length < config.pick) {
    const n = Math.floor(Math.random() * config.numbers) + 1;
    if (!picked.includes(n)) picked.push(n);
  }
  return picked.slice(0, config.pick);
}

function generateByFrequency(config: LotteryConfig, stats: NumberStats[]): number[] {
  const sorted = [...stats]
    .filter(s => s.number >= 1 && s.number <= config.numbers)
    .sort((a, b) => b.frequency - a.frequency);
  // Pick from top 60% with some randomness
  const pool = sorted.slice(0, Math.ceil(sorted.length * 0.6));
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, config.pick).map(s => s.number);
}

function generateByDelay(config: LotteryConfig, stats: NumberStats[]): number[] {
  const sorted = [...stats]
    .filter(s => s.number >= 1 && s.number <= config.numbers)
    .sort((a, b) => b.lastSeen - a.lastSeen);
  const pool = sorted.slice(0, Math.ceil(sorted.length * 0.5));
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, config.pick).map(s => s.number);
}

function generateAI(config: LotteryConfig, stats: NumberStats[]): number[] {
  // Weighted selection combining frequency, delay, trend, and cycle score
  const validStats = stats.filter(s => s.number >= 1 && s.number <= config.numbers);
  const weights = validStats.map(s => {
    const freqW = s.frequency * 0.3;
    const delayW = s.lastSeen * 0.2;
    const trendW = Math.max(0, s.trend) * 0.25;
    const cycleW = s.cycleScore * 0.25;
    return { number: s.number, weight: freqW + delayW + trendW + cycleW + Math.random() * 2 };
  });
  weights.sort((a, b) => b.weight - a.weight);
  return weights.slice(0, config.pick).map(w => w.number);
}

/** Run simulation: compare games against historical draws */
export function runHistoricalSimulation(
  games: GameEntry[],
  draws: DrawResult[],
  config: LotteryConfig,
  concursoLimit: number | "all"
): { results: GameResult[]; summary: SimulationSummary } {
  const prizeTiers = getPrizeTiers(config.id);
  const selectedDraws = concursoLimit === "all" ? draws : draws.slice(0, concursoLimit);

  const results: GameResult[] = games.map(game => {
    const concursoResults: ConcursoResult[] = [];
    const prizeCount: Record<string, number> = {};
    prizeTiers.forEach(p => { prizeCount[p.label] = 0; });

    let totalHits = 0;
    let bestHits = 0;

    for (const draw of selectedDraws) {
      const matched = game.numbers.filter(n => draw.numbers.includes(n));
      const hits = matched.length;
      totalHits += hits;
      if (hits > bestHits) bestHits = hits;

      concursoResults.push({
        concurso: draw.concurso,
        date: draw.date,
        hits,
        matchedNumbers: matched,
      });

      // Check prize tiers
      for (const tier of prizeTiers) {
        if (hits >= tier.hits) {
          prizeCount[tier.label] = (prizeCount[tier.label] || 0) + 1;
        }
      }
    }

    const avg = selectedDraws.length > 0 ? totalHits / selectedDraws.length : 0;

    // Score: weighted combination of best hits, average, and prizes
    const maxPossible = config.pick;
    const bestNorm = (bestHits / maxPossible) * 40;
    const avgNorm = (avg / maxPossible) * 30;
    const prizeNorm = Object.values(prizeCount).reduce((s, v) => s + v, 0) * 5;
    const score = Math.min(100, Math.round(bestNorm + avgNorm + prizeNorm));

    return {
      gameId: game.id,
      gameNumbers: game.numbers,
      label: game.label,
      results: concursoResults,
      bestHits,
      averageHits: parseFloat(avg.toFixed(2)),
      totalPrizes: prizeCount,
      score,
    };
  });

  // Sort by score descending
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

  // Generate insights
  const insights: string[] = [];
  if (results.length > 0) {
    const best = results[0];
    insights.push(`🏆 Melhor jogo: "${best.label}" com score ${best.score}/100 e máximo de ${best.bestHits} acertos`);
    insights.push(`📊 Média geral de acertos: ${(results.reduce((s, r) => s + r.averageHits, 0) / results.length).toFixed(2)}`);

    const topPrize = Object.entries(totalPrizeDistribution).find(([, v]) => v > 0);
    if (topPrize) {
      insights.push(`🎯 ${topPrize[1]}x premiações na faixa "${topPrize[0]}"`);
    }

    // Check balance
    const bestNums = best.gameNumbers;
    const evens = bestNums.filter(n => n % 2 === 0).length;
    const odds = bestNums.length - evens;
    insights.push(`⚖️ Melhor jogo: ${evens} pares / ${odds} ímpares`);

    const sum = bestNums.reduce((s, n) => s + n, 0);
    insights.push(`🔢 Soma do melhor jogo: ${sum}`);
  }

  return {
    results,
    summary: {
      totalGames: games.length,
      totalConcursos: selectedDraws.length,
      totalComparisons: games.length * selectedDraws.length,
      bestGame: results[0] || null,
      worstGame: results[results.length - 1] || null,
      averageScore: avgScore,
      prizeDistribution: totalPrizeDistribution,
      hitsDistribution,
      insights,
    },
  };
}
