/**
 * CoverageCalculator — mede a cobertura real de um conjunto de jogos.
 *
 * Modelo: dado B (dezenas-base, |B|=b), jogos G_i ⊂ B com |G_i|=pick,
 * medimos quantos M-subconjuntos de B estão contidos em algum G_i.
 * Se todo M-subconjunto está coberto, o fechamento garante ≥ M acertos
 * sempre que os sorteados incluam qualquer M-subconjunto de B.
 */

import { binomial, combinations, sampleCombinations, encodeSet } from "./combinatorics";

const MAX_EXACT_UNIVERSE = 200_000;

export interface CoverageReport {
  baseSize: number;
  pick: number;
  m: number;
  totalMSubsets: number;         // C(b,m) — teórico
  testedMSubsets: number;        // universo efetivamente testado (amostragem quando grande)
  coveredMSubsets: number;
  coveragePercent: number;
  redundancyPercent: number;
  exhaustive: boolean;
}

/** Retorna todos M-subconjuntos de um jogo (como strings canônicas). */
export function gameMSubsets(gameIdx: number[], m: number): string[] {
  const k = gameIdx.length;
  if (m > k) return [];
  const sorted = gameIdx.slice().sort((a, b) => a - b);
  const combos = combinations(k, m);
  return combos.map(c => c.map(i => sorted[i]).join(","));
}

/** Mede cobertura de M-subconjuntos de B por um conjunto de jogos (indices em B). */
export function calculateCoverage(
  games: number[][],
  baseSize: number,
  m: number,
): CoverageReport {
  const pick = games[0]?.length ?? 0;
  const totalUniverse = binomial(baseSize, m);
  const exhaustive = totalUniverse <= MAX_EXACT_UNIVERSE;

  const universe = exhaustive
    ? combinations(baseSize, m).map(c => c.join(","))
    : sampleCombinations(baseSize, m, MAX_EXACT_UNIVERSE).map(c => c.join(","));

  const universeSet = new Set(universe);

  const hitCount = new Map<string, number>();
  for (const g of games) {
    for (const s of gameMSubsets(g, m)) {
      if (universeSet.has(s)) {
        hitCount.set(s, (hitCount.get(s) || 0) + 1);
      }
    }
  }

  const covered = hitCount.size;
  const totalHits = [...hitCount.values()].reduce((a, b) => a + b, 0);
  const redundantHits = totalHits - covered;
  const totalGameSubsetSlots = games.length * binomial(pick, m);

  return {
    baseSize,
    pick,
    m,
    totalMSubsets: totalUniverse,
    testedMSubsets: universe.length,
    coveredMSubsets: covered,
    coveragePercent: universe.length > 0 ? (covered / universe.length) * 100 : 0,
    redundancyPercent: totalGameSubsetSlots > 0
      ? (redundantHits / totalGameSubsetSlots) * 100
      : 0,
    exhaustive,
  };
}

/** Encoding helpers, exported for reuse. */
export { encodeSet };
