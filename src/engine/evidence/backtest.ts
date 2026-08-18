import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { EvidenceEngine, EvidenceReport } from "./EvidenceEngine";

export interface BacktestOptions {
  windowSize: number;
  testSize: number;
  mode: "rolling" | "expanding";
}

export interface BacktestResult {
  folds: number;
  avgLift: number;
  avgPrecisionAtK: number;
  maxDrawdown: number;
  report: EvidenceReport;
  mode: string;
}

export class WalkForwardBacktest {
  constructor(
    private draws: DrawResult[],
    private config: LotteryConfig
  ) {
    this.draws.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  run(
    modelFn: (trainingData: DrawResult[]) => number[],
    options: BacktestOptions
  ): BacktestResult {
    const engine = new EvidenceEngine(this.config);
    const baseline = engine.generateRandomBaseline(1000);
    
    let totalHits = 0;
    let totalPicks = 0;
    let foldCount = 0;

    for (let i = options.windowSize; i < this.draws.length; i++) {
      if (foldCount >= options.testSize) break;

      const trainStart = options.mode === "rolling" ? i - options.windowSize : 0;
      const trainingData = this.draws.slice(trainStart, i);
      const testDraw = this.draws[i];

      if (!testDraw) break;

      const prediction = modelFn(trainingData);
      const drawSet = new Set(testDraw.numbers);
      
      prediction.forEach(n => {
        if (drawSet.has(n)) totalHits++;
      });
      
      totalPicks += prediction.length;
      foldCount++;
    }

    const report = engine.compareAgainstBaseline(totalHits, foldCount, baseline);

    return {
      folds: foldCount,
      avgLift: report.lift,
      avgPrecisionAtK: totalHits / (totalPicks || 1),
      maxDrawdown: 0, // Simplified
      report,
      mode: options.mode
    };
  }
}
