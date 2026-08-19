import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { generateRandomGames, buildBenchmarkReport, BenchmarkReport } from "@/engine/stats/baseline-benchmark";
import { analyzeEvidence } from "@/engine/stats/evidence-engine";

export interface StrategyBenchmarkResult {
  strategyId: string;
  strategyLabel: string;
  titanPerformance: number; // Média de acertos ou ROI
  randomBaseline: number;
  uniformBaseline: number;
  outOfSamplePerformance: number;
  zScore: number;
  pValue: number;
  isStatisticallySignificant: boolean;
  confidenceInterval: [number, number];
  sampleSize: number;
  advantage: number; // Diferença absoluta
  lift: number; // Porcentagem sobre o acaso
}

/**
 * Benchmark Engine
 * 
 * Compara estratégias Titan contra baselines aleatórias e uniformes,
 * calculando a significância estatística real (Verdade Matemática).
 */
export class BenchmarkEngine {
  /**
   * Executa um benchmark completo para uma estratégia.
   */
  static async runBenchmark(
    strategyId: string,
    strategyLabel: string,
    lotteryConfig: LotteryConfig,
    draws: DrawResult[],
    generatedGames: number[][],
    historicalPerformance: number // Desempenho observado da estratégia Titan
  ): Promise<StrategyBenchmarkResult> {
    const sampleSize = generatedGames.length;
    
    // 1. Random Baseline
    const randomGames = generateRandomGames(lotteryConfig, 1000);
    const randomResults = this.calculateAverageHits(randomGames, draws.slice(0, 100));
    const randomAvg = randomResults.average;

    // 2. Simulação de significância via EvidenceEngine
    const totalHits = this.calculateTotalHits(generatedGames, draws.slice(0, 50));
    const evidence = analyzeEvidence(
      totalHits,
      generatedGames,
      draws.slice(0, 50),
      lotteryConfig,
      10000 // Reduzido para performance no benchmark inicial
    );

    const advantage = historicalPerformance - randomAvg;
    const lift = (advantage / (randomAvg || 1)) * 100;

    return {
      strategyId,
      strategyLabel,
      titanPerformance: historicalPerformance,
      randomBaseline: randomAvg,
      uniformBaseline: randomAvg, 
      outOfSamplePerformance: 0, // Placeholder para FASE 7
      zScore: evidence.zScore,
      pValue: evidence.pValue,
      isStatisticallySignificant: evidence.isSignificant,
      confidenceInterval: evidence.confidenceInterval as [number, number],
      sampleSize,
      advantage,
      lift
    };
  }

  private static calculateTotalHits(games: number[][], draws: DrawResult[]): number {
    let total = 0;
    for (const draw of draws) {
      const drawSet = new Set(draw.numbers);
      for (const game of games) {
        total += game.filter(n => drawSet.has(n)).length;
      }
    }
    return total;
  }

  private static calculateAverageHits(games: number[][], draws: DrawResult[]): { average: number; stdDev: number } {
    if (games.length === 0 || draws.length === 0) return { average: 0, stdDev: 0 };

    const hits: number[] = [];
    for (const draw of draws) {
      const drawSet = new Set(draw.numbers);
      for (const game of games) {
        let hitCount = 0;
        for (const num of game) {
          if (drawSet.has(num)) hitCount++;
        }
        hits.push(hitCount);
      }
    }

    const sum = hits.reduce((a, b) => a + b, 0);
    const avg = sum / hits.length;
    const variance = hits.reduce((s, h) => s + Math.pow(h - avg, 2), 0) / hits.length;

    return {
      average: avg,
      stdDev: Math.sqrt(variance)
    };
  }
}
