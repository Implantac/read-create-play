import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { EvidenceEngine, EvidenceReport } from "./EvidenceEngine";
import { WalkForwardBacktest, BacktestOptions } from "./backtest";

export interface AblationReport {
  indicator: string;
  liftContribution: number;
  significanceImpact: number;
  confidenceGain: number;
  relativeImportance: number;
}

/**
 * Feature Ablation Engine
 * Quantifies which indicators most improve evidence, lift, and confidence intervals.
 * Uses "Leave-One-Out" methodology for statistical validation.
 */
export class FeatureAblation {
  constructor(
    private draws: DrawResult[],
    private config: LotteryConfig
  ) {}

  /**
   * Runs ablation study on a set of indicators
   */
  async runAblationStudy(
    baseModelFn: (trainingData: DrawResult[], excludedFeatures: string[]) => number[],
    features: string[],
    options: BacktestOptions
  ): Promise<AblationReport[]> {
    const backtest = new WalkForwardBacktest(this.draws, this.config);
    
    // 1. Get baseline (all features)
    const baseline = backtest.run((data) => baseModelFn(data, []), options);
    
    const reports: AblationReport[] = [];
    
    // 2. Run ablation for each feature
    for (const feature of features) {
      const result = backtest.run((data) => baseModelFn(data, [feature]), options);
      
      // Impact = Baseline - Ablated
      // If Impact > 0, the feature contributes positively
      const liftContribution = baseline.avgLift - result.avgLift;
      const significanceImpact = (baseline.report.zScore - result.report.zScore);
      const confidenceGain = (baseline.report.lift / (baseline.report.confidenceInterval[1] - baseline.report.confidenceInterval[0])) -
                             (result.report.lift / (result.report.confidenceInterval[1] - result.report.confidenceInterval[0]));
      
      reports.push({
        indicator: feature,
        liftContribution,
        significanceImpact,
        confidenceGain,
        relativeImportance: 0 // Will be calculated after all features
      });
    }
    
    // 3. Normalize relative importance
    const totalImpact = reports.reduce((s, r) => s + Math.max(0, r.liftContribution), 0) || 1;
    reports.forEach(r => {
      r.relativeImportance = Math.max(0, r.liftContribution) / totalImpact;
    });
    
    return reports.sort((a, b) => b.liftContribution - a.liftContribution);
  }
}
