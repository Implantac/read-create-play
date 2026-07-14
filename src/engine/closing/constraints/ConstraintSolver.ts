/**
 * ConstraintSolver — aplica um conjunto de constraints em série (AND) sobre
 * uma lista de jogos, produzindo `kept`, `rejected` e estatísticas por
 * constraint. É agnóstico ao gerador que produziu os jogos.
 */

import type { ActiveConstraint, ConstraintContext, ConstraintFilterResult } from "./types";
import { CONSTRAINT_REGISTRY } from "./builtins";

export function applyConstraints(
  games: number[][],
  active: ActiveConstraint[],
  ctx: ConstraintContext,
): ConstraintFilterResult {
  const kept: number[][] = [];
  const rejected: number[][] = [];
  const rejectionByConstraint: Record<string, number> = {};
  for (const a of active) rejectionByConstraint[a.id] = 0;

  if (!active.length) {
    return {
      kept: [...games],
      rejected: [],
      stats: { total: games.length, keptCount: games.length, rejectedCount: 0, rejectionByConstraint },
    };
  }

  outer: for (const game of games) {
    for (const a of active) {
      const def = CONSTRAINT_REGISTRY[a.id];
      if (!def) continue;
      if (!def.test(game, a.params, ctx)) {
        rejected.push(game);
        rejectionByConstraint[a.id] = (rejectionByConstraint[a.id] ?? 0) + 1;
        continue outer;
      }
    }
    kept.push(game);
  }

  return {
    kept,
    rejected,
    stats: {
      total: games.length,
      keptCount: kept.length,
      rejectedCount: rejected.length,
      rejectionByConstraint,
    },
  };
}

/** Presets prontos, compostos apenas de constraints registrados. */
export const CONSTRAINT_PRESETS = {
  economic: [
    { id: "consecutive", params: { maxRun: 4 } },
  ] as ActiveConstraint[],
  guaranteed: [] as ActiveConstraint[],
  balanced: [
    { id: "parity", params: { minEvens: 2, maxEvens: 99 } },
    { id: "consecutive", params: { maxRun: 3 } },
    { id: "groups", params: { groupSize: 5, minGroupsUsed: 3 } },
  ] as ActiveConstraint[],
  hybrid: [
    { id: "parity", params: { minEvens: 2, maxEvens: 99 } },
    { id: "consecutive", params: { maxRun: 3 } },
    { id: "frameCore", params: { cols: 5, minFrame: 5, maxFrame: 25 } },
    { id: "groups", params: { groupSize: 5, minGroupsUsed: 3 } },
  ] as ActiveConstraint[],
} as const;
