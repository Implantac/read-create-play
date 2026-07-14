/**
 * ScoreEngine — nota 0-100 multi-critério para um fechamento.
 */

import type { ClosingValidation, ClosingScore } from "../core/types";

export interface ScoreInputs {
  validation: ClosingValidation;
  gameCount: number;
  lowerBound: number;
  elapsedMs: number;
  baseSize: number;
  pick: number;
}

export function computeScore(inputs: ScoreInputs): ClosingScore {
  const { validation, gameCount, lowerBound, elapsedMs, baseSize, pick } = inputs;

  const coverage = clamp(validation.coveragePercent);

  // Diversidade: quanto da base é usada em pelo menos um jogo? (aqui aproximamos por gameCount vs lowerBound × amplitude)
  const diversity = clamp(
    gameCount > 0 ? Math.min(100, (baseSize / pick) * 15 + coverage * 0.6) : 0
  );

  // Redundância: invertida (100 = zero redundância)
  const redundancy = clamp(100 - validation.redundancyPercent);

  // Eficiência: quão perto do lower-bound teórico
  const efficiency = clamp(
    gameCount > 0 && lowerBound > 0
      ? Math.min(100, (lowerBound / gameCount) * 100)
      : 0
  );

  // Tempo: sub-segundo = 100, cai linearmente até 10s
  const time = clamp(100 - Math.min(100, (elapsedMs / 10_000) * 100));

  const overall = clamp(
    coverage * 0.35 +
    efficiency * 0.30 +
    redundancy * 0.15 +
    diversity * 0.15 +
    time * 0.05
  );

  return {
    coverage: round(coverage),
    diversity: round(diversity),
    redundancy: round(redundancy),
    efficiency: round(efficiency),
    time: round(time),
    overall: round(overall),
  };
}

const clamp = (x: number) => Math.max(0, Math.min(100, x));
const round = (x: number) => Math.round(x * 10) / 10;
