import { NumberStats } from "@/engine/stats/statistics";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { 
  computeParityScore, 
  computeHighLowScore, 
  computeSpreadScore,
  computeFrameScore,
  computeFibonacciScore,
  computeSumScore,
  type BetQualityReport,
  type QualityDimension
} from "./quality-metrics";

export type { BetQualityReport, QualityDimension };

export function evaluateBetQuality(
  bet: number[],
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[]
): BetQualityReport {
  const dimensions: QualityDimension[] = [];
  const warnings: string[] = [];
  const strengths: string[] = [];

  // 1. Parity Balance
  const parity = computeParityScore(bet);
  dimensions.push({ name: "Equilíbrio Par/Ímpar", ...parity });
  if (parity.ratio > 0.7 || parity.ratio < 0.3) warnings.push("Desequilíbrio forte par/ímpar");
  if (Math.abs(parity.ratio - 0.5) < 0.15) strengths.push("Excelente equilíbrio par/ímpar");

  // 2. High/Low Balance
  const highLow = computeHighLowScore(bet, config.numbers);
  dimensions.push({ name: "Equilíbrio Alto/Baixo", ...highLow });
  if (highLow.ratio > 0.75 || highLow.ratio < 0.25) warnings.push("Concentração em faixa alta ou baixa");

  // 3. Spread Coverage
  const spread = computeSpreadScore(bet, config.numbers);
  dimensions.push({ name: "Cobertura de Faixa", ...spread });
  if (spread.spread < config.numbers * 0.4) warnings.push("Números muito concentrados");
  if (spread.spread > config.numbers * 0.7) strengths.push("Boa cobertura do intervalo");
  
  // 4. Frame/Center (Specific to Lotofácil)
  if (config.id === 'lotofacil') {
    const frame = computeFrameScore(bet, config);
    dimensions.push({ name: "Moldura/Centro", ...frame });
    if (frame.score < 60) warnings.push("Desequilíbrio moldura/centro");
  }

  // 5. Fibonacci
  const fibo = computeFibonacciScore(bet);
  dimensions.push({ name: "Padrão Fibonacci", ...fibo });

  // 6. Sum
  const sumMetric = computeSumScore(bet, config);
  dimensions.push({ name: "Soma de Dezenas", ...sumMetric });
  if (sumMetric.score < 50) warnings.push("Soma fora da faixa ideal");

  // Weights for Titan Score
  const weights = [15, 15, 10, 20, 10, 30]; 
  const currentTotal = dimensions.reduce((acc, _, i) => acc + (weights[i] || 10), 0);
  const overall = Math.round(
    dimensions.reduce((s, d, i) => s + (d.score * (weights[i] || 10) / currentTotal), 0)
  );

  const grade: BetQualityReport["grade"] =
    overall >= 90 ? "S" :
    overall >= 75 ? "A" :
    overall >= 60 ? "B" :
    overall >= 45 ? "C" :
    overall >= 30 ? "D" : "F";

  return { overall, dimensions, warnings, strengths, grade };
}

