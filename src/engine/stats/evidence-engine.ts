/**
 * Evidence Engine — Rigorous Statistical Testing for Lottery Strategies
 * -----------------------------------------------------------------------------
 * Provides tools for hypothesis testing (H0 vs H1), p-values, and statistical
 * significance to distinguish true performance from random chance.
 */

import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { EvidenceGrade, EvidenceResult } from "@/engine/contracts/quant";

export interface EvidenceReport extends EvidenceResult {
  isSignificant: boolean;
  lift: number;
  zScore: number;
  grade: EvidenceGrade;
  explanation: string;
  monteCarloStats?: {
    mean: number;
    median: number;
    p5: number;
    p95: number;
    iterations: number;
  };
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
  if (pValue >= 0.10 || lift <= 1.0) return "E0"; // No evidence or negative lift
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
      metric: "Performance Score",
      observed: 1,
      baseline: 1,
      effectSize: 0,
      confidenceInterval: [1, 1],
      pValue: 1,
      sampleSize: 0,
      method: "Permutation",
      conclusion: "E0",
      isSignificant: false,
      lift: 1,
      zScore: 0,
      grade: "E0",
      explanation: "Amostra insuficiente."
    };
  }

  const p_null = config.pick / config.numbers;
  const p_obs = observedHits / (sampleSize * config.pick);
  const lift = p_obs / (p_null || 0.0001);

  // Simulation-based P-Value (Paired Permutation Test)
  // We compare the strategy's hits against hits from random games on the SAME draws.
  // Work is bounded so the main thread never blocks for long: total random-game
  // generations are capped, which keeps the estimate stable while staying responsive.
  const MAX_GENERATIONS = 1_500_000;
  const perIteration = Math.max(1, draws.length * games.length);
  const effectiveIterations = Math.max(
    500,
    Math.min(iterations, Math.floor(MAX_GENERATIONS / perIteration))
  );

  const drawSets = draws.map(d => new Set(d.numbers));
  let extremeCount = 0;
  const simulationLifts: number[] = [];

  for (let i = 0; i < effectiveIterations; i++) {
    let simHits = 0;
    for (let d = 0; d < drawSets.length; d++) {
      const drawSet = drawSets[d];
      for (let g = 0; g < games.length; g++) {
        // Generate a random game for this slot
        const randomGame = generateRandomGame(config);
        for (const n of randomGame) if (drawSet.has(n)) simHits++;
      }
    }

    const simP = simHits / (sampleSize * config.pick);
    const simLift = simP / (p_null || 0.0001);
    simulationLifts.push(simLift);
    if (simHits >= observedHits) extremeCount++;
  }

  const pValue = Math.max(1 / (effectiveIterations + 1), extremeCount / effectiveIterations);

  // Calculate Z-Score from the simulation distribution
  const simMean = simulationLifts.reduce((a, b) => a + b, 0) / effectiveIterations;
  const simVar = simulationLifts.reduce((a, b) => a + (b - simMean) ** 2, 0) / effectiveIterations;
  const simStdev = Math.sqrt(simVar) || 0.0001;
  const zScore = (lift - simMean) / simStdev;

  // Confidence Interval (Bootstrap percentile method from simulations)
  simulationLifts.sort((a, b) => a - b);
  const ci: [number, number] = [
    simulationLifts[Math.floor(effectiveIterations * 0.025)] || lift,
    simulationLifts[Math.floor(effectiveIterations * 0.975)] || lift
  ];

  const grade = calculateGrade(pValue, lift);

  // Advanced Monte Carlo Baseline Stats
  const mean = simMean;
  const median = simulationLifts[Math.floor(effectiveIterations * 0.5)];
  const p5 = simulationLifts[Math.floor(effectiveIterations * 0.05)];
  const p95 = simulationLifts[Math.floor(effectiveIterations * 0.95)];

  return {
    metric: "Performance Score",
    observed: lift,
    baseline: simMean,
    effectSize: Math.abs(zScore),
    confidenceInterval: ci,
    pValue,
    sampleSize,
    method: `Paired Permutation Test (${effectiveIterations.toLocaleString("pt-BR")} iter.)`,
    conclusion: grade,
    isSignificant: pValue < 0.05 && lift > 1.0,
    lift,
    zScore,
    grade,
    explanation: getGradeExplanation(grade),
    monteCarloStats: {
      mean,
      median,
      p5,
      p95,
      iterations
    }
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
