export interface PerfResult {
  concurso: number;
  date: string;
  hits: number;
  matched: number[];
  prize: string;
  prizeValue: number;
  realPrize?: string;
  secondHits?: number;
  secondMatched?: number[];
  secondPrize?: string;
  secondPrizeValue?: number;
  bestHits?: number;
}

export interface BetPerformance {
  numbers: number[];
  label: string;
  results: PerfResult[];
  avgHits: number;
  bestHit: number;
  prizeHits: number;
  totalPrizeValue: number;
  totalPrize: string;
  score: number;
  trend?: "up" | "down" | "stable";
  recentAvg?: number;
  previousAvg?: number;
  strategyId?: string;
}
