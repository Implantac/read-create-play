import { NumberStats } from "@/engine/stats/statistics";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { evaluateBetQuality, BetQualityReport } from "@/engine/stats/bet-quality";

/**
 * Bet Improver — replaces weakest numbers with better candidates
 * based on robustness analysis weaknesses
 */

export interface ImprovedBet {
  original: number[];
  improved: number[];
  removed: number[];
  added: number[];
  originalScore: number;
  improvedScore: number;
  originalGrade: string;
  improvedGrade: string;
  improvements: string[];
}

export function improveBet(
  bet: number[],
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[]
): ImprovedBet {
  const originalReport = evaluateBetQuality(bet, stats, config, draws);
  const statsMap = new Map(stats.map(s => [s.number, s]));

  // Score each number in the bet
  const scored = bet.map(n => {
    const s = statsMap.get(n);
    if (!s) return { number: n, score: 0 };
    return {
      number: n,
      score:
        s.frequency * 0.25 +
        s.recentFreq * 0.2 +
        (s.trend > 0 ? s.trend * 10 : 0) * 0.15 +
        s.cycleScore * 0.2 +
        s.momentum * 0.1 +
        (100 - s.lastSeen) * 0.1,
    };
  });

  // Identify weaknesses from quality report
  const dimMap = new Map(originalReport.dimensions.map(d => [d.name, d.score]));
  const improvements: string[] = [];

  // Determine how many numbers to replace (1-3 based on grade)
  let replaceCount = originalReport.grade === "S" || originalReport.grade === "A" ? 1
    : originalReport.grade === "B" ? 2 : 3;
  replaceCount = Math.min(replaceCount, Math.floor(bet.length * 0.3));

  // Sort by score ascending → weakest first
  const sortedScored = [...scored].sort((a, b) => a.score - b.score);
  const toRemove = sortedScored.slice(0, replaceCount).map(s => s.number);
  const remaining = bet.filter(n => !toRemove.includes(n));

  // Build candidate pool (not in remaining)
  const candidates = stats
    .filter(s => !remaining.includes(s.number))
    .map(s => ({
      number: s.number,
      score:
        s.frequency * 0.2 +
        s.recentFreq * 0.25 +
        (s.trend > 0 ? s.trend * 15 : 0) * 0.15 +
        s.cycleScore * 0.25 +
        s.momentum * 0.1 +
        (100 - s.lastSeen) * 0.05,
    }));

  // Apply balance corrections
  const mid = config.numbers / 2;
  const evenCount = remaining.filter(n => n % 2 === 0).length;
  const highCount = remaining.filter(n => n > mid).length;
  const targetEven = Math.round(config.pick / 2);
  const targetHigh = Math.round(config.pick / 2);
  const needEven = targetEven - evenCount;
  const needHigh = targetHigh - highCount;

  // Boost candidates that fix imbalances
  const boosted = candidates.map(c => {
    let bonus = 0;
    const isEven = c.number % 2 === 0;
    const isHigh = c.number > mid;

    if (needEven > 0 && isEven) bonus += 15;
    if (needEven < 0 && !isEven) bonus += 15;
    if (needHigh > 0 && isHigh) bonus += 15;
    if (needHigh < 0 && !isHigh) bonus += 15;

    // Penalize if too close to existing numbers (spread)
    const minDist = Math.min(...remaining.map(r => Math.abs(r - c.number)));
    if (minDist <= 1) bonus -= 10;
    if (minDist >= 5) bonus += 5;

    return { ...c, score: c.score + bonus };
  });

  // Pick top candidates
  boosted.sort((a, b) => b.score - a.score);
  const toAdd = boosted.slice(0, replaceCount).map(c => c.number);

  const improved = [...remaining, ...toAdd].sort((a, b) => a - b);

  // Evaluate improved bet
  const improvedReport = evaluateBetQuality(improved, stats, config, draws);

  // Build improvement descriptions
  if ((dimMap.get("Equilíbrio Par/Ímpar") ?? 100) < 60)
    improvements.push("Corrigido equilíbrio par/ímpar");
  if ((dimMap.get("Equilíbrio Alto/Baixo") ?? 100) < 60)
    improvements.push("Corrigido equilíbrio alto/baixo");
  if ((dimMap.get("Alinhamento de Tendência") ?? 100) < 60)
    improvements.push("Números com melhor tendência");
  if ((dimMap.get("Mix Quente/Frio") ?? 100) < 60)
    improvements.push("Mix quente/frio otimizado");

  toRemove.forEach(n => {
    const s = statsMap.get(n);
    if (s && s.status === "cold") improvements.push(`Removido nº frio ${String(n).padStart(2, "0")}`);
  });

  if (improvements.length === 0) improvements.push("Números fracos substituídos por candidatos mais fortes");

  return {
    original: bet,
    improved,
    removed: toRemove.sort((a, b) => a - b),
    added: toAdd.sort((a, b) => a - b),
    originalScore: originalReport.overall,
    improvedScore: improvedReport.overall,
    originalGrade: originalReport.grade,
    improvedGrade: improvedReport.grade,
    improvements,
  };
}
