/**
 * GreedyOptimizer — algoritmo clássico de set cover para gerar fechamentos.
 *
 * Objetivo: cobrir todos os M-subconjuntos das dezenas-base B usando o
 * menor número possível de jogos de tamanho `pick`. A heurística gulosa
 * (Chvátal 1979) garante fator log|U| do ótimo.
 *
 * Fluxo:
 *   1. Universo U = todos M-subconjuntos de B.
 *   2. Candidatos = todos jogos G ⊂ B com |G|=pick.
 *      Se explodir combinatorialmente, amostramos candidatos.
 *   3. Repetir: escolher G que cobre mais M-subconjuntos ainda descobertos;
 *      remover subconjuntos cobertos de U. Parar quando U vazio ou
 *      maxGames atingido.
 */

import { binomial, combinations, sampleCombinations } from "./combinatorics";
import { gameMSubsets } from "./CoverageCalculator";

const MAX_CANDIDATE_GAMES = 20_000;
const MAX_UNIVERSE = 200_000;

export interface GreedyOptions {
  maxGames?: number;
  /** Sementes iniciais (jogos que já devem entrar). Índices dentro de B. */
  seeds?: number[][];
  /** Se true, para assim que universo é coberto (default true). */
  stopWhenCovered?: boolean;
}

export interface GreedyOutput {
  /** Jogos escolhidos como índices em B. */
  games: number[][];
  coveredCount: number;
  universeSize: number;
  candidatePoolSize: number;
  exhaustiveUniverse: boolean;
  exhaustiveCandidates: boolean;
  iterations: number;
}

export function greedyCover(
  baseSize: number,
  pick: number,
  m: number,
  opts: GreedyOptions = {},
): GreedyOutput {
  if (baseSize < pick) {
    return {
      games: [], coveredCount: 0, universeSize: 0, candidatePoolSize: 0,
      exhaustiveUniverse: true, exhaustiveCandidates: true, iterations: 0,
    };
  }

  const totalUniverse = binomial(baseSize, m);
  const exhaustiveUniverse = totalUniverse <= MAX_UNIVERSE;
  const universeArr = exhaustiveUniverse
    ? combinations(baseSize, m)
    : sampleCombinations(baseSize, m, MAX_UNIVERSE);
  const universe = new Set(universeArr.map(c => c.join(",")));

  const totalCandidates = binomial(baseSize, pick);
  const exhaustiveCandidates = totalCandidates <= MAX_CANDIDATE_GAMES;
  const candidatePool = exhaustiveCandidates
    ? combinations(baseSize, pick)
    : sampleCombinations(baseSize, pick, MAX_CANDIDATE_GAMES);

  // Pré-computa quais M-subconjuntos cada candidato cobre.
  const candidateSubsets: string[][] = candidatePool.map(c => gameMSubsets(c, m));

  const chosen: number[][] = [];
  const uncovered = new Set(universe);

  // Aplica sementes primeiro.
  if (opts.seeds) {
    for (const seed of opts.seeds) {
      chosen.push(seed.slice().sort((a, b) => a - b));
      for (const s of gameMSubsets(seed, m)) uncovered.delete(s);
    }
  }

  const maxGames = opts.maxGames ?? Number.MAX_SAFE_INTEGER;
  const stopWhenCovered = opts.stopWhenCovered !== false;
  let iterations = 0;
  const usedIdx = new Set<number>();

  while (chosen.length < maxGames && (uncovered.size > 0 || !stopWhenCovered)) {
    iterations++;
    let bestIdx = -1;
    let bestGain = -1;

    for (let i = 0; i < candidatePool.length; i++) {
      if (usedIdx.has(i)) continue;
      let gain = 0;
      const subs = candidateSubsets[i];
      for (const s of subs) if (uncovered.has(s)) gain++;
      if (gain > bestGain) {
        bestGain = gain;
        bestIdx = i;
        if (gain === subs.length) break; // não dá pra melhorar nesse round
      }
    }

    if (bestIdx < 0 || bestGain <= 0) break;

    usedIdx.add(bestIdx);
    chosen.push(candidatePool[bestIdx]);
    for (const s of candidateSubsets[bestIdx]) uncovered.delete(s);

    if (uncovered.size === 0 && stopWhenCovered) break;
  }

  return {
    games: chosen,
    coveredCount: universe.size - uncovered.size,
    universeSize: universe.size,
    candidatePoolSize: candidatePool.length,
    exhaustiveUniverse,
    exhaustiveCandidates,
    iterations,
  };
}
