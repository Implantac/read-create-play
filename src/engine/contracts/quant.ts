export type EvidenceGrade = 'E0' | 'E1' | 'E2' | 'E3' | 'E4';

export interface EvidenceResult {
  metric: string;
  observed: number;
  baseline: number;
  effectSize: number;
  confidenceInterval: [number, number];
  pValue?: number;
  adjustedPValue?: number;
  sampleSize: number;
  method: string;
  conclusion: EvidenceGrade;
}

export interface Draw {
  id: string;
  lotteryId: string;
  numbers: number[];
  date: string;
  prizeTiers?: Record<string, number>;
}

export interface BacktestResult {
  totalDraws: number;
  hits: Record<number, number>;
  roi: number;
  drawdown: number;
  precisionAtK: number;
  lift: number;
  zScore: number;
}
