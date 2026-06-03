/**
 * Game Quality Scoring — per-game quality metrics
 * Enhanced with frequency, delay, and gap analysis
 */

import { LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "@/features/statistics/engine";

export interface GameQuality {
  game: number[];
  strategyId: string;
  strategyName: string;
  parityBalance: number;    // 0-100 (50/50 = perfect)
  rangeBalance: number;     // 0-100 (coverage across ranges)
  sumScore: number;         // 0-100 (how close to ideal sum)
  consecutiveScore: number; // 0-100 (penalize too many consecutive)
  frequencyScore: number;   // 0-100 (hot/cold mix)
  gapScore: number;         // 0-100 (avg gap balance)
  overallScore: number;     // 0-100 composite
  grade: "S" | "A" | "B" | "C" | "D";
}

/** Combination analysis across all generated games */
export interface CombinationAnalysis {
  numberFrequency: Map<number, number>; // number -> how many games it appears in
  pairFrequency: Map<string, number>;   // "n1-n2" -> count
  hotNumbers: number[];   // top used
  coldNumbers: number[];  // least used
  coveragePercent: number;
  avgOverlap: number;     // avg shared numbers between any 2 games
}

export function scoreGame(
  game: number[],
  config: LotteryConfig,
  strategyId: string,
  strategyName: string,
  stats?: NumberStats[],
): GameQuality {
  const pick = config.pick;
  const maxNum = config.numbers;

  // Parity balance (50/50 is ideal)
  const evens = game.filter(n => n % 2 === 0).length;
  const idealEvens = pick / 2;
  const parityBalance = Math.max(0, 100 - Math.abs(evens - idealEvens) * (100 / idealEvens));

  // Range balance: divide into 4 quarters
  const quarterSize = Math.ceil(maxNum / 4);
  const quarters = [0, 0, 0, 0];
  game.forEach(n => {
    const q = Math.min(3, Math.floor((n - 1) / quarterSize));
    quarters[q]++;
  });
  const idealPerQuarter = pick / 4;
  const rangeDeviation = quarters.reduce((s, q) => s + Math.abs(q - idealPerQuarter), 0);
  const rangeBalance = Math.max(0, 100 - rangeDeviation * (100 / pick));

  // Sum score: ideal sum is roughly (maxNum + 1) * pick / 2
  const sum = game.reduce((s, n) => s + n, 0);
  const idealSum = ((maxNum + 1) * pick) / 2;
  const sumDeviation = Math.abs(sum - idealSum) / idealSum;
  const sumScore = Math.max(0, 100 - sumDeviation * 200);

  // Consecutive score: penalize clusters
  const sorted = [...game].sort((a, b) => a - b);
  let consecutivePairs = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === 1) consecutivePairs++;
  }
  const maxConsecutive = Math.max(1, Math.floor(pick * 0.3));
  const consecutiveScore = Math.max(0, 100 - (consecutivePairs / maxConsecutive) * 50);

  // Frequency score: mix of hot and cold numbers (needs stats)
  let frequencyScore = 75; // default if no stats
  if (stats && stats.length > 0) {
    const statsMap = new Map(stats.map(s => [s.number, s]));
    const hotCount = game.filter(n => statsMap.get(n)?.status === "hot").length;
    const coldCount = game.filter(n => statsMap.get(n)?.status === "cold").length;
    const idealHot = Math.round(pick * 0.6);
    const idealCold = Math.round(pick * 0.2);
    const hotDev = Math.abs(hotCount - idealHot) / Math.max(1, idealHot);
    const coldDev = Math.abs(coldCount - idealCold) / Math.max(1, idealCold);
    frequencyScore = Math.max(0, 100 - (hotDev + coldDev) * 50);
  }

  // Gap score: penalize numbers all with same delay pattern
  let gapScore = 70;
  if (stats && stats.length > 0) {
    const statsMap = new Map(stats.map(s => [s.number, s]));
    const gaps = game.map(n => statsMap.get(n)?.lastSeen ?? 0);
    if (gaps.length > 1) {
      const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
      const gapVariance = gaps.reduce((s, g) => s + (g - avgGap) ** 2, 0) / gaps.length;
      const gapStd = Math.sqrt(gapVariance);
      // Reward diversity in gaps (mix of recent and overdue)
      gapScore = Math.min(100, 50 + gapStd * 3);
    }
  }

  const overallScore = Math.min(100,
    parityBalance * 0.20 +
    rangeBalance * 0.22 +
    sumScore * 0.18 +
    consecutiveScore * 0.15 +
    frequencyScore * 0.15 +
    gapScore * 0.10
  );

  const grade: GameQuality["grade"] =
    overallScore >= 85 ? "S" :
    overallScore >= 70 ? "A" :
    overallScore >= 50 ? "B" :
    overallScore >= 30 ? "C" : "D";

  return {
    game,
    strategyId,
    strategyName,
    parityBalance,
    rangeBalance,
    sumScore,
    consecutiveScore,
    frequencyScore,
    gapScore,
    overallScore,
    grade,
  };
}

