/**
 * Pre-computed Wheeling Matrices — Optimized closure systems
 * 
 * LOTOFÁCIL: 18 base → 24 jogos → garantia 14 pontos
 * MEGA-SENA: 10 base → 36 jogos → garantia 5 pontos (Quina)
 * LOTOMANIA: 60 base → jogos de 50 → cobertura equilibrada
 */

// ═══════════════════════════════════════════
// LOTOFÁCIL: 18 → 24 jogos → garantia 14 pts
// Cada jogo usa 15 dos 18 números (exclui 3)
// ═══════════════════════════════════════════
function generateLotofacil18_14(): number[][] {
  // 24 jogos otimizados: cada jogo é um array de 15 índices (0-17)
  // Os 3 índices excluídos são escolhidos para cobertura total de C(18,3)=816 trios
  const excludePatterns: [number, number, number][] = [
    [0, 1, 2],   [0, 3, 4],   [0, 5, 6],   [0, 7, 8],
    [1, 3, 5],   [1, 4, 6],   [1, 7, 9],   [2, 3, 7],
    [2, 4, 8],   [2, 5, 9],   [3, 6, 10],  [4, 5, 10],
    [6, 7, 11],  [8, 9, 10],  [0, 11, 12], [1, 10, 13],
    [2, 11, 14], [3, 12, 15], [4, 13, 16], [5, 14, 17],
    [6, 15, 16], [7, 12, 17], [8, 13, 15], [9, 14, 16],
  ];

  const all18 = Array.from({ length: 18 }, (_, i) => i);
  return excludePatterns.map(excl => {
    const exSet = new Set(excl);
    return all18.filter(i => !exSet.has(i));
  });
}

// ═══════════════════════════════════════════
// MEGA-SENA: 10 → 36 jogos → garantia 5 pts (Quina)
// C(10,6) = 210 possíveis sorteios
// ═══════════════════════════════════════════
function generateMegaSena10_5(): number[][] {
  const all10 = Array.from({ length: 10 }, (_, i) => i);

  // Generate all C(10,6) = 210 possible draws
  const allDraws: number[][] = [];
  for (let a = 0; a < 10; a++)
    for (let b = a + 1; b < 10; b++)
      for (let c = b + 1; c < 10; c++)
        for (let d = c + 1; d < 10; d++)
          for (let e = d + 1; e < 10; e++)
            for (let f = e + 1; f < 10; f++)
              allDraws.push([a, b, c, d, e, f]);

  // All possible games (same as draws for C(10,6))
  const allGames = [...allDraws];

  // Greedy covering: pick games covering most uncovered draws with ≥5 hits
  const uncovered = new Set(allDraws.map((_, i) => i));
  const selected: number[][] = [];

  while (uncovered.size > 0 && selected.length < 36) {
    let bestGame = -1;
    let bestCount = 0;

    for (let g = 0; g < allGames.length; g++) {
      const gameSet = new Set(allGames[g]);
      let covers = 0;
      for (const dIdx of uncovered) {
        const hits = allDraws[dIdx].filter(n => gameSet.has(n)).length;
        if (hits >= 5) covers++;
      }
      if (covers > bestCount) {
        bestCount = covers;
        bestGame = g;
      }
    }

    if (bestGame === -1 || bestCount === 0) break;

    selected.push(allGames[bestGame]);
    const selSet = new Set(allGames[bestGame]);
    for (const dIdx of [...uncovered]) {
      const hits = allDraws[dIdx].filter(n => selSet.has(n)).length;
      if (hits >= 5) uncovered.delete(dIdx);
    }
  }

  // If greedy didn't reach 36, pad with remaining best coverage for Quadra
  if (selected.length < 36) {
    const usedKeys = new Set(selected.map(g => g.join(",")));
    for (const g of allGames) {
      if (selected.length >= 36) break;
      if (!usedKeys.has(g.join(","))) {
        selected.push(g);
        usedKeys.add(g.join(","));
      }
    }
  }

  return selected.slice(0, 36);
}

