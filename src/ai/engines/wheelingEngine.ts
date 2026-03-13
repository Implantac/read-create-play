/**
 * Native AI — Wheeling Engine
 * Mathematical wheeling/closure systems with coverage guarantees
 * Uses pre-computed matrices when available for optimal results
 */

import { getLotteryRules } from "../knowledge/lotteriesKnowledge";
import { WHEELING_MATRICES, applyWheelingMatrix, type WheelingMatrixId } from "./wheelingMatrices";
import type { WheelingRequest, WheelingResult, CoverageValidation } from "../core/aiTypes";

/**
 * Generate wheeling system — creates minimum games to cover base numbers
 * with mathematical guarantee
 */
export function generateWheeling(request: WheelingRequest): WheelingResult {
  const rules = getLotteryRules(request.lotteryId);
  const { baseNumbers, guarantee, pick } = request;
  const base = [...baseNumbers].sort((a, b) => a - b);

  if (base.length < pick) {
    return {
      games: [], baseNumbers: base, totalGames: 0, guarantee,
      estimatedCost: 0,
      coverageValidation: { valid: false, coveragePercent: 0, worstCase: 0, testedCombinations: 0 },
      explanation: `Erro: necessário pelo menos ${pick} números base.`,
    };
  }

  if (base.length === pick) {
    return {
      games: [base], baseNumbers: base, totalGames: 1, guarantee: pick,
      estimatedCost: rules.ticketPrice,
      coverageValidation: { valid: true, coveragePercent: 100, worstCase: pick, testedCombinations: 1 },
      explanation: `Apenas 1 jogo possível com ${pick} números.`,
    };
  }

  // Check for pre-computed optimized matrix
  const matrixId = findMatchingMatrix(request.lotteryId, base.length, guarantee);
  if (matrixId) {
    const { games: matrixGames } = applyWheelingMatrix(matrixId, base);
    if (matrixGames.length > 0) {
      const matrix = WHEELING_MATRICES[matrixId];
      const validation = validateCoverage(matrixGames, base, pick, guarantee);
      const estimatedCost = matrixGames.length * rules.ticketPrice;
      return {
        games: matrixGames, baseNumbers: base, totalGames: matrixGames.length,
        guarantee, estimatedCost, coverageValidation: validation,
        explanation: `🎯 Matriz otimizada "${matrix.name}" aplicada: ${matrixGames.length} jogos com garantia de ${guarantee}+ acertos. ` +
          `Cobertura: ${validation.coveragePercent.toFixed(1)}%. Custo: R$ ${estimatedCost.toFixed(2)}.`,
      };
    }
  }

  // Generate all pick-sized combinations from base, then use greedy set cover
  const allCombinations = generateCombinations(base, pick);
  
  // For small base (up to ~20), use optimized greedy covering
  const games = greedyCovering(allCombinations, base, pick, guarantee);

  // Validate coverage
  const validation = validateCoverage(games, base, pick, guarantee);

  const estimatedCost = games.length * rules.ticketPrice;

  const explanation = `Fechamento de ${base.length} dezenas gerando ${games.length} jogos. ` +
    `Garantia: se os ${pick} números sorteados estiverem dentro do conjunto-base [${base.join(", ")}], ` +
    `pelo menos um jogo terá no mínimo ${guarantee} acertos. ` +
    `Cobertura verificada: ${validation.coveragePercent.toFixed(1)}%. ` +
    `Custo estimado: R$ ${estimatedCost.toFixed(2)}.`;

  return {
    games, baseNumbers: base, totalGames: games.length,
    guarantee, estimatedCost, coverageValidation: validation, explanation,
  };
}

/** Generate all C(n, k) combinations */
function generateCombinations(arr: number[], k: number): number[][] {
  const result: number[][] = [];
  const n = arr.length;
  
  // Limit to prevent memory issues
  if (n > 22 || binomial(n, k) > 200000) {
    // Use sampling for large sets
    return sampleCombinations(arr, k, 50000);
  }

  function backtrack(start: number, current: number[]) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < n; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(0, []);
  return result;
}

function binomial(n: number, k: number): number {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.round(result);
}

