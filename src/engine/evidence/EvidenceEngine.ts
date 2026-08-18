import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { NumberStats, computeFrequencyStats } from "../stats/statistics";
import { runMonteCarloSimulation } from "../stats/statistics";

export interface EvidenceReport {
  isSignificant: boolean;
  pValue: number;
  lift: number;
  confidenceInterval: [number, number];
  zScore: number;
  sampleSize: number;
  effectSize: "negligible" | "small" | "medium" | "large";
}

export interface BaselineStats {
  mean: number;
  median: number;
  p5: number;
  p95: number;
  stdDev: number;
}

/**
 * Evidence Engine — Rigorous Statistical Testing
 * Provides baselines (Random, Frequency) to compare models against.
 */
export class EvidenceEngine {
  constructor(private config: LotteryConfig) {}

  /**
   * Generates a random baseline using Monte Carlo simulations
   */
  generateRandomBaseline(iterations: number = 10000): BaselineStats {
    const pick = this.config.pick;
    const totalNumbers = this.config.numbers;
    const p = pick / totalNumbers;
    
    // Theoretical mean for selection of 'pick' numbers
    const mean = pick * p; 
    
    // For hit counts in a simulation:
    const hits: number[] = [];
    for (let i = 0; i < iterations; i++) {
      let drawHits = 0;
      const target = this.generateRandomGame();
      const actual = this.generateRandomGame();
      const actualSet = new Set(actual);
      target.forEach(n => { if (actualSet.has(n)) drawHits++; });
      hits.push(drawHits);
    }

    hits.sort((a, b) => a - b);
    const sum = hits.reduce((a, b) => a + b, 0);
    const avg = sum / iterations;
    const sqDiffs = hits.map(h => Math.pow(h - avg, 2));
    const stdDev = Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / iterations);

    return {
      mean: avg,
      median: hits[Math.floor(iterations / 2)],
      p5: hits[Math.floor(iterations * 0.05)],
      p95: hits[Math.floor(iterations * 0.95)],
      stdDev
    };
  }

  private generateRandomGame(): number[] {
    const nums: number[] = [];
    while (nums.length < this.config.pick) {
      const n = Math.floor(Math.random() * this.config.numbers) + 1;
      if (!nums.includes(n)) nums.push(n);
    }
    return nums;
  }

  /**
   * Performs a Z-test to compare observed hit rates against a baseline.
   */
  compareAgainstBaseline(observedHits: number, sampleSize: number, baseline: BaselineStats): EvidenceReport {
    const p_null = baseline.mean / this.config.pick;
    const p_obs = observedHits / (sampleSize * this.config.pick);
    
    const se = Math.sqrt((p_null * (1 - p_null)) / (sampleSize * this.config.pick));
    const zScore = (p_obs - p_null) / (se || 0.0001);
    
    // Approx p-value
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    const lift = p_null > 0 ? p_obs / p_null : 1;
    
    const margin = 1.96 * se;
    const ci: [number, number] = [
      Math.max(0, (p_obs - margin) / p_null),
      (p_obs + margin) / p_null
    ];

    let effectSize: "negligible" | "small" | "medium" | "large" = "negligible";
    if (Math.abs(zScore) > 3.0) effectSize = "large";
    else if (Math.abs(zScore) > 1.96) effectSize = "medium";
    else if (Math.abs(zScore) > 1.0) effectSize = "small";

    return {
      isSignificant: pValue < 0.05,
      pValue,
      lift,
      confidenceInterval: ci,
      zScore,
      sampleSize,
      effectSize
    };
  }

  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  }
}