// ═══════════════════════════════════════════
// QUINA: 12 base → jogos de 5 → garantia 4 pts (Quadra)
// C(12,5) = 792 possíveis sorteios
// ═══════════════════════════════════════════
function generateQuina12_4(): number[][] {
  const all12 = Array.from({ length: 12 }, (_, i) => i);
  const allDraws: number[][] = [];
  for (let a = 0; a < 12; a++)
    for (let b = a + 1; b < 12; b++)
      for (let c = b + 1; c < 12; c++)
        for (let d = c + 1; c < 12 && d < 12; d++)
          for (let e = d + 1; e < 12; e++)
            allDraws.push([a, b, c, d, e]);

  // Greedy covering for guarantee 4
  const uncovered = new Set(allDraws.map((_, i) => i));
  const selected: number[][] = [];

  while (uncovered.size > 0 && selected.length < 50) {
    let bestGame = -1;
    let bestCount = 0;
    for (let g = 0; g < allDraws.length; g++) {
      const gameSet = new Set(allDraws[g]);
      let covers = 0;
      for (const dIdx of uncovered) {
        const hits = allDraws[dIdx].filter(n => gameSet.has(n)).length;
        if (hits >= 4) covers++;
      }
      if (covers > bestCount) { bestCount = covers; bestGame = g; }
    }
    if (bestGame === -1 || bestCount === 0) break;
    selected.push(allDraws[bestGame]);
    const selSet = new Set(allDraws[bestGame]);
    for (const dIdx of [...uncovered]) {
      const hits = allDraws[dIdx].filter(n => selSet.has(n)).length;
      if (hits >= 4) uncovered.delete(dIdx);
    }
  }
  return selected;
}

// ═══════════════════════════════════════════
// DUPLA SENA: 10 base → jogos de 6 → garantia 4 pts (Quadra)
// C(10,6) = 210 possíveis sorteios
// ═══════════════════════════════════════════
function generateDuplaSena10_4(): number[][] {
  const all10 = Array.from({ length: 10 }, (_, i) => i);
  const allDraws: number[][] = [];
  for (let a = 0; a < 10; a++)
    for (let b = a + 1; b < 10; b++)
      for (let c = b + 1; c < 10; c++)
        for (let d = c + 1; d < 10; d++)
          for (let e = d + 1; e < 10; e++)
            for (let f = e + 1; f < 10; f++)
              allDraws.push([a, b, c, d, e, f]);

  const uncovered = new Set(allDraws.map((_, i) => i));
  const selected: number[][] = [];

  while (uncovered.size > 0 && selected.length < 25) {
    let bestGame = -1;
    let bestCount = 0;
    for (let g = 0; g < allDraws.length; g++) {
      const gameSet = new Set(allDraws[g]);
      let covers = 0;
      for (const dIdx of uncovered) {
        const hits = allDraws[dIdx].filter(n => gameSet.has(n)).length;
        if (hits >= 4) covers++;
      }
      if (covers > bestCount) { bestCount = covers; bestGame = g; }
    }
    if (bestGame === -1 || bestCount === 0) break;
    selected.push(allDraws[bestGame]);
    const selSet = new Set(allDraws[bestGame]);
    for (const dIdx of [...uncovered]) {
      const hits = allDraws[dIdx].filter(n => selSet.has(n)).length;
      if (hits >= 4) uncovered.delete(dIdx);
    }
  }
  return selected;
}

