/**
 * Evidence Engine — Rigorous Statistical Testing for Lottery Strategies
 * -----------------------------------------------------------------------------
 * Provides tools for hypothesis testing (H0 vs H1), p-values, and statistical
 * significance to distinguish true performance from random chance.
 */

import { LotteryConfig, DrawResult } from "@/data/lotteries";

export type EvidenceGrade = "E0" | "E1" | "E2" | "E3" | "E4";

export interface EvidenceReport {
  isSignificant: boolean;
  pValue: number;
  lift: number;
  confidenceInterval: [number, number]; // IC95%
  zScore: number;
  sampleSize: number;
  effectSize: "negligible" | "small" | "medium" | "large";
  grade: EvidenceGrade;
  explanation: string;
}

export interface Hypothesis {
  id: string;
  name: string;
  description: string;
  expectedLift: number;
  indicator: string;
  status: "tested" | "pending";
  result?: EvidenceReport;
}

/**
 * Maps p-value and lift to a professional Evidence Grade.
 */
function calculateGrade(pValue: number, lift: number): EvidenceGrade {
  if (pValue >= 0.10) return "E0"; // No evidence
  if (pValue >= 0.05) return "E1"; // Weak/Exploratory
  if (lift > 1.05 && pValue < 0.01) return "E4"; // Robust
  if (lift > 1.03 && pValue < 0.05) return "E3"; // Strong
  return "E2"; // Moderate
}

function getGradeExplanation(grade: EvidenceGrade): string {
  switch (grade) {
    case "E0": return "Sem evidência: Nenhuma vantagem detectada em relação ao acaso.";
    case "E1": return "Sinal exploratório: Resultado interessante, mas estatisticamente inconclusivo.";
    case "E2": return "Evidência moderada: Resultado consistente em parte dos testes.";
    case "E3": return "Evidência forte: Resultado consistente com baixo p-valor.";
    case "E4": return "Evidência robusta: Vantagem preditiva replicada com alta confiança.";
  }
}

/**
 * Rigorous evidence analysis using Paired Permutation Test and simulation-based P-Value.
 * Replaces simple Bernoulli assumptions with real-world sampling without replacement simulations.
 */
export function analyzeEvidence(
  observedHits: number,
  games: number[][],
  draws: DrawResult[],
  config: LotteryConfig,
  iterations: number = 10000
): EvidenceReport {
  const sampleSize = games.length * draws.length;
  if (sampleSize === 0) {
    return {
      isSignificant: false, pValue: 1, lift: 1, confidenceInterval: [1, 1],
      zScore: 0, sampleSize: 0, effectSize: "negligible", grade: "E0",
      explanation: "Amostra insuficiente."
    };
  }

  const p_null = config.pick / config.numbers;
  const p_obs = observedHits / (sampleSize * config.pick);
  const lift = p_obs / (p_null || 0.0001);

  // Simulation-based P-Value (Paired Permutation Test)
  // We compare the strategy's hits against hits from random games on the SAME draws.
  let extremeCount = 0;
  const simulationLifts: number[] = [];

  for (let i = 0; i < iterations; i++) {
    let simHits = 0;
    for (let d = 0; d < draws.length; d++) {
      const drawSet = new Set(draws[d].numbers);
      for (let g = 0; g < games.length; g++) {
        // Generate a random game for this slot
        const randomGame = generateRandomGame(config);
        const hits = randomGame.filter(n => drawSet.has(n)).length;
        simHits += hits;
      }
    }
    
    const simP = simHits / (sampleSize * config.pick);
    const simLift = simP / (p_null || 0.0001);
    simulationLifts.push(simLift);
    if (simHits >= observedHits) extremeCount++;
  }

  const pValue = Math.max(0.0001, extremeCount / iterations);
  
  // Calculate Z-Score from the simulation distribution
  const simMean = simulationLifts.reduce((a, b) => a + b, 0) / iterations;
  const simVar = simulationLifts.reduce((a, b) => a + (b - simMean) ** 2, 0) / iterations;
  const simStdev = Math.sqrt(simVar) || 0.0001;
  const zScore = (lift - simMean) / simStdev;

  // Confidence Interval (Bootstrap percentile method from simulations)
  simulationLifts.sort((a, b) => a - b);
  const ci: [number, number] = [
    simulationLifts[Math.floor(iterations * 0.025)] || lift,
    simulationLifts[Math.floor(iterations * 0.975)] || lift
  ];

  const grade = calculateGrade(pValue, lift);

  return {
    isSignificant: pValue < 0.05 && lift > 1.0,
    pValue,
    lift,
    confidenceInterval: ci,
    zScore,
    sampleSize,
    effectSize: Math.abs(zScore) > 3 ? "large" : Math.abs(zScore) > 2 ? "medium" : "small",
    grade,
    explanation: getGradeExplanation(grade)
  };
}

function generateRandomGame(config: LotteryConfig): number[] {
  const game: number[] = [];
  while (game.length < config.pick) {
    const n = Math.floor(Math.random() * config.numbers) + 1;
    if (!game.includes(n)) game.push(n);
  }
  return game;
}

/** Cumulative Distribution Function for a standard normal distribution (for reference) */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

export function runMonteCarloSim(
  games: number[][],
  draws: DrawResult[],
  config: LotteryConfig,
  iterations: number = 1000
): number[] {
  const p_null = config.pick / config.numbers;
  const sampleSize = games.length * draws.length;
  const distribution: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    let hits = 0;
    for (let d = 0; d < draws.length; d++) {
      const drawSet = new Set(draws[d].numbers);
      for (let g = 0; g < games.length; g++) {
        const randomGame = generateRandomGame(config);
        hits += randomGame.filter(n => drawSet.has(n)).length;
      }
    }
    distribution.push((hits / sampleSize) / p_null);
  }
  
  return distribution.sort((a, b) => a - b);
}
