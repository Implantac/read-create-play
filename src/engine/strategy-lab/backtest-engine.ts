import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "@/engine/stats/statistics";
import { StrategyMetrics } from "./metrics";

export interface BacktestResult {
  strategyId: string;
  strategyName: string;
  metrics: StrategyMetrics;
  history: {
    concurso: number;
    hits: number;
    isPrize: boolean;
    equity: number;
  }[];
}

export interface LabAnalysis {
  drawdown: number;
  ruinProbability: number;
  roi: number;
  sharpeRatio: number;
  expectedValue: number;
}

export function runBacktest(
  strategyId: string,
  strategyName: string,
  games: number[][],
  draws: DrawResult[],
  config: LotteryConfig,
  ticketCost: number,
  initialBankroll: number = 1000
): BacktestResult {
  const history: BacktestResult["history"] = [];
  let currentBankroll = initialBankroll;
  
  // Prize logic based on official lottery rules
  const prizeLogic: Record<string, (hits: number) => number> = {
    lotofacil: (h) => h === 15 ? 1500000 : h === 14 ? 1500 : h === 13 ? 30 : h === 12 ? 12 : h === 11 ? 6 : 0,
    megasena: (h) => h === 6 ? 30000000 : h === 5 ? 45000 : h === 4 ? 1000 : 0,
    quina: (h) => h === 5 ? 500000 : h === 4 ? 8000 : h === 3 ? 150 : h === 2 ? 4 : 0,
  };

  const getPrize = prizeLogic[config.id] || ((h: number) => h >= config.pick - 2 ? 10 : 0);

  // Sort draws by number ascending for backtest timeline
  const sortedDraws = [...draws].sort((a, b) => a.concurso - b.concurso);

  let totalSpent = 0;
  let totalWon = 0;
  let hitCounts: Record<number, number> = {};
  
  for (const draw of sortedDraws) {
    const drawSet = new Set(draw.numbers);
    let drawWon = 0;
    let drawHits = 0;
    
    for (const game of games) {
      const hits = game.filter(n => drawSet.has(n)).length;
      const prize = getPrize(hits);
      
      drawWon += prize;
      drawHits = Math.max(drawHits, hits);
      hitCounts[hits] = (hitCounts[hits] || 0) + 1;
    }
    
    totalSpent += games.length * ticketCost;
    totalWon += drawWon;
    currentBankroll = currentBankroll - (games.length * ticketCost) + drawWon;
    
    history.push({
      concurso: draw.concurso,
      hits: drawHits,
      isPrize: drawWon > 0,
      equity: currentBankroll
    });
  }

  const roi = totalSpent > 0 ? (totalWon - totalSpent) / totalSpent : 0;
  
  // Calculate Drawdown
  let peak = initialBankroll;
  let maxDrawdown = 0;
  for (const h of history) {
    if (h.equity > peak) peak = h.equity;
    const dd = (peak - h.equity) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Calculate Ruin Probability (Simplified Monte Carlo approximation)
  // If at any point equity <= 0, it's a ruin
  const ruinCount = history.filter(h => h.equity <= 0).length;
  const ruinProbability = history.length > 0 ? ruinCount / history.length : 0;

  const metrics: StrategyMetrics = {
    roi,
    drawdown: maxDrawdown * 100,
    ruinProbability: ruinProbability * 100,
    avgHits: history.reduce((s, h) => s + h.hits, 0) / (history.length || 1),
    totalSpent,
    totalWon,
    winRate: (history.filter(h => h.isPrize).length / (history.length || 1)) * 100
  };

  return {
    strategyId,
    strategyName,
    metrics,
    history
  };
}