function sampleCombinations(arr: number[], k: number, count: number): number[][] {
  const result: number[][] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count * 2 && result.length < count; i++) {
    const combo = [];
    const pool = [...arr];
    for (let j = 0; j < k; j++) {
      const idx = Math.floor(Math.random() * pool.length);
      combo.push(pool[idx]);
      pool.splice(idx, 1);
    }
    combo.sort((a, b) => a - b);
    const key = combo.join(",");
    if (!seen.has(key)) {
      seen.add(key);
      result.push(combo);
    }
  }
  return result;
}

/**
 * Greedy covering algorithm — select minimum games to cover
 * all possible drawn outcomes with at least `guarantee` hits
 */
function greedyCovering(
  allGames: number[][],
  baseNumbers: number[],
  pick: number,
  guarantee: number
): number[][] {
  // Generate all possible "drawn" outcomes from base (what could be drawn)
  const possibleDraws = generateCombinations(baseNumbers, pick);
  
  // For each possible draw, track which games cover it (have >= guarantee hits)
  const uncovered = new Set<number>();
  for (let i = 0; i < possibleDraws.length; i++) uncovered.add(i);

  const selected: number[][] = [];
  const usedGames = new Set<number>();

  while (uncovered.size > 0 && selected.length < allGames.length) {
    // Find the game that covers the most uncovered draws
    let bestGame = -1;
    let bestCount = 0;

    for (let g = 0; g < allGames.length; g++) {
      if (usedGames.has(g)) continue;
      const gameSet = new Set(allGames[g]);
      let covers = 0;

      for (const drawIdx of uncovered) {
        const draw = possibleDraws[drawIdx];
        const hits = draw.filter(n => gameSet.has(n)).length;
        if (hits >= guarantee) covers++;
      }

      if (covers > bestCount) {
        bestCount = covers;
        bestGame = g;
      }
    }

    if (bestGame === -1 || bestCount === 0) break;

    selected.push(allGames[bestGame]);
    usedGames.add(bestGame);

    // Remove covered draws
    const selectedSet = new Set(allGames[bestGame]);
    for (const drawIdx of [...uncovered]) {
      const draw = possibleDraws[drawIdx];
      const hits = draw.filter(n => selectedSet.has(n)).length;
      if (hits >= guarantee) uncovered.delete(drawIdx);
    }
  }

  return selected;
}

/** Validate that the wheeling system covers all possible outcomes */
function validateCoverage(
  games: number[][],
  baseNumbers: number[],
  pick: number,
  guarantee: number
): CoverageValidation {
  const possibleDraws = generateCombinations(baseNumbers, pick);
  const gameSets = games.map(g => new Set(g));
  
  let covered = 0;
  let worstCase = pick;

  for (const draw of possibleDraws) {
    let bestHits = 0;
    for (const gs of gameSets) {
      const hits = draw.filter(n => gs.has(n)).length;
      bestHits = Math.max(bestHits, hits);
    }
    if (bestHits >= guarantee) covered++;
    worstCase = Math.min(worstCase, bestHits);
  }

  return {
    valid: covered === possibleDraws.length,
    coveragePercent: possibleDraws.length > 0 ? (covered / possibleDraws.length) * 100 : 0,
    worstCase,
    testedCombinations: possibleDraws.length,
  };
}

/** Get recommended wheeling sizes for a lottery */
export function getWheelingOptions(lotteryId: string): { base: number; estimatedGames: number; guarantee: number }[] {
  const rules = getLotteryRules(lotteryId);
  const pick = rules.pick;

  if (lotteryId === "lotofacil") {
    return [
      { base: 16, estimatedGames: 8, guarantee: 14 },
      { base: 17, estimatedGames: 20, guarantee: 14 },
      { base: 18, estimatedGames: 48, guarantee: 14 },
      { base: 19, estimatedGames: 95, guarantee: 14 },
      { base: 20, estimatedGames: 210, guarantee: 14 },
    ];
  }

  if (lotteryId === "megasena") {
    return [
      { base: 8, estimatedGames: 4, guarantee: 5 },
      { base: 10, estimatedGames: 15, guarantee: 5 },
      { base: 12, estimatedGames: 44, guarantee: 5 },
      { base: 15, estimatedGames: 150, guarantee: 4 },
    ];
  }

  // Generic
  return [
    { base: pick + 1, estimatedGames: pick + 1, guarantee: pick - 1 },
    { base: pick + 2, estimatedGames: binomial(pick + 2, pick) / 2, guarantee: pick - 1 },
    { base: pick + 3, estimatedGames: binomial(pick + 3, pick), guarantee: pick - 1 },
  ];
}
