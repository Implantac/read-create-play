/**
 * Schema Zod para fechamentos importados/exportados.
 * Serve como contrato entre parsers, editor visual e o motor.
 */

import { z } from "zod";

export const ClosingMatrixGameSchema = z.array(z.number().int().positive()).min(1).max(50);

export const ClosingMatrixSchema = z.object({
  lotteryId: z.string().min(1),
  lotteryName: z.string().optional(),
  pick: z.number().int().positive(),
  totalNumbers: z.number().int().positive(),
  baseNumbers: z.array(z.number().int().positive()).default([]),
  minHits: z.number().int().positive().optional(),
  games: z.array(ClosingMatrixGameSchema).min(1),
  source: z.string().default("import"),
  meta: z.record(z.unknown()).optional(),
});

export type ClosingMatrix = z.infer<typeof ClosingMatrixSchema>;

export function normalizeMatrix(m: ClosingMatrix): ClosingMatrix {
  const games = m.games.map(g =>
    [...new Set(g)].filter(n => n >= 1 && n <= m.totalNumbers).sort((a, b) => a - b),
  );
  const base = m.baseNumbers.length
    ? [...new Set(m.baseNumbers)].sort((a, b) => a - b)
    : [...new Set(games.flat())].sort((a, b) => a - b);
  return { ...m, games, baseNumbers: base };
}
