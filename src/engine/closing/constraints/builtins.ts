/**
 * Biblioteca de constraints universais. Todos são funções puras e não
 * dependem de modalidade específica: recebem `ConstraintContext.lottery`
 * (universo/pick) e usam apenas matemática combinatória.
 */

import type { ConstraintDefinition, ConstraintContext } from "./types";

// ─── Helpers matemáticos ──────────────────────────────────────────────
const PRIMES_UP_TO_100 = new Set([
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47,
  53, 59, 61, 67, 71, 73, 79, 83, 89, 97,
]);
const FIBS_UP_TO_100 = new Set([1, 2, 3, 5, 8, 13, 21, 34, 55, 89]);

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
const countIf = (arr: number[], pred: (n: number) => boolean) =>
  arr.reduce((c, n) => c + (pred(n) ? 1 : 0), 0);
const maxRun = (sortedAsc: number[]): number => {
  let best = 1, cur = 1;
  for (let i = 1; i < sortedAsc.length; i++) {
    cur = sortedAsc[i] === sortedAsc[i - 1] + 1 ? cur + 1 : 1;
    if (cur > best) best = cur;
  }
  return sortedAsc.length ? best : 0;
};

// ─── Aritméticos ──────────────────────────────────────────────────────
export const parityConstraint: ConstraintDefinition<{ minEvens: number; maxEvens: number }> = {
  id: "parity",
  label: "Pares × Ímpares",
  category: "arithmetic",
  description: "Exige uma faixa de dezenas pares por jogo.",
  defaultParams: { minEvens: 0, maxEvens: 99 },
  test: (game, p) => {
    const evens = countIf(game, n => n % 2 === 0);
    return evens >= p.minEvens && evens <= p.maxEvens;
  },
};

export const sumConstraint: ConstraintDefinition<{ min: number; max: number }> = {
  id: "sum",
  label: "Soma total",
  category: "arithmetic",
  description: "Restringe a soma das dezenas do jogo.",
  defaultParams: { min: 0, max: 9999 },
  test: (game, p) => {
    const s = sum(game);
    return s >= p.min && s <= p.max;
  },
};

export const primesConstraint: ConstraintDefinition<{ min: number; max: number }> = {
  id: "primes",
  label: "Números primos",
  category: "arithmetic",
  description: "Faixa aceitável de primos por jogo.",
  defaultParams: { min: 0, max: 99 },
  test: (game, p) => {
    const primes = countIf(game, n => PRIMES_UP_TO_100.has(n));
    return primes >= p.min && primes <= p.max;
  },
};

export const fibonacciConstraint: ConstraintDefinition<{ min: number; max: number }> = {
  id: "fibonacci",
  label: "Fibonacci",
  category: "arithmetic",
  description: "Faixa aceitável de números de Fibonacci por jogo.",
  defaultParams: { min: 0, max: 99 },
  test: (game, p) => {
    const fibs = countIf(game, n => FIBS_UP_TO_100.has(n));
    return fibs >= p.min && fibs <= p.max;
  },
};

export const multiplesConstraint: ConstraintDefinition<{ factor: number; min: number; max: number }> = {
  id: "multiples",
  label: "Múltiplos",
  category: "arithmetic",
  description: "Faixa aceitável de múltiplos de N por jogo.",
  defaultParams: { factor: 3, min: 0, max: 99 },
  test: (game, p) => {
    if (p.factor <= 1) return true;
    const mults = countIf(game, n => n % p.factor === 0);
    return mults >= p.min && mults <= p.max;
  },
};

// ─── Geométricos ──────────────────────────────────────────────────────
export const consecutiveConstraint: ConstraintDefinition<{ maxRun: number }> = {
  id: "consecutive",
  label: "Consecutivos máx.",
  category: "geometric",
  description: "Rejeita jogos com sequências consecutivas maiores que o limite.",
  defaultParams: { maxRun: 3 },
  test: (game, p) => {
    if (p.maxRun <= 0) return true;
    const sorted = [...game].sort((a, b) => a - b);
    return maxRun(sorted) <= p.maxRun;
  },
};

/**
 * Moldura × Miolo — genérico. Divide o universo por linhas/colunas
 * quadradas quando possível (Lotofácil 5x5, Quina 8x10, etc.).
 */