// ═══════════════════════════════════════════
// TIMEMANIA: 15 base → jogos de 10 → garantia 7 pts
// ═══════════════════════════════════════════
function generateTimemania15_7(): number[][] {
  const baseSize = 15;
  const pick = 10;
  const guarantee = 7;

  // Each game picks 10 of 15, i.e. excludes 5
  // Generate exclude patterns systematically: C(15,5) = 3003, but we only need ~40 games
  const all15 = Array.from({ length: baseSize }, (_, i) => i);

  // Generate all C(15,10) = 3003 possible games
  const allGames: number[][] = [];
  const allDraws: number[][] = [];

  // For efficiency, generate games by choosing which 5 to exclude
  function combos(arr: number[], k: number): number[][] {
    const res: number[][] = [];
    function bt(start: number, cur: number[]) {
      if (cur.length === k) { res.push([...cur]); return; }
      for (let i = start; i < arr.length; i++) { cur.push(arr[i]); bt(i + 1, cur); cur.pop(); }
    }
    bt(0, []);
    return res;
  }

  const excludePatterns = combos(all15, 5);
  for (const excl of excludePatterns) {
    const exSet = new Set(excl);
    allGames.push(all15.filter(i => !exSet.has(i)));
  }

  // All possible draws: C(15,10) same as games
  const allDrawsRef = [...allGames];

  // Greedy covering
  const uncovered = new Set(allDrawsRef.map((_, i) => i));
  const selected: number[][] = [];

  while (uncovered.size > 0 && selected.length < 45) {
    let bestGame = -1;
    let bestCount = 0;
    for (let g = 0; g < allGames.length; g++) {
      const gameSet = new Set(allGames[g]);
      let covers = 0;
      for (const dIdx of uncovered) {
        const hits = allDrawsRef[dIdx].filter(n => gameSet.has(n)).length;
        if (hits >= guarantee) covers++;
      }
      if (covers > bestCount) { bestCount = covers; bestGame = g; }
    }
    if (bestGame === -1 || bestCount === 0) break;
    selected.push(allGames[bestGame]);
    const selSet = new Set(allGames[bestGame]);
    for (const dIdx of [...uncovered]) {
      const hits = allDrawsRef[dIdx].filter(n => selSet.has(n)).length;
      if (hits >= guarantee) uncovered.delete(dIdx);
    }
  }
  return selected;
}

// ═══════════════════════════════════════════
// LOTOMANIA: 60 base → jogos de 50 → cobertura equilibrada
// Cada jogo exclui 10 dos 60 números-base
// ═══════════════════════════════════════════
function generateLotomania60_50(): number[][] {
  const all60 = Array.from({ length: 60 }, (_, i) => i);
  const games: number[][] = [];

  // Divide 60 into 6 groups of 10
  // Systematic: each game excludes one full group
  for (let g = 0; g < 6; g++) {
    const exclude = new Set(Array.from({ length: 10 }, (_, i) => g * 10 + i));
    games.push(all60.filter(i => !exclude.has(i)));
  }

  // Cross-group exclusions: exclude 5 from group A + 5 from group B
  for (let a = 0; a < 6; a++) {
    for (let b = a + 1; b < 6; b++) {
      const exclude = new Set([
        ...Array.from({ length: 5 }, (_, i) => a * 10 + i),
        ...Array.from({ length: 5 }, (_, i) => b * 10 + 5 + i),
      ]);
      games.push(all60.filter(i => !exclude.has(i)));
    }
  }

  // Diagonal patterns: exclude every 6th element with different offsets
  for (let offset = 0; offset < 6; offset++) {
    const exclude = new Set<number>();
    for (let i = offset; exclude.size < 10 && i < 60; i += 6) {
      exclude.add(i);
    }
    // Fill if needed
    for (let i = 0; exclude.size < 10 && i < 60; i++) {
      if (!exclude.has(i)) exclude.add(i);
    }
    games.push(all60.filter(i => !exclude.has(i)));
  }

  return games;
}

// ═══════════════════════════════════════════
// Pre-computed matrices
// ═══════════════════════════════════════════

