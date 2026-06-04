import type { DrawResult } from "@/data/lotteries";

export type WorksheetMatrixMode = "base" | "fixed-plus-pool" | "gf";

export interface WorksheetMatrixPreset {
  id: string;
  label: string;
  sheetName: string;
  mode: WorksheetMatrixMode;
  baseCount?: number;
  fixedCount?: number;
  poolCount?: number;
  eliminatedCount?: number;
  gameCount: number;
  description: string;
}

export interface WorksheetGameAnalysis {
  index: number;
  numbers: number[];
  hits: number;
  missing: number[];
  sum: number;
  even: number;
  odd: number;
  primes: number;
  fibonacci: number;
  repeatedFromPrevious: number;
  moldura: number;
  lines: number[];
  columns: number[];
}

export interface WorksheetMatrixResult {
  games: WorksheetGameAnalysis[];
  bestHits: number;
  hitDistribution: Record<number, number>;
  totalCost: number;
}

export interface WorksheetBacktestResult {
  totalDraws: number;
  avgHits: number;
  totalPrizes: number;
  prizeRate: number;
  hitsDistribution: Record<number, number>;
  bestHitsInPeriod: number;
}

export const LOTOFACIL_WORKSHEET_PRESETS: WorksheetMatrixPreset[] = [
  {
    id: "plan21x50",
    label: "Plan 21x50",
    sheetName: "PLAN 21X50",
    mode: "base",
    baseCount: 21,
    gameCount: 50,
    description: "21 dezenas selecionadas para gerar 50 jogos equilibrados de 15 dezenas.",
  },
  {
    id: "plan19x5",
    label: "Plan 19x5",
    sheetName: "PLAN 19x5",
    mode: "base",
    baseCount: 19,
    gameCount: 5,
    description: "Fechamento economico com 19 dezenas e 5 jogos.",
  },
  {
    id: "plan17x8",
    label: "Plan 17x8",
    sheetName: "PLAN 17x8",
    mode: "base",
    baseCount: 17,
    gameCount: 8,
    description: "17 dezenas-base para 8 jogos com boa repeticao interna.",
  },
  {
    id: "plan13x6",
    label: "Plan 13x6",
    sheetName: "PLAN 13x6",
    mode: "fixed-plus-pool",
    fixedCount: 13,
    poolCount: 12,
    gameCount: 6,
    description: "13 dezenas fixas e combinacao rotativa com as 12 restantes.",
  },
  {
    id: "six-absent",
    label: "6 Ausentes",
    sheetName: "6 AUSENTES",
    mode: "fixed-plus-pool",
    fixedCount: 6,
    poolCount: 14,
    gameCount: 15,
    description: "6 ausentes fixas combinadas com 14 dezenas repetidas/selecionadas.",
  },
  {
    id: "plan6x13",
    label: "Plan 6x13",
    sheetName: "PLAN 6x13",
    mode: "fixed-plus-pool",
    fixedCount: 6,
    poolCount: 13,
    gameCount: 38,
    description: "6 dezenas fixas e 13 dezenas-base em 38 jogos.",
  },
  {
    id: "plan-gf",
    label: "Plan GF",
    sheetName: "PLAN GF",
    mode: "gf",
    fixedCount: 3,
    eliminatedCount: 2,
    gameCount: 10,
    description: "3 fixas, 2 eliminadas e grupos rotativos para gerar 10 jogos.",
  },
];

const LOTOFACIL_PRICE = 3;
const PRIMES = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23]);
const FIBONACCI = new Set([1, 2, 3, 5, 8, 13, 21]);
const MOLDURA = new Set([1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25]);

export function getPresetInputSize(preset: WorksheetMatrixPreset) {
  if (preset.mode === "base") return preset.baseCount ?? 0;
  if (preset.mode === "fixed-plus-pool") return (preset.fixedCount ?? 0) + (preset.poolCount ?? 0);
  return (preset.fixedCount ?? 0) + (preset.eliminatedCount ?? 0);
}

export function selectTopLotofacilNumbers(rankedNumbers: number[], count: number) {
  return rankedNumbers
    .filter((n) => n >= 1 && n <= 25)
    .slice(0, count)
    .sort((a, b) => a - b);
}

export function generateWorksheetMatrixGames(
  preset: WorksheetMatrixPreset,
  selectedNumbers: number[],
): number[][] {
  const unique = [...new Set(selectedNumbers)].filter((n) => n >= 1 && n <= 25).sort((a, b) => a - b);

  if (preset.mode === "base") {
    return generateBalancedBaseGames(unique.slice(0, preset.baseCount), preset.gameCount);
  }

  if (preset.mode === "fixed-plus-pool") {
    const fixed = unique.slice(0, preset.fixedCount);
    const pool = unique.slice(preset.fixedCount, (preset.fixedCount ?? 0) + (preset.poolCount ?? 0));
    return generateFixedPlusPoolGames(fixed, pool, preset.gameCount);
  }

  const fixed = unique.slice(0, preset.fixedCount);
  const eliminated = new Set(unique.slice(preset.fixedCount, (preset.fixedCount ?? 0) + (preset.eliminatedCount ?? 0)));
  const pool = Array.from({ length: 25 }, (_, i) => i + 1).filter((n) => !fixed.includes(n) && !eliminated.has(n));
  return generateGroupedFixedGames(fixed, pool, preset.gameCount);
}

