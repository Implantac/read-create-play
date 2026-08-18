import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { analyzeEvidence, EvidenceReport } from "../stats/evidence-engine";

export interface BacktestResult {
  folds: number;
  avgLift: number;
  avgROI: number;
  drawdown: number;
  report: EvidenceReport;
  temporalIntegrity: boolean;
}

export class WalkForwardBacktest {
  constructor(
    private draws: DrawResult[],
    private config: LotteryConfig
  ) {
    // Garantir ordem cronológica
    this.draws.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Executa backtest walk-forward em múltiplos folds.
   * Evita data leakage usando apenas o passado para prever o futuro.
   */
  run(
    modelFn: (pastDraws: DrawResult[]) => number[],
    windowSize: number = 100,
    testStep: number = 10
  ): BacktestResult {
    // Implementação da lógica de folds conforme regra 8
    let totalHits = 0;
    let totalSamples = 0;
    
    // Simplificado para esta fase, mas respeitando o fluxo
    for (let i = windowSize; i < this.draws.length; i += testStep) {
      const trainingData = this.draws.slice(0, i);
      const testData = this.draws.slice(i, Math.min(i + testStep, this.draws.length));
      
      const prediction = modelFn(trainingData);
      
      testData.forEach(draw => {
        const hits = prediction.filter(n => draw.numbers.includes(n)).length;
        totalHits += hits;
        totalSamples += prediction.length;
      });
    }

    const report = analyzeEvidence(totalHits, totalSamples, this.config);

    return {
      folds: Math.floor((this.draws.length - windowSize) / testStep),
      avgLift: report.lift,
      avgROI: 0, // A ser implementado com BankrollManager
      drawdown: 0,
      report,
      temporalIntegrity: true
    };
  }
}
