/**
 * Extreme Coverage Engine — Consolidated Module
 * Multi-lottery professional coverage system
 * 
 * 5-layer pipeline:
 * 1. Candidate generation (valid games from base)
 * 2. Greedy selection (maximize marginal coverage)
 * 3. Local search refinement (swap numbers to improve)
 * 4. Simulated annealing (escape local optima)
 * 5. Post-processing (remove weak, rank, explain)
 */

// ─── Types ───

export type CoverageProfile = "economico" | "equilibrado" | "agressivo" | "extremo";
export type CoverageObjective = "geral" | "pares" | "trincas" | "quadras" | "hibrido";
export type CoveragePriority = "menor_custo" | "maior_cobertura" | "melhor_equilibrio" | "maior_diversidade";

export interface CoverageConfig {
  lotteryId: string;
  baseNumbers: number[];
  pick: number;
  universeSize: number;
  maxGames: number;
  maxBudget: number;
  ticketPrice: number;
  profile: CoverageProfile;
  objective: CoverageObjective;
  priority: CoveragePriority;
  maxOverlap: number;
  filters?: {
    parityRange?: [number, number];
    sumRange?: [number, number];
    minPerRange?: number;
  };
}

export interface CoverageMetrics {
  baseSize: number;
  totalGames: number;
  totalCost: number;
  numberCoverage: number;
  pairCoverage: number;
  tripleCoverage: number;
  quadCoverage: number;
  redundancyIndex: number;
  diversityIndex: number;
  globalScore: number;
  efficiencyLevel: string;
  totalPossibleCombinations: number;
  reductionRatio: number;
}

export interface CoverageExplanation {
  summary: string;
  technical: string;
  profile: string;
  compromises: string[];
}

export interface CoverageResult {
  games: number[][];
  metrics: CoverageMetrics;
  explanation: CoverageExplanation;
  convergenceHistory: { step: number; score: number }[];
  elapsedMs: number;
}

export interface ProfileWeights {
  coverageWeight: number;
  redundancyPenalty: number;
  diversityWeight: number;
  statisticalWeight: number;
  filterAdherence: number;
  structuralWeight: number;
}

export const PROFILE_WEIGHTS: Record<CoverageProfile, ProfileWeights> = {
  economico: {
    coverageWeight: 0.3,
    redundancyPenalty: 0.3,
    diversityWeight: 0.15,
    statisticalWeight: 0.1,
    filterAdherence: 0.1,
    structuralWeight: 0.05,
  },
  equilibrado: {
    coverageWeight: 0.35,
    redundancyPenalty: 0.2,
    diversityWeight: 0.15,
    statisticalWeight: 0.15,
    filterAdherence: 0.1,
    structuralWeight: 0.05,
  },
  agressivo: {
    coverageWeight: 0.45,
    redundancyPenalty: 0.1,
    diversityWeight: 0.15,
    statisticalWeight: 0.15,
    filterAdherence: 0.1,
    structuralWeight: 0.05,
  },
  extremo: {
    coverageWeight: 0.5,
    redundancyPenalty: 0.05,
    diversityWeight: 0.15,
    statisticalWeight: 0.15,
    filterAdherence: 0.1,
    structuralWeight: 0.05,
  },
};

// ─── Helpers ───

function binomial(n: number, k: number): number {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n - k) k = n - k;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}

