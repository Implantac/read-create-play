export interface StrategyMetrics {
  roi: number;
  drawdown: number;
  ruinProbability: number;
  avgHits: number;
  totalSpent: number;
  totalWon: number;
  winRate: number;
  volatility: number;
  maxConsecutiveLosses: number;
  lift?: number;
  pValue?: number;
  isSignificant?: boolean;
}
