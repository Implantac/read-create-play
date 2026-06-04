import { DrawResult, LotteryConfig } from "@/data/lotteries";

export const PRIZE_MAP: Record<string, Record<number, number>> = {
  megasena: { 4: 50, 5: 5000, 6: 500000 },
  lotofacil: { 11: 5, 12: 10, 13: 25, 14: 1500, 15: 100000 },
  quina: { 2: 1, 3: 5, 4: 200, 5: 50000 },
  lotomania: { 0: 5, 15: 10, 16: 25, 17: 100, 18: 1000, 19: 20000, 20: 500000 },
  duplasena: { 3: 3, 4: 50, 5: 5000, 6: 300000 },
  timemania: { 3: 2, 4: 10, 5: 50, 6: 500, 7: 50000 },
  diadesorte: { 4: 10, 5: 50, 6: 2000, 7: 200000 },
  supersete: { 3: 5, 4: 20, 5: 200, 6: 10000, 7: 500000 },
};

export function getMinPrizeHits(lotteryId: string): number {
  const map: Record<string, number> = {
    megasena: 4, lotofacil: 11, quina: 2, lotomania: 15,
    duplasena: 3, timemania: 3, diadesorte: 4, supersete: 3,
  };
  return map[lotteryId] || 3;
}

export function calculateWinRate(hitDistribution: Record<number, number>, minPrize: number, totalDraws: number): number {
  if (totalDraws === 0) return 0;
  let wins = 0;
  for (const [hits, count] of Object.entries(hitDistribution)) {
    if (Number(hits) >= minPrize) wins += count;
  }
  return Math.round((wins / totalDraws) * 10000) / 100;
}

export function calculateConsistency(hitValues: number[], avgHits: number, pick: number): number {
  if (hitValues.length === 0 || avgHits === 0) return 0;
  const variance = hitValues.reduce((s, v) => s + (v - avgHits) ** 2, 0) / hitValues.length;
  // Consistency as inverse of variation coefficient, normalized
  return Math.max(0, Math.min(100, Math.round((1 - Math.sqrt(variance) / (pick * 0.3)) * 100)));
}
