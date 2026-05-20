import { NumberStats } from "@/engine/statistics";
import { DrawResult } from "@/data/lotteries";

/**
 * Motor de Entropia Preditiva (Predictive Entropy)
 * Analisa a desordem estatística e sinaliza quebras de tendência.
 */
export function calculatePredictiveEntropy(stats: NumberStats[], draws: DrawResult[]): {
  entropy: number;
  stability: number;
  recommendation: string;
} {
  if (draws.length < 10) return { entropy: 0, stability: 100, recommendation: "Dados insuficientes" };

  // Cálculo simplificado de entropia baseado na variação de somas recentes
  const recentSams = draws.slice(0, 10).map(d => d.numbers.reduce((a, b) => a + b, 0));
  const avgSum = recentSams.reduce((a, b) => a + b, 0) / 10;
  const variance = recentSams.reduce((a, b) => a + Math.pow(b - avgSum, 2), 0) / 10;
  
  const entropy = Math.min(100, Math.sqrt(variance) * 2);
  const stability = 100 - entropy;

  let recommendation = "Tendência Estável: Mantenha estratégias de frequência.";
  if (entropy > 60) {
    recommendation = "Alta Entropia Detectada: Possível quebra de padrão. Use estratégias de Cobertura ou Anti-Padrão.";
  } else if (entropy > 40) {
    recommendation = "Instabilidade Moderada: Diversifique com Equilíbrio Estrutural.";
  }

  return { entropy, stability, recommendation };
}
