import { NumberStats } from "@/engine/stats/statistics";
import { DrawResult, LotteryConfig } from "@/data/lotteries";

export interface BetQualityReport {
  overall: number; // 0-100
  dimensions: QualityDimension[];
  warnings: string[];
  strengths: string[];
  grade: "S" | "A" | "B" | "C" | "D" | "F";
}

export interface QualityDimension {
  name: string;
  score: number; // 0-100
  detail: string;
}

export function computeParityScore(bet: number[]) {
  const evens = bet.filter(n => n % 2 === 0).length;
  const evenRatio = evens / bet.length;
  const score = Math.max(0, Math.round(100 - Math.abs(evenRatio - 0.5) * 200));
  return { score, detail: `${evens} pares, ${bet.length - evens} ímpares`, ratio: evenRatio };
}

export function computeHighLowScore(bet: number[], totalNumbers: number) {
  const mid = totalNumbers / 2;
  const highs = bet.filter(n => n > mid).length;
  const highRatio = highs / bet.length;
  const score = Math.max(0, Math.round(100 - Math.abs(highRatio - 0.5) * 200));
  return { score, detail: `${highs} altos, ${bet.length - highs} baixos`, ratio: highRatio };
}

export function computeSpreadScore(bet: number[], totalNumbers: number) {
  const sorted = [...bet].sort((a, b) => a - b);
  const spread = sorted[sorted.length - 1] - sorted[0];
  const idealSpread = totalNumbers * 0.75;
  const score = Math.min(100, Math.round((spread / idealSpread) * 100));
  return { score, detail: `Espalhamento: ${sorted[0]} a ${sorted[sorted.length - 1]} (${spread} unidades)`, spread };
}