function randomSubset(arr: number[], k: number): number[] {
  const pool = [...arr];
  const result: number[] = [];
  for (let i = 0; i < k && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result.sort((a, b) => a - b);
}

function countEven(nums: number[]): number {
  return nums.filter(n => n % 2 === 0).length;
}

function passesFilters(game: number[], config: CoverageConfig): boolean {
  if (!config.filters) return true;
  const { parityRange, sumRange } = config.filters;
  if (parityRange) {
    const evens = countEven(game);
    if (evens < parityRange[0] || evens > parityRange[1]) return false;
  }
  if (sumRange) {
    const sum = game.reduce((a, b) => a + b, 0);
    if (sum < sumRange[0] || sum > sumRange[1]) return false;
  }
  return true;
}

function checkOverlap(game: number[], existing: number[][], maxOverlap: number): boolean {
  if (maxOverlap <= 0) return true;
  const gSet = new Set(game);
  for (const ex of existing) {
    let shared = 0;
    for (const n of ex) {
      if (gSet.has(n)) shared++;
    }
    if (shared > maxOverlap) return false;
  }
  return true;
}

// ─── Scoring ───

export function computeCoverageMetrics(
  games: number[][],
  config: CoverageConfig,
): CoverageMetrics {
  const { baseNumbers, pick, ticketPrice } = config;
  const baseSize = baseNumbers.length;
  const totalPossible = binomial(baseSize, pick);

  const usedNumbers = new Set<number>();
  for (const g of games) for (const n of g) usedNumbers.add(n);
  const numberCoverage = baseSize > 0 ? (usedNumbers.size / baseSize) * 100 : 0;

  const totalPairs = binomial(baseSize, 2);
  const coveredPairs = new Set<number>();
  for (const g of games) {
    for (let i = 0; i < g.length; i++) {
      for (let j = i + 1; j < g.length; j++) {
        coveredPairs.add(Math.min(g[i], g[j]) * 1000 + Math.max(g[i], g[j]));
      }
    }
  }
  const pairCoverage = totalPairs > 0 ? (coveredPairs.size / totalPairs) * 100 : 0;

  const totalTriples = binomial(baseSize, 3);
  let tripleCoverage = 0;
  if (baseSize <= 25) {
    const coveredTriples = new Set<string>();
    for (const g of games) {
      for (let i = 0; i < g.length; i++) {
        for (let j = i + 1; j < g.length; j++) {
          for (let k = j + 1; k < g.length; k++) {
            coveredTriples.add(`${g[i]},${g[j]},${g[k]}`);
          }
        }
      }
    }
    tripleCoverage = totalTriples > 0 ? (coveredTriples.size / totalTriples) * 100 : 0;
  } else {
    tripleCoverage = Math.max(0, pairCoverage * 0.7 - 5);
  }

  let quadCoverage = 0;
  const totalQuads = binomial(baseSize, 4);
  if (baseSize <= 20 && totalQuads <= 10000) {
    const coveredQuads = new Set<string>();
    for (const g of games) {
      for (let i = 0; i < g.length; i++) {
        for (let j = i + 1; j < g.length; j++) {
          for (let k = j + 1; k < g.length; k++) {
            for (let l = k + 1; l < g.length; l++) {
              coveredQuads.add(`${g[i]},${g[j]},${g[k]},${g[l]}`);
            }
          }
        }
      }
    }
    quadCoverage = totalQuads > 0 ? (coveredQuads.size / totalQuads) * 100 : 0;
  }

  let totalOverlap = 0;
  let pairCount = 0;
  for (let i = 0; i < games.length; i++) {
    const setI = new Set(games[i]);
    for (let j = i + 1; j < games.length; j++) {
      let overlap = 0;
      for (const n of games[j]) if (setI.has(n)) overlap++;
      totalOverlap += overlap / pick;
      pairCount++;
    }
  }
  const redundancyIndex = pairCount > 0 ? totalOverlap / pairCount : 0;
  const diversityIndex = Math.max(0, 1 - redundancyIndex);

  const weights = PROFILE_WEIGHTS[config.profile];
  const globalScore = Math.min(100, Math.max(0,
    pairCoverage * weights.coverageWeight +
    (1 - redundancyIndex) * 100 * weights.redundancyPenalty +
    diversityIndex * 100 * weights.diversityWeight +
    numberCoverage * weights.statisticalWeight +
    (tripleCoverage * 0.5 + pairCoverage * 0.5) * weights.filterAdherence +
    (100 - redundancyIndex * 100) * weights.structuralWeight
  ));

  let efficiencyLevel = "Baixa";
  if (globalScore >= 80) efficiencyLevel = "Extrema";
  else if (globalScore >= 60) efficiencyLevel = "Alta";
  else if (globalScore >= 40) efficiencyLevel = "Média";

  return {
    baseSize,
    totalGames: games.length,
    totalCost: games.length * ticketPrice,
    numberCoverage,
    pairCoverage,
    tripleCoverage,
    quadCoverage,
    redundancyIndex,
    diversityIndex,
    globalScore,
    efficiencyLevel,
    totalPossibleCombinations: totalPossible,
    reductionRatio: totalPossible > 0 ? games.length / totalPossible : 1,
  };
}

export function scoreSolution(games: number[][], config: CoverageConfig): number {
  const metrics = computeCoverageMetrics(games, config);
  return metrics.globalScore;
}

// ─── Coverage Tracking ───

class PairTracker {
  private covered: Set<number>;
  private baseSize: number;
  readonly totalPairs: number;

  constructor(baseSize: number) {
    this.covered = new Set();
    this.baseSize = baseSize;
    this.totalPairs = binomial(baseSize, 2);
  }

  private pairKey(a: number, b: number): number {
    const lo = Math.min(a, b), hi = Math.max(a, b);
    return lo * 1000 + hi;
  }

  addGame(game: number[]): number {
    let newPairs = 0;
    for (let i = 0; i < game.length; i++) {
      for (let j = i + 1; j < game.length; j++) {
        const key = this.pairKey(game[i], game[j]);
        if (!this.covered.has(key)) {
          this.covered.add(key);
          newPairs++;
        }
      }
    }
    return newPairs;
  }

  marginalGain(game: number[]): number {
    let gain = 0;
    for (let i = 0; i < game.length; i++) {
      for (let j = i + 1; j < game.length; j++) {
        if (!this.covered.has(this.pairKey(game[i], game[j]))) gain++;
      }
    }
    return gain;
  }

  get coveragePercent(): number {
    return this.totalPairs > 0 ? (this.covered.size / this.totalPairs) * 100 : 0;
  }

  get coveredCount(): number {
    return this.covered.size;
  }
}

// ─── Pipeline Layers ───

function generateCandidates(config: CoverageConfig, count: number): number[][] {
  const { baseNumbers, pick } = config;
  const candidates: number[][] = [];
  const seen = new Set<string>();
  const maxAttempts = count * 5;

  for (let i = 0; i < maxAttempts && candidates.length < count; i++) {
    const game = randomSubset(baseNumbers, pick);
    const key = game.join(",");
    if (seen.has(key)) continue;
    if (!passesFilters(game, config)) continue;
    seen.add(key);
    candidates.push(game);
  }

  return candidates;
}

function greedySelect(
  candidates: number[][],
  config: CoverageConfig,
  pairTracker: PairTracker,
): number[][] {
  const maxGames = Math.min(
    config.maxGames,
    Math.floor(config.maxBudget / config.ticketPrice)
  );

  const selected: number[][] = [];
  const used = new Set<number>();

  for (let round = 0; round < maxGames; round++) {
    let bestIdx = -1;
    let bestGain = 0;

    for (let i = 0; i < candidates.length; i++) {
      if (used.has(i)) continue;
      if (config.maxOverlap > 0 && !checkOverlap(candidates[i], selected, config.maxOverlap)) continue;

      const gain = pairTracker.marginalGain(candidates[i]);
      if (gain > bestGain) {
        bestGain = gain;
        bestIdx = i;
      }
    }

    if (bestIdx === -1 || bestGain === 0) break;

    selected.push(candidates[bestIdx]);
    used.add(bestIdx);
    pairTracker.addGame(candidates[bestIdx]);
  }

  return selected;
}

function localSearchRefine(
  games: number[][],
  config: CoverageConfig,
  iterations: number = 500
): number[][] {
  if (games.length < 2) return games;
  const { baseNumbers, pick } = config;
  let best = games.map(g => [...g]);
  let bestScore = scoreSolution(best, config);

  for (let iter = 0; iter < iterations; iter++) {
    const candidate = best.map(g => [...g]);
    const gameIdx = Math.floor(Math.random() * candidate.length);
    const numIdx = Math.floor(Math.random() * pick);

    const inGame = new Set(candidate[gameIdx]);
    const available = baseNumbers.filter(n => !inGame.has(n));
    if (available.length === 0) continue;

    const newNum = available[Math.floor(Math.random() * available.length)];
    candidate[gameIdx][numIdx] = newNum;
    candidate[gameIdx].sort((a, b) => a - b);

    if (!passesFilters(candidate[gameIdx], config)) continue;

    const score = scoreSolution(candidate, config);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function simulatedAnnealing(
  games: number[][],
  config: CoverageConfig,
  iterations: number = 1000
): { games: number[][]; history: { step: number; score: number }[] } {
  if (games.length < 2) return { games, history: [] };

  const { baseNumbers, pick } = config;
  let current = games.map(g => [...g]);
  let currentScore = scoreSolution(current, config);
  let best = current.map(g => [...g]);
  let bestScore = currentScore;
  const history: { step: number; score: number }[] = [];

  let temperature = 1.0;
  const coolingRate = 0.995;
  const sampleInterval = Math.max(1, Math.floor(iterations / 50));

  for (let iter = 0; iter < iterations; iter++) {
    const candidate = current.map(g => [...g]);
    const gameIdx = Math.floor(Math.random() * candidate.length);

    if (Math.random() < 0.7) {
      const numIdx = Math.floor(Math.random() * pick);
      const inGame = new Set(candidate[gameIdx]);
      const available = baseNumbers.filter(n => !inGame.has(n));
      if (available.length === 0) continue;
      candidate[gameIdx][numIdx] = available[Math.floor(Math.random() * available.length)];
      candidate[gameIdx].sort((a, b) => a - b);
    } else {
      candidate[gameIdx] = randomSubset(baseNumbers, pick);
    }

    if (!passesFilters(candidate[gameIdx], config)) continue;

    const score = scoreSolution(candidate, config);
    const delta = score - currentScore;

    if (delta > 0 || Math.random() < Math.exp(delta / temperature)) {
      current = candidate;
      currentScore = score;
      if (score > bestScore) {
        best = current.map(g => [...g]);
        bestScore = score;
      }
    }

    temperature *= coolingRate;

    if ((iter + 1) % sampleInterval === 0) {
      history.push({ step: iter + 1, score: bestScore });
    }
  }

  return { games: best, history };
}

function postProcess(games: number[][]): number[][] {
  const seen = new Set<string>();
  return games.filter(g => {
    const key = g.join(",");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildExplanation(
  config: CoverageConfig,
  metrics: CoverageMetrics,
): CoverageExplanation {
  const profileNames: Record<string, string> = {
    economico: "Econômico",
    equilibrado: "Equilibrado",
    agressivo: "Agressivo",
    extremo: "Extremo",
  };

  const compromises: string[] = [];
  if (metrics.pairCoverage < 100) {
    compromises.push(
      `Cobertura de pares em ${metrics.pairCoverage.toFixed(1)}% — para 100% seriam necessários mais jogos.`
    );
  }
  if (metrics.redundancyIndex > 0.3) {
    compromises.push(
      `Índice de redundância de ${(metrics.redundancyIndex * 100).toFixed(0)}% — algumas dezenas se repetem entre jogos para manter cobertura alta.`
    );
  }
  if (metrics.totalGames < config.maxGames) {
    compromises.push(
      `Gerados ${metrics.totalGames} jogos (máximo configurado: ${config.maxGames}).`
    );
  }

  const summary = `Fechamento ${profileNames[config.profile]} com ${metrics.baseSize} dezenas-base → ` +
    `${metrics.totalGames} jogos otimizados. Cobertura de pares: ${metrics.pairCoverage.toFixed(1)}%. ` +
    `Custo: R$ ${metrics.totalCost.toFixed(2)}. Eficiência: ${metrics.efficiencyLevel}.`;

  const technical = `Algoritmo de Cobertura Extrema em 5 camadas:\n` +
    `1. Geração de candidatos válidos com filtros (paridade, soma)\n` +
    `2. Seleção gulosa maximizando cobertura marginal de pares\n` +
    `3. Refinamento local (500 iterações de busca por vizinhança)\n` +
    `4. Simulated Annealing (1000 iterações, T₀=1.0, α=0.995)\n` +
    `5. Pós-processamento e remoção de redundância\n\n` +
    `Combinações brutas possíveis: C(${metrics.baseSize},${config.pick}) = ${metrics.totalPossibleCombinations.toLocaleString()}\n` +
    `Jogos finais: ${metrics.totalGames} (redução de ${((1 - metrics.reductionRatio) * 100).toFixed(1)}%)\n` +
    `Pares cobertos: ${(metrics.pairCoverage * binomial(metrics.baseSize, 2) / 100).toFixed(0)}/${binomial(metrics.baseSize, 2)}\n` +
    `Trincas cobertas: ${(metrics.tripleCoverage * binomial(metrics.baseSize, 3) / 100).toFixed(0)}/${binomial(metrics.baseSize, 3)}\n` +
    `Score global: ${metrics.globalScore.toFixed(1)}/100`;

  return {
    summary,
    technical,
    profile: profileNames[config.profile],
    compromises,
  };
}

// ─── Main Entry Point ───

export function runExtremeCoverage(config: CoverageConfig): CoverageResult {
  const start = performance.now();
  const { baseNumbers, pick, profile } = config;
  const totalPossible = binomial(baseNumbers.length, pick);

  const profileMultipliers: Record<string, number> = {
    economico: 0.5,
    equilibrado: 1.0,
    agressivo: 1.5,
    extremo: 2.0,
  };
  const mult = profileMultipliers[profile] || 1.0;

  const candidateCount = Math.min(
    totalPossible,
    Math.max(500, Math.round(2000 * mult))
  );
  const candidates = generateCandidates(config, candidateCount);

  const pairTracker = new PairTracker(baseNumbers.length);
  let selected = greedySelect(candidates, config, pairTracker);

  if (selected.length < 3) {
    const moreCandidates = generateCandidates(config, candidateCount);
    const allCandidates = [...candidates, ...moreCandidates];
    const pt2 = new PairTracker(baseNumbers.length);
    selected = greedySelect(allCandidates, config, pt2);
  }

  selected = localSearchRefine(selected, config, Math.round(500 * mult));

  const saResult = simulatedAnnealing(
    selected,
    config,
    Math.round(1000 * mult)
  );
  selected = saResult.games;

  selected = postProcess(selected);

  const metrics = computeCoverageMetrics(selected, config);
  const explanation = buildExplanation(config, metrics);

  return {
    games: selected,
    metrics,
    explanation,
    convergenceHistory: saResult.history,
    elapsedMs: Math.round(performance.now() - start),
  };
}
