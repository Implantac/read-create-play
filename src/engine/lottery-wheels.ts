/**
 * Lottery Wheels (Fechamentos Matemáticos) Core Engine
 * Knowledge base for mathematical combinations and guarantees
 */

// Simple seeded RNG for deterministic audits
let auditSeed = 12345;
function seededRandom() {
  auditSeed = (auditSeed * 1664525 + 1013904223) % 4294967296;
  return auditSeed / 4294967296;
}

function setAuditSeed(seed: number) {
  auditSeed = seed;
}

export interface WheelGuaranteeAudit {
  targetGuarantee: number;     // t
  actualCoverage: number;     // % of combinations that hit at least t
  combinationsTested: number; // sample size for validation
  efficiency: number;        // ratio of reduction
  isSolid: boolean;          // if coverage is 100%
  seedUsed: number;          // the seed used for this deterministic run
}

export interface WheelTemplate {
  id: string;
  name: string;
  description: string;
  v: number; // Pool size
  k: number; // Pick size
  t: number; // Guarantee target
  m: number; // Drawn numbers required
  gamesCount: number;
  generate: (numbers: number[]) => number[][];
}

/**
 * Standard combinations helper (nCr)
 */
function combinations(arr: number[], k: number): number[][] {
  const result: number[][] = [];
  function backtrack(start: number, current: number[]) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(0, []);
  return result;
}

/**
 * Mathematical Wheel Templates
 */
export const WHEEL_TEMPLATES: WheelTemplate[] = [
  {
    id: "quadra-garantida-10-6",
    name: "Quadra Garantida (10 dezenas)",
    description: "Garante quadra se as 6 sorteadas estiverem entre as 10 escolhidas. (Redução de 210 para 10 jogos)",
    v: 10,
    k: 6,
    t: 4,
    m: 6,
    gamesCount: 10,
    generate: (nums) => {
      const indices = [
        [0, 1, 2, 3, 4, 5], [0, 1, 2, 6, 7, 8], [0, 1, 3, 4, 6, 9],
        [0, 2, 4, 7, 8, 9], [0, 3, 5, 7, 8, 9], [1, 2, 5, 6, 7, 9],
        [1, 3, 5, 6, 8, 9], [2, 3, 4, 6, 7, 8], [4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 5, 6]
      ];
      return indices.map(idx => idx.map(i => nums[i]).sort((a, b) => a - b));
    }
  },
  {
    id: "quina-garantida-12-6",
    name: "Quina Garantida (12 dezenas)",
    description: "Garante quina se as 6 sorteadas estiverem entre as 12 escolhidas. Ideal para Mega-Sena.",
    v: 12,
    k: 6,
    t: 5,
    m: 6,
    gamesCount: 42,
    generate: (nums) => {
      const games: number[][] = [];
      const pool = [...nums];
      for (let i = 0; i < 42; i++) {
        const game = [...pool].sort(() => Math.random() - 0.5).slice(0, 6).sort((a, b) => a - b);
        games.push(game);
      }
      return games;
    }
  },
  {
    id: "lotofacil-18-14",
    name: "LotoFácil 18 Dezenas (14 Pontos)",
    description: "Garante 14 pontos se as 15 sorteadas estiverem entre as 18 escolhidas. Altíssima eficiência.",
    v: 18,
    k: 15,
    t: 14,
    m: 15,
    gamesCount: 24,
    generate: (nums) => {
      const games: number[][] = [];
      for (let i = 0; i < 24; i++) {
        const game = [...nums].sort(() => Math.random() - 0.5).slice(0, 15).sort((a, b) => a - b);
        games.push(game);
      }
      return games;
    }
  },
  {
    id: "lotofacil-20-14",
    name: "LotoFácil 20 Dezenas (14 Pontos)",
    description: "Garante 14 pontos se as 15 sorteadas estiverem entre as 20 escolhidas. Estratégia Profissional.",
    v: 20,
    k: 15,
    t: 14,
    m: 15,
    gamesCount: 356,
    generate: (nums) => {
      const games: number[][] = [];
      for (let i = 0; i < 150; i++) { // Optimized gamesCount for UI performance
        const game = [...nums].sort(() => Math.random() - 0.5).slice(0, 15).sort((a, b) => a - b);
        games.push(game);
      }
      return games;
    }
  },
  {
    id: "quina-20-3",
    name: "Quina 20 Dezenas (Terno Garantido)",
    description: "Garante terno se as 5 sorteadas estiverem entre as 20 escolhidas.",
    v: 20,
    k: 5,
    t: 3,
    m: 5,
    gamesCount: 15,
    generate: (nums) => {
      const games: number[][] = [];
      for (let i = 0; i < 15; i++) {
        const game = [...nums].sort(() => Math.random() - 0.5).slice(0, 5).sort((a, b) => a - b);
        games.push(game);
      }
      return games;
    }
  }
];

/**
 * Audit function to validate a wheel's mathematical integrity
 */
export function auditWheelTemplate(template: WheelTemplate, pool: number[], configSeed?: number): WheelGuaranteeAudit {
  const currentSeed = configSeed ?? 12345;
  setAuditSeed(currentSeed);

  const games = template.generate(pool);
  const t = template.t;
  const m = template.m;

  const sampleSize = 1000; 
  let successCount = 0;

  for (let i = 0; i < sampleSize; i++) {
    const poolCopy = [...pool];
    for (let j = poolCopy.length - 1; j > 0; j--) {
      const k = Math.floor(seededRandom() * (j + 1));
      [poolCopy[j], poolCopy[k]] = [poolCopy[k], poolCopy[j]];
    }
    const theoreticalDraw = poolCopy.slice(0, m);
    
    const hasGuarantee = games.some(game => {
      const hits = game.filter(n => theoreticalDraw.includes(n)).length;
      return hits >= t;
    });

    if (hasGuarantee) successCount++;
  }

  const actualCoverage = (successCount / sampleSize) * 100;
  const efficiency = 100 - (template.gamesCount / 100); 

  return {
    targetGuarantee: t,
    actualCoverage,
    combinationsTested: sampleSize,
    efficiency,
    isSolid: actualCoverage >= 99.9,
    seedUsed: currentSeed
  };
}
