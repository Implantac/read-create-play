export interface TitanBet {
  id: string;
  numbers: number[];
  strategy: string;
  strategyLabel: string;
  score: number; // 0-100
  grade: "S" | "A" | "B" | "C" | "D" | "F";
  rank: number;
  insights: string[];
  metadata: Record<string, any>;
}

export interface SimulationMetrics {
  avgHits: number;
  maxHits: number;
  winRate: number;
  consistency: number;
  prizeCount: number;
}
