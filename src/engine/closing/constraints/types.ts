/**
 * Constraint Solver — infraestrutura de filtros pós-geração agnóstica de modalidade.
 * Plugável sobre qualquer gerador do ClosingEngine. Cada constraint é uma função
 * pura `test(game, ctx) => boolean`. A composição é AND.
 */

import type { LotteryParams } from "../core/types";

export interface ConstraintContext {
  lottery: LotteryParams;
  baseNumbers: number[];
  /** Frequências históricas (dezena -> ocorrências), opcional. */
  frequencies?: Record<number, number>;
  /** Atrasos (dezena -> sorteios sem sair), opcional. */
  delays?: Record<number, number>;
}

export interface ConstraintDefinition<P = unknown> {
  id: string;
  label: string;
  category: "geometric" | "arithmetic" | "statistical";
  description: string;
  /** Parâmetros default; a UI serializa e mutaciona sobre isto. */
  defaultParams: P;
  /** Testa se um jogo passa no filtro. */
  test: (game: number[], params: P, ctx: ConstraintContext) => boolean;
}

export interface ActiveConstraint<P = unknown> {
  id: string;
  params: P;
}

export interface ConstraintFilterResult {
  kept: number[][];
  rejected: number[][];
  stats: {
    total: number;
    keptCount: number;
    rejectedCount: number;
    rejectionByConstraint: Record<string, number>;
  };
}
