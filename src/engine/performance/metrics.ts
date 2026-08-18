import { LotteryConfig } from "@/data/lotteries";

export interface PredictionMetrics {
  avgHits: number;
  medianHits: number;
  top5Precision: number;
  top10Precision: number;
  top15Precision: number;
  lift: number;
  zScore: number;
  pValue: number;
}

export function calculatePredictionMetrics(
  hits: number[],
  topSize: number,
  config: LotteryConfig
): PredictionMetrics {
  const n = hits.length;
  if (n === 0) return {} as any;

  const sum = hits.reduce((a, b) => a + b, 0);
  const avg = sum / n;
  
  const sortedHits = [...hits].sort((a, b) => a - b);
  const median = n % 2 === 0 
    ? (sortedHits[n/2 - 1] + sortedHits[n/2]) / 2 
    : sortedHits[Math.floor(n/2)];

  const p_null = config.pick / config.numbers;
  const expectedHits = topSize * p_null;
  const lift = avg / (expectedHits || 0.001);

  return {
    avgHits: avg,
    medianHits: median,
    top5Precision: 0, // Mock for now, requires per-top-k data
    top10Precision: 0,
    top15Precision: avg / 15,
    lift,
    zScore: 0,
    pValue: 1
  };
}
