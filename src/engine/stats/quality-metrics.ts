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

export function computeFrameScore(bet: number[], config: LotteryConfig) {
  // Common lotteries (Lotofácil 5x5, Mega 10x6)
  // Simple heuristic for Lotofácil (1 to 25)
  const isLotofacil = config.id === 'lotofacil';
  if (!isLotofacil) return { score: 100, detail: "Não aplicável", ratio: 0 };
  
  const frameNumbers = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];
  const count = bet.filter(n => frameNumbers.includes(n)).length;
  // Ideal for Lotofácil is 8-11
  const score = count >= 8 && count <= 11 ? 100 : Math.max(0, 100 - Math.abs(count - 9.5) * 15);
  return { score, detail: `${count} na moldura, ${bet.length - count} no centro`, ratio: count / bet.length };
}

export function computeFibonacciScore(bet: number[]) {
  const fib = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  const count = bet.filter(n => fib.includes(n)).length;
  // Usually 3-5 Fibonacci numbers are common in games
  const score = count >= 3 && count <= 5 ? 100 : Math.max(0, 100 - Math.abs(count - 4) * 20);
  return { score, detail: `${count} números de Fibonacci`, ratio: count / bet.length };
}

export function computeSumScore(bet: number[], config: LotteryConfig) {
  const sum = bet.reduce((a, b) => a + b, 0);
  // Average sum depends on lottery. For Lotofácil 15/25, average is ~195
  let minIdeal, maxIdeal;
  if (config.id === 'lotofacil') {
    minIdeal = 170; maxIdeal = 220;
  } else if (config.id === 'megasena') {
    minIdeal = 150; maxIdeal = 220;
  } else {
    return { score: 100, detail: `Soma: ${sum}`, sum };
  }
  
  const score = sum >= minIdeal && sum <= maxIdeal ? 100 : Math.max(0, 100 - Math.abs(sum - (minIdeal + maxIdeal) / 2) / 2);
  return { score, detail: `Soma total: ${sum}`, sum };
}
