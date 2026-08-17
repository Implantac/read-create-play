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
  shuffledLift?: number; // Lift against shuffled timeline
  signalIntegrity?: number; // Ratio of real lift vs shuffled lift (0-1)
}
