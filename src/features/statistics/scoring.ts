import { NumberStats } from "./engine";
import { LotteryConfig } from "@/data/lotteries";

export interface GameScore {
  total: number; // 0-100
  factors: {
    parity: number;      // Balance between even/odd
    frequency: number;   // Balance between hot/cold/normal
    distribution: number; // Space coverage
    cycle: number;       // How "due" numbers are
    trend: number;       // Momentum alignment
  };
  insights: string[];
  classification: "Conservador" | "Moderado" | "Agressivo" | "Profissional" | "Premium" | "Elite";
}

export function calculateGameScore(
  game: number[],
  stats: NumberStats[],
  config: LotteryConfig
): GameScore {
  const statsMap = new Map(stats.map(s => [s.number, s]) );
  const gameStats = game.map(n => statsMap.get(n)).filter(Boolean) as NumberStats[];

  // 1. Parity (Ideal 50/50)
  const evens = game.filter(n => n % 2 === 0).length;
  const parityRatio = evens / game.length;
  const parityScore = Math.max(0, 100 - Math.abs(parityRatio - 0.5) * 200);

  // 2. Frequency Balance (Ideal: mix of hot, cold, normal)
  const hot = gameStats.filter(s => s.status === "hot").length;
  const cold = gameStats.filter(s => s.status === "cold").length;
  const hotRatio = hot / game.length;
  const coldRatio = cold / game.length;
  // Ideal: ~30% hot, ~20% cold, ~50% normal
  const freqScore = Math.max(0, 100 - (Math.abs(hotRatio - 0.3) * 100 + Math.abs(coldRatio - 0.2) * 100));

  // 3. Cycle Alignment
  const avgCycle = gameStats.reduce((a, b) => a + b.cycleScore, 0) / game.length;
  const cycleScore = Math.min(100, avgCycle * 50);

  // 4. Trend Momentum
  const avgTrend = gameStats.reduce((a, b) => a + b.trend, 0) / game.length;
  const trendScore = Math.min(100, Math.max(0, 50 + avgTrend * 2));

  // 5. Distribution (Spreading across the board)
  const sorted = [...game].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i] - sorted[i-1]);
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const idealGap = config.numbers / config.pick;
  const distScore = Math.max(0, 100 - Math.abs(avgGap - idealGap) * (100 / idealGap));

  // Total
  const total = Math.round(
    parityScore * 0.15 +
    freqScore * 0.25 +
    cycleScore * 0.30 +
    trendScore * 0.20 +
    distScore * 0.10
  );

  const insights: string[] = [];
  if (parityScore > 90) insights.push("Equilíbrio par/ímpar excelente.");
  if (freqScore > 90) insights.push("Mix de frequências altamente otimizado.");
  if (cycleScore > 80) insights.push("Dezenas com alta maturidade de ciclo.");
  if (avgTrend > 5) insights.push("Forte momentum de tendência positiva.");
  if (total > 85) insights.push("Configuração matemática de alta probabilidade.");

  let classification: GameScore["classification"] = "Moderado";
  if (total > 95) classification = "Elite";
  else if (total > 88) classification = "Premium";
  else if (total > 80) classification = "Profissional";
  else if (total > 70) classification = "Agressivo";
  else if (total < 40) classification = "Conservador";

  return {
    total,
    factors: {
      parity: Math.round(parityScore),
      frequency: Math.round(freqScore),
      distribution: Math.round(distScore),
      cycle: Math.round(cycleScore),
      trend: Math.round(trendScore),
    },
    insights,
    classification,
  };
}
