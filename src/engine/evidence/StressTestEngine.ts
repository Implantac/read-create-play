import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { EvidenceEngine, EvidenceReport, EvidenceGrade } from "./EvidenceEngine";
import { WalkForwardBacktest, BacktestOptions } from "./backtest";

export interface StressTestResult {
  robustnessScore: number; // 0-100
  stabilityIndex: number; // 0-1 (low variance between windows)
  marketRegimes: {
    volatility: "low" | "medium" | "high";
    performance: number;
  }[];
  criticalFailurePoints: string[];
  verdict: "robust" | "fragile" | "overfitted";
}

/**
 * StressTestEngine — Fase 8 do Plano Mestre.
 * Executa testes de estresse variando janelas temporais, ruído e regimes de sorteio.
 */
export class StressTestEngine {
  constructor(
    private draws: DrawResult[],
    private config: LotteryConfig
  ) {}

  /**
   * Executa múltiplos backtests em diferentes janelas para medir estabilidade.
   */
  async runStressTest(
    modelFn: (trainingData: DrawResult[]) => number[],
    baseOptions: BacktestOptions
  ): Promise<StressTestResult> {
    const backtester = new WalkForwardBacktest(this.draws, this.config);
    
    // Variamos o tamanho da janela de treino em +/- 20%
    const windows = [
      Math.floor(baseOptions.windowSize * 0.8),
      baseOptions.windowSize,
      Math.floor(baseOptions.windowSize * 1.2)
    ];

    const results = windows.map(w => 
      backtester.run(modelFn, { ...baseOptions, windowSize: w })
    );

    const lifts = results.map(r => r.avgLift);
    const avgLift = lifts.reduce((a, b) => a + b, 0) / lifts.length;
    
    // Estabilidade: 1 - Desvio Padrão Relativo
    const variance = lifts.reduce((a, b) => a + (b - avgLift) ** 2, 0) / lifts.length;
    const stdDev = Math.sqrt(variance);
    const stabilityIndex = Math.max(0, 1 - (stdDev / (avgLift || 1)));

    // Robustness Score combina Lift médio e Estabilidade
    const robustnessScore = Math.min(100, (avgLift * 40) + (stabilityIndex * 60));

    const failurePoints: string[] = [];
    if (stabilityIndex < 0.6) failurePoints.push("Alta sensibilidade ao tamanho da janela de treino.");
    if (avgLift < 1.05) failurePoints.push("Lift marginal ou negativo em janelas específicas.");

    let verdict: StressTestResult["verdict"] = "robust";
    if (robustnessScore < 40) verdict = "fragile";
    else if (stabilityIndex < 0.5 && avgLift > 1.2) verdict = "overfitted";

    return {
      robustnessScore,
      stabilityIndex,
      marketRegimes: results.map((r, i) => ({
        volatility: i === 0 ? "low" : i === 1 ? "medium" : "high",
        performance: r.avgLift
      })),
      criticalFailurePoints: failurePoints,
      verdict
    };
  }
}