export const frameCoreConstraint: ConstraintDefinition<{
  cols: number; minFrame: number; maxFrame: number;
}> = {
  id: "frameCore",
  label: "Moldura × Miolo",
  category: "geometric",
  description: "Faixa aceitável de dezenas na moldura (borda da grade).",
  defaultParams: { cols: 5, minFrame: 0, maxFrame: 25 },
  test: (game, p, ctx) => {
    const cols = Math.max(2, p.cols || 5);
    const rows = Math.max(2, Math.ceil(ctx.lottery.totalNumbers / cols));
    const inFrame = (n: number) => {
      const idx = n - 1;
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      return r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
    };
    const frame = countIf(game, inFrame);
    return frame >= p.minFrame && frame <= p.maxFrame;
  },
};

export const rowsColsConstraint: ConstraintDefinition<{
  cols: number; minRowsUsed: number; minColsUsed: number;
}> = {
  id: "rowsCols",
  label: "Linhas / Colunas",
  category: "geometric",
  description: "Exige que o jogo cubra ao menos N linhas e N colunas da grade.",
  defaultParams: { cols: 5, minRowsUsed: 3, minColsUsed: 3 },
  test: (game, p) => {
    const cols = Math.max(2, p.cols || 5);
    const rows = new Set<number>();
    const colsUsed = new Set<number>();
    for (const n of game) {
      const idx = n - 1;
      rows.add(Math.floor(idx / cols));
      colsUsed.add(idx % cols);
    }
    return rows.size >= p.minRowsUsed && colsUsed.size >= p.minColsUsed;
  },
};

export const groupsConstraint: ConstraintDefinition<{ groupSize: number; minGroupsUsed: number }> = {
  id: "groups",
  label: "Grupos numéricos",
  category: "geometric",
  description: "Divide o universo em faixas contíguas e exige diversidade.",
  defaultParams: { groupSize: 5, minGroupsUsed: 3 },
  test: (game, p) => {
    const gs = Math.max(1, p.groupSize);
    const used = new Set<number>();
    for (const n of game) used.add(Math.floor((n - 1) / gs));
    return used.size >= p.minGroupsUsed;
  },
};

export const excludedNumbersConstraint: ConstraintDefinition<{ excluded: number[] }> = {
  id: "excluded",
  label: "Dezenas eliminadas",
  category: "geometric",
  description: "Rejeita jogos que contenham qualquer dezena eliminada.",
  defaultParams: { excluded: [] },
  test: (game, p) => {
    if (!p.excluded?.length) return true;
    const banned = new Set(p.excluded);
    return !game.some(n => banned.has(n));
  },
};

// ─── Estatísticos ─────────────────────────────────────────────────────
export const frequencyConstraint: ConstraintDefinition<{ minHotCount: number; hotThreshold: number }> = {
  id: "frequency",
  label: "Frequência (quentes)",
  category: "statistical",
  description: "Exige um mínimo de dezenas 'quentes' por jogo.",
  defaultParams: { minHotCount: 0, hotThreshold: 0 },
  test: (game, p, ctx) => {
    if (!ctx.frequencies || p.minHotCount <= 0) return true;
    const hot = countIf(game, n => (ctx.frequencies![n] ?? 0) >= p.hotThreshold);
    return hot >= p.minHotCount;
  },
};

export const delayConstraint: ConstraintDefinition<{ maxDelay: number }> = {
  id: "delay",
  label: "Atraso máx.",
  category: "statistical",
  description: "Rejeita jogos com dezenas atrasadas acima do limite.",
  defaultParams: { maxDelay: 0 },
  test: (game, p, ctx) => {
    if (!ctx.delays || p.maxDelay <= 0) return true;
    return game.every(n => (ctx.delays![n] ?? 0) <= p.maxDelay);
  },
};

// ─── Registry ─────────────────────────────────────────────────────────
export const CONSTRAINT_REGISTRY: Record<string, ConstraintDefinition<unknown>> = {
  parity: parityConstraint as ConstraintDefinition<unknown>,
  sum: sumConstraint as ConstraintDefinition<unknown>,
  primes: primesConstraint as ConstraintDefinition<unknown>,
  fibonacci: fibonacciConstraint as ConstraintDefinition<unknown>,
  multiples: multiplesConstraint as ConstraintDefinition<unknown>,
  consecutive: consecutiveConstraint as ConstraintDefinition<unknown>,
  frameCore: frameCoreConstraint as ConstraintDefinition<unknown>,
  rowsCols: rowsColsConstraint as ConstraintDefinition<unknown>,
  groups: groupsConstraint as ConstraintDefinition<unknown>,
  excluded: excludedNumbersConstraint as ConstraintDefinition<unknown>,
  frequency: frequencyConstraint as ConstraintDefinition<unknown>,
  delay: delayConstraint as ConstraintDefinition<unknown>,
};

export const CONSTRAINT_LIST = Object.values(CONSTRAINT_REGISTRY);

export type { ConstraintContext };
