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

/**
 * Validates draw history.
 *
 * IMPORTANT: `expectedDrawSize` is the amount of balls DRAWN by the lottery,
 * which is NOT the same as `config.pick` (the minimum the bettor marks).
 * When it is not known, the modal (most common) draw length is inferred from
 * the history itself so modalities like Lotomania, Timemania, Dupla Sena,
 * Dia de Sorte, Federal and Loteca are not wrongly flagged as corrupted.
 */
export function validateLotteryData(
  draws: DrawResult[],
  expectedDrawSize: number | null | undefined,
  maxNumber: number
): DataQualityReport {
  const issues: string[] = [];
  const drawIds = new Set<number>();

  let referenceSize = expectedDrawSize && expectedDrawSize > 0 ? expectedDrawSize : null;
  if (!referenceSize && draws.length > 0) {
    const counts = new Map<number, number>();
    for (const d of draws) counts.set(d.numbers.length, (counts.get(d.numbers.length) ?? 0) + 1);
    referenceSize = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  for (const draw of draws) {
    // Check for duplicates
    if (drawIds.has(draw.concurso)) {
      issues.push(`Concurso duplicado: ${draw.concurso}`);
    }
    drawIds.add(draw.concurso);

    if (draw.numbers.length === 0) {
      issues.push(`Concurso ${draw.concurso}: sem dezenas registradas`);
    } else if (referenceSize && draw.numbers.length !== referenceSize) {
      issues.push(`Concurso ${draw.concurso}: quantidade de dezenas divergente (${draw.numbers.length} vs ${referenceSize})`);
    }

    // Check range
    for (const n of draw.numbers) {
      if (n < 0 || n > maxNumber) {
        issues.push(`Concurso ${draw.concurso}: número inválido ${n}`);
      }
    }
  }

  const qualityScore = draws.length > 0 ? Math.max(0, 100 - (issues.length * 5)) : 0;

  // Tolerate a small fraction of anomalous draws — the history is external data.
  const tolerated = Math.max(2, Math.floor(draws.length * 0.05));

  return {
    totalDraws: draws.length,
    qualityScore,
    issues,
    isValid: draws.length > 0 && issues.length <= tolerated
  };
}