export function rankAllGames(
  generatedGames: { strategyId: string; strategyName: string; games: number[][] }[],
  config: LotteryConfig,
  stats?: NumberStats[],
): GameQuality[] {
  const all: GameQuality[] = [];
  for (const sg of generatedGames) {
    for (const game of sg.games) {
      all.push(scoreGame(game, config, sg.strategyId, sg.strategyName, stats));
    }
  }
  return all.sort((a, b) => b.overallScore - a.overallScore);
}

/** Analyze all generated games as a portfolio */
export function analyzeCombination(
  games: number[][],
  maxNum: number,
): CombinationAnalysis {
  const numberFrequency = new Map<number, number>();
  const pairFrequency = new Map<string, number>();

  for (const game of games) {
    for (const n of game) {
      numberFrequency.set(n, (numberFrequency.get(n) || 0) + 1);
    }
    // Count pairs
    for (let i = 0; i < game.length; i++) {
      for (let j = i + 1; j < game.length; j++) {
        const key = `${Math.min(game[i], game[j])}-${Math.max(game[i], game[j])}`;
        pairFrequency.set(key, (pairFrequency.get(key) || 0) + 1);
      }
    }
  }

  // Sort by frequency
  const sorted = [...numberFrequency.entries()].sort((a, b) => b[1] - a[1]);
  const hotNumbers = sorted.slice(0, 10).map(([n]) => n);
  const coldNumbers = sorted.slice(-10).map(([n]) => n).reverse();

  const coveragePercent = (numberFrequency.size / maxNum) * 100;

  // Average overlap between game pairs
  let totalOverlap = 0;
  let pairCount = 0;
  for (let i = 0; i < games.length; i++) {
    const setA = new Set(games[i]);
    for (let j = i + 1; j < games.length; j++) {
      const shared = games[j].filter(n => setA.has(n)).length;
      totalOverlap += shared;
      pairCount++;
    }
  }
  const avgOverlap = pairCount > 0 ? totalOverlap / pairCount : 0;

  return {
    numberFrequency,
    pairFrequency,
    hotNumbers,
    coldNumbers,
    coveragePercent,
    avgOverlap,
  };
}

export function exportGamesCSV(
  games: GameQuality[],
  lotteryName: string,
): string {
  const header = `Loteria,Estratégia,Jogo,Score,Nota,Paridade,Faixas,Soma,Consecutivas,Frequência,Gap`;
  const rows = games.map(g =>
    `${lotteryName},${g.strategyName},"${g.game.join(",")}",${g.overallScore.toFixed(1)},${g.grade},${g.parityBalance.toFixed(0)},${g.rangeBalance.toFixed(0)},${g.sumScore.toFixed(0)},${g.consecutiveScore.toFixed(0)},${g.frequencyScore.toFixed(0)},${g.gapScore.toFixed(0)}`
  );
  return [header, ...rows].join("\n");
}