export function analyzeWorksheetGames(
  games: number[][],
  draw?: DrawResult | null,
  previousDraw?: DrawResult | null,
): WorksheetMatrixResult {
  const drawSet = new Set(draw?.numbers ?? []);
  const previousSet = new Set(previousDraw?.numbers ?? []);
  const hitDistribution: Record<number, number> = {};

  const analyzed = games.map((numbers, idx) => {
    const hits = draw ? numbers.filter((n) => drawSet.has(n)).length : 0;
    const missing = draw ? numbers.filter((n) => !drawSet.has(n)) : [];
    hitDistribution[hits] = (hitDistribution[hits] ?? 0) + 1;

    return {
      index: idx + 1,
      numbers,
      hits,
      missing,
      sum: numbers.reduce((acc, n) => acc + n, 0),
      even: numbers.filter((n) => n % 2 === 0).length,
      odd: numbers.filter((n) => n % 2 !== 0).length,
      primes: numbers.filter((n) => PRIMES.has(n)).length,
      fibonacci: numbers.filter((n) => FIBONACCI.has(n)).length,
      repeatedFromPrevious: previousDraw ? numbers.filter((n) => previousSet.has(n)).length : 0,
      moldura: numbers.filter((n) => MOLDURA.has(n)).length,
      lines: countGridAxis(numbers, "line"),
      columns: countGridAxis(numbers, "column"),
    };
  });

  return {
    games: analyzed,
    bestHits: analyzed.reduce((best, game) => Math.max(best, game.hits), 0),
    hitDistribution,
    totalCost: games.length * LOTOFACIL_PRICE,
  };
}

export function runWorksheetBacktest(
  games: number[][],
  draws: DrawResult[],
  period: number = 100
): WorksheetBacktestResult {
  const periodDraws = draws.slice(0, Math.min(period, draws.length));
  let totalHits = 0;
  let totalPrizes = 0;
  const hitsDistribution: Record<number, number> = {};
  let bestHitsInPeriod = 0;

  periodDraws.forEach(draw => {
    const drawSet = new Set(draw.numbers);
    games.forEach(game => {
      const hits = game.filter(n => drawSet.has(n)).length;
      totalHits += hits;
      if (hits >= 11) totalPrizes++;
      hitsDistribution[hits] = (hitsDistribution[hits] || 0) + 1;
      if (hits > bestHitsInPeriod) bestHitsInPeriod = hits;
    });
  });

  const totalGamesChecked = games.length * periodDraws.length;

  return {
    totalDraws: periodDraws.length,
    avgHits: totalGamesChecked > 0 ? parseFloat((totalHits / totalGamesChecked).toFixed(2)) : 0,
    totalPrizes,
    prizeRate: totalGamesChecked > 0 ? parseFloat(((totalPrizes / totalGamesChecked) * 100).toFixed(2)) : 0,
    hitsDistribution,
    bestHitsInPeriod
  };
}

function generateBalancedBaseGames(baseNumbers: number[], gameCount: number) {
  if (baseNumbers.length < 15) return [];
  const games: number[][] = [];
  const usage = new Map(baseNumbers.map((n) => [n, 0]));
  const seen = new Set<string>();

  for (let attempt = 0; games.length < gameCount && attempt < gameCount * 12; attempt++) {
    const rotated = [...baseNumbers].sort((a, b) => {
      const usageDiff = (usage.get(a) ?? 0) - (usage.get(b) ?? 0);
      if (usageDiff !== 0) return usageDiff;
      return ((a + attempt * 7) % 25) - ((b + attempt * 7) % 25);
    });
    const game = rotated.slice(0, 15).sort((a, b) => a - b);
    const key = game.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    games.push(game);
    game.forEach((n) => usage.set(n, (usage.get(n) ?? 0) + 1));
  }

  return games;
}

function generateFixedPlusPoolGames(fixed: number[], pool: number[], gameCount: number) {
  const take = 15 - fixed.length;
  if (fixed.length <= 0 || pool.length < take) return [];
  const games: number[][] = [];
  const seen = new Set<string>();
  for (let i = 0; games.length < gameCount && i < gameCount * 8; i++) {
    const rotated = rotate(pool, i * 2);
    const selection = rotated.slice(0, take);
    const game = [...fixed, ...selection].sort((a, b) => a - b);
    const key = game.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    games.push(game);
  }
  return games;
}

function generateGroupedFixedGames(fixed: number[], pool: number[], gameCount: number) {
  if (fixed.length !== 3 || pool.length < 12) return [];
  const groups = [0, 1, 2, 3, 4].map((idx) => pool.slice(idx * 4, idx * 4 + 4)).filter((g) => g.length === 4);
  const patterns = [
    [0, 1, 2], [0, 1, 3], [0, 1, 4], [0, 2, 3], [0, 2, 4],
    [0, 3, 4], [1, 2, 3], [1, 2, 4], [1, 3, 4], [2, 3, 4],
  ];
  return patterns.slice(0, gameCount).map((pattern) =>
    [...fixed, ...pattern.flatMap((idx) => groups[idx])].sort((a, b) => a - b)
  );
}

function rotate(values: number[], offset: number) {
  if (values.length === 0) return [];
  const normalized = offset % values.length;
  return [...values.slice(normalized), ...values.slice(0, normalized)];
}

function countGridAxis(numbers: number[], axis: "line" | "column") {
  const counts = [0, 0, 0, 0, 0];
  numbers.forEach((n) => {
    const zero = n - 1;
    const index = axis === "line" ? Math.floor(zero / 5) : zero % 5;
    counts[index]++;
  });
  return counts;
}
