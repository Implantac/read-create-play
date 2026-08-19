/**
 * Data Quality Engine
 * Validates integrity of lottery history data before analysis.
 */

import { DrawResult } from "@/data/lotteries";

export interface DataQualityReport {
  totalDraws: number;
  qualityScore: number; // 0-100
  issues: string[];
  isValid: boolean;
}

export function validateLotteryData(draws: DrawResult[], expectedPick: number, maxNumber: number): DataQualityReport {
  const issues: string[] = [];
  const drawIds = new Set<number>();
  
  for (const draw of draws) {
    // Check for duplicates
    if (drawIds.has(draw.concurso)) {
      issues.push(`Concurso duplicado: ${draw.concurso}`);
    }
    drawIds.add(draw.concurso);

    // Check number validity
    if (draw.numbers.length !== expectedPick) {
      issues.push(`Concurso ${draw.concurso}: quantidade de dezenas incorreta (${draw.numbers.length})`);
    }

    // Check range
    for (const n of draw.numbers) {
      if (n < 1 || n > maxNumber) {
        issues.push(`Concurso ${draw.concurso}: número inválido ${n}`);
      }
    }
  }

  const qualityScore = draws.length > 0 ? Math.max(0, 100 - (issues.length * 5)) : 0;
  
  return {
    totalDraws: draws.length,
    qualityScore,
    issues,
    isValid: issues.length === 0 && draws.length > 0
  };
}
