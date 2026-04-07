/**
 * Game Quality Scoring — per-game quality metrics
 */

import { LotteryConfig } from "@/data/lotteries";

export interface GameQuality {
  game: number[];
  strategyId: string;
  strategyName: string;
  parityBalance: number;    // 0-100 (50/50 = perfect)
  rangeBalance: number;     // 0-100 (coverage across ranges)
  sumScore: number;         // 0-100 (how close to ideal sum)
  consecutiveScore: number; // 0-100 (penalize too many consecutive)
  overallScore: number;     // 0-100 composite
  grade: "S" | "A" | "B" | "C" | "D";
}

export function scoreGame(
  game: number[],
  config: LotteryConfig,
  strategyId: string,
  strategyName: string,
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

  const overallScore = Math.min(100,
    parityBalance * 0.25 +
    rangeBalance * 0.30 +
    sumScore * 0.25 +
    consecutiveScore * 0.20
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
    overallScore,
    grade,
  };
}

export function rankAllGames(
  generatedGames: { strategyId: string; strategyName: string; games: number[][] }[],
  config: LotteryConfig,
): GameQuality[] {
  const all: GameQuality[] = [];
  for (const sg of generatedGames) {
    for (const game of sg.games) {
      all.push(scoreGame(game, config, sg.strategyId, sg.strategyName));
    }
  }
  return all.sort((a, b) => b.overallScore - a.overallScore);
}

export function exportGamesCSV(
  games: GameQuality[],
  lotteryName: string,
): string {
  const header = `Loteria,Estratégia,Jogo,Score,Nota,Paridade,Faixas,Soma,Consecutivas`;
  const rows = games.map(g =>
    `${lotteryName},${g.strategyName},"${g.game.join(",")}",${g.overallScore.toFixed(1)},${g.grade},${g.parityBalance.toFixed(0)},${g.rangeBalance.toFixed(0)},${g.sumScore.toFixed(0)},${g.consecutiveScore.toFixed(0)}`
  );
  return [header, ...rows].join("\n");
}
