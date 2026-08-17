/**
 * Evidence Engine — Rigorous Statistical Testing for Lottery Strategies
 * -----------------------------------------------------------------------------
 * Provides tools for hypothesis testing (H0 vs H1), p-values, and statistical
 * significance to distinguish true performance from random chance.
 */

import { LotteryConfig } from "@/data/lotteries";

export interface EvidenceReport {
  isSignificant: boolean;
  pValue: number;
  lift: number;
  confidenceInterval: [number, number];
  zScore: number;
  sampleSize: number;
  effectSize: "negligible" | "small" | "medium" | "large";
}

/**
 * Performs a Z-test to compare observed hit rates against a random baseline.
 * H0: The strategy performs no better than random chance.
 * H1: The strategy performs better (or worse) than random chance.
 */
export function analyzeEvidence(
  observedHits: number,
  sampleSize: number,
  config: LotteryConfig
): EvidenceReport {
  // Expected probability of a hit on a single number (simplified)
  // For Lotofácil (15/25): p = 15/25 = 0.6
  const p_null = config.pick / config.numbers;
  
  // Mean hits expected by chance
  const expectedHits = sampleSize * p_null;
  
  // Observed probability
  const p_obs = observedHits / sampleSize;
  
  // Standard Error for proportion
  const se = Math.sqrt((p_null * (1 - p_null)) / sampleSize);
  
  // Z-score
  const zScore = (p_obs - p_null) / (se || 0.001);
  
  // Two-tailed p-value (approximation using a normal distribution table calculation)
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
  
  const lift = p_null > 0 ? p_obs / p_null : 1;
  
  // 95% Confidence Interval for the lift
  const margin = 1.96 * se;
  const ci: [number, number] = [
    Math.max(0, (p_obs - margin) / p_null),
    (p_obs + margin) / p_null
  ];

  const isSignificant = pValue < 0.05;
  
  let effectSize: "negligible" | "small" | "medium" | "large" = "negligible";
  if (Math.abs(zScore) > 3.0) effectSize = "large";
  else if (Math.abs(zScore) > 1.96) effectSize = "medium";
  else if (Math.abs(zScore) > 1.0) effectSize = "small";

  return {
    isSignificant,
    pValue,
    lift,
    confidenceInterval: ci,
    zScore,
    sampleSize,
    effectSize
  };
}

/** Cumulative Distribution Function for a standard normal distribution */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

/**
 * Compares two strategies to see if one is significantly better than the other.
 */
export function compareStrategiesSignificance(
  hitsA: number,
  sizeA: number,
  hitsB: number,
  sizeB: number
): { pValue: number; better: "A" | "B" | "none" } {
  const pA = hitsA / sizeA;
  const pB = hitsB / sizeB;
  const pPooled = (hitsA + hitsB) / (sizeA + sizeB);
  
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / sizeA + 1 / sizeB));
  const z = (pA - pB) / (se || 0.001);
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  
  if (pValue >= 0.05) return { pValue, better: "none" };
  return { pValue, better: z > 0 ? "A" : "B" };
}