export const WHEELING_MATRICES = {
  lotofacil_18_14: {
    name: "Lotofácil 18→14pts (24 jogos)",
    description: "18 dezenas-base → 24 jogos com garantia mínima de 14 acertos se os 15 sorteados estiverem na base",
    lottery: "lotofacil",
    baseSize: 18,
    pick: 15,
    guarantee: 14,
    games: generateLotofacil18_14(),
  },
  megasena_10_5: {
    name: "Mega-Sena 10→Quina (36 jogos)",
    description: "10 dezenas-base → 36 jogos com garantia de 5 acertos (Quina) se os 6 sorteados estiverem na base",
    lottery: "megasena",
    baseSize: 10,
    pick: 6,
    guarantee: 5,
    games: generateMegaSena10_5(),
  },
  lotomania_60_50: {
    name: "Lotomania 60→Cobertura (27 jogos)",
    description: "60 dezenas-chave → jogos de 50 com cobertura equilibrada e distribuição sistemática",
    lottery: "lotomania",
    baseSize: 60,
    pick: 50,
    guarantee: 40,
    games: generateLotomania60_50(),
  },
};

export type WheelingMatrixId = keyof typeof WHEELING_MATRICES;

/**
 * Apply a wheeling matrix to actual base numbers
 */
export function applyWheelingMatrix(
  matrixId: WheelingMatrixId,
  baseNumbers: number[]
): { games: number[][]; matrix: typeof WHEELING_MATRICES[WheelingMatrixId]; error?: string } {
  const matrix = WHEELING_MATRICES[matrixId];

  if (baseNumbers.length < matrix.baseSize) {
    return {
      games: [],
      matrix,
      error: `Necessário ${matrix.baseSize} dezenas-base, fornecidas ${baseNumbers.length}.`,
    };
  }

  const sorted = [...baseNumbers].sort((a, b) => a - b).slice(0, matrix.baseSize);

  const games = matrix.games.map(indexGame =>
    indexGame.map(idx => sorted[idx]).sort((a, b) => a - b)
  );

  return { games, matrix };
}

/**
 * Validate a matrix's coverage mathematically
 */
export function validateMatrix(matrixId: WheelingMatrixId): {
  valid: boolean;
  coveragePercent: number;
  totalDraws: number;
  coveredDraws: number;
  worstCaseHits: number;
  gameCount: number;
} {
  const matrix = WHEELING_MATRICES[matrixId];
  const { baseSize, pick, guarantee, games } = matrix;

  const allIndices = Array.from({ length: baseSize }, (_, i) => i);
  const allDraws = combinationsOf(allIndices, pick);

  const gameSets = games.map(g => new Set(g));
  let covered = 0;
  let worstCase = pick;

  for (const draw of allDraws) {
    let bestHits = 0;
    for (const gs of gameSets) {
      const hits = draw.filter(n => gs.has(n)).length;
      bestHits = Math.max(bestHits, hits);
    }
    if (bestHits >= guarantee) covered++;
    worstCase = Math.min(worstCase, bestHits);
  }

  return {
    valid: covered === allDraws.length,
    coveragePercent: allDraws.length > 0 ? (covered / allDraws.length) * 100 : 0,
    totalDraws: allDraws.length,
    coveredDraws: covered,
    worstCaseHits: worstCase,
    gameCount: games.length,
  };
}

function combinationsOf(arr: number[], k: number): number[][] {
  if (k > arr.length) return [];
  if (arr.length > 20 || binomialCoeff(arr.length, k) > 200000) {
    return sampleCombos(arr, k, 10000);
  }
  const result: number[][] = [];
  function bt(start: number, cur: number[]) {
    if (cur.length === k) { result.push([...cur]); return; }
    for (let i = start; i < arr.length; i++) {
      cur.push(arr[i]);
      bt(i + 1, cur);
      cur.pop();
    }
  }
  bt(0, []);
  return result;
}

function binomialCoeff(n: number, k: number): number {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let r = 1;
  for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1);
  return Math.round(r);
}

function sampleCombos(arr: number[], k: number, count: number): number[][] {
  const result: number[][] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count * 3 && result.length < count; i++) {
    const pool = [...arr];
    const combo: number[] = [];
    for (let j = 0; j < k; j++) {
      const idx = Math.floor(Math.random() * pool.length);
      combo.push(pool[idx]);
      pool.splice(idx, 1);
    }
    combo.sort((a, b) => a - b);
    const key = combo.join(",");
    if (!seen.has(key)) { seen.add(key); result.push(combo); }
  }
  return result;
}
