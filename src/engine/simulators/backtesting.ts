import { NumberStats } from "@/engine/stats/statistics";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { generateByStrategy, Strategy, STRATEGIES } from "@/engine/strategies";

// ═══════════════════════════════════════════════════════
// Motor de Backtesting Automático
// Testa estratégias contra resultados históricos reais
// ═══════════════════════════════════════════════════════

export interface BacktestResult {
  strategy: Strategy;
  label: string;
  totalTests: number;
  hitDistribution: Record<number, number>;
  avgHits: number;
  bestHit: number;
  winRate: number; // % with minimum prize hits
  profit: number; // estimated ROI
  consistency: number; // 0-1
  streaks: { bestWin: number; worstLoss: number };
}

export interface BacktestConfig {
  strategies: Strategy[];
  testWindow: number; // how many recent draws to test
  betsPerDraw: number; // bets generated per draw
  minPrizeHits: number; // minimum hits to count as "win"
}

export function runBacktest(
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[],
  btConfig: BacktestConfig
): BacktestResult[] {
  const sorted = [...draws].sort((a, b) => b.concurso - a.concurso);
  const testDraws = sorted.slice(0, btConfig.testWindow);

  // We need historical stats at each point - simplified: use current stats
  // In production this would recalculate stats at each historical point

  const results: BacktestResult[] = [];

  for (const strategy of btConfig.strategies) {
    const stratInfo = STRATEGIES.find(s => s.id === strategy);
    const hitDist: Record<number, number> = {};
    for (let i = 0; i <= config.pick; i++) hitDist[i] = 0;

    let totalHits = 0;
    let bestHit = 0;
    let wins = 0;
    let currentStreak = 0;
    let bestWinStreak = 0;
    let currentLossStreak = 0;
    let worstLossStreak = 0;

    const totalTests = testDraws.length * btConfig.betsPerDraw;

    for (const draw of testDraws) {
      for (let b = 0; b < btConfig.betsPerDraw; b++) {
        const bet = generateByStrategy(strategy, stats, config);
        const drawSet = new Set(draw.numbers);
        const hits = bet.filter(n => drawSet.has(n)).length;

        hitDist[hits] = (hitDist[hits] || 0) + 1;
        totalHits += hits;
        if (hits > bestHit) bestHit = hits;

        if (hits >= btConfig.minPrizeHits) {
          wins++;
          currentStreak++;
          if (currentStreak > bestWinStreak) bestWinStreak = currentStreak;
          currentLossStreak = 0;
        } else {
          currentLossStreak++;
          if (currentLossStreak > worstLossStreak) worstLossStreak = currentLossStreak;
          currentStreak = 0;
        }
      }
    }

    const avgHits = totalHits / totalTests;
    const winRate = (wins / totalTests) * 100;

    // Consistency: inverse coefficient of variation
    const hitValues = Object.entries(hitDist).flatMap(([h, c]) => Array(c).fill(Number(h)));
    const variance = hitValues.reduce((s, v) => s + (v - avgHits) ** 2, 0) / hitValues.length;
    const consistency = avgHits > 0 ? Math.max(0, 1 - Math.sqrt(variance) / avgHits) : 0;

    // Prize weights per lottery
    const prizeWeights: Record<number, number> = {};
    const prizeMap: Record<string, Record<number, number>> = {
      megasena: { 4: 50, 5: 5000, 6: 500000 },
      lotofacil: { 11: 5, 12: 10, 13: 25, 14: 1500, 15: 100000 },
      quina: { 2: 1, 3: 5, 4: 200, 5: 50000 },
      lotomania: { 0: 5, 15: 10, 16: 25, 17: 100, 18: 1000, 19: 20000, 20: 500000 },
      duplasena: { 3: 3, 4: 50, 5: 5000, 6: 300000 },
      timemania: { 3: 2, 4: 10, 5: 50, 6: 500, 7: 50000 },
      diadesorte: { 4: 10, 5: 50, 6: 2000, 7: 200000 },
      supersete: { 3: 5, 4: 20, 5: 200, 6: 10000, 7: 500000 },
    };
    const lotteryPrizes = prizeMap[config.id] || { [config.pick - 2]: 50, [config.pick - 1]: 5000, [config.pick]: 500000 };
    Object.assign(prizeWeights, lotteryPrizes);

    let totalPrize = 0;
    for (const [hits, count] of Object.entries(hitDist)) {
      totalPrize += (prizeWeights[Number(hits)] || 0) * count;
    }
    const profit = totalTests > 0 ? totalPrize / totalTests : 0;

    results.push({
      strategy,
      label: stratInfo?.label || strategy,
      totalTests,
      hitDistribution: hitDist,
      avgHits: Math.round(avgHits * 1000) / 1000,
      bestHit,
      winRate: Math.round(winRate * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      consistency: Math.round(consistency * 1000) / 1000,
      streaks: { bestWin: bestWinStreak, worstLoss: worstLossStreak },
    });
  }

  return results.sort((a, b) => b.winRate - a.winRate);
}
