/**
 * Backtest runner — mede a qualidade real de qualquer estratégia de geração
 * contra o histórico oficial dos últimos N sorteios.
 *
 * Puro e sem side effects: entra `draws` + função geradora, sai relatório
 * numérico. Serve como fundamento para comparar "antes vs depois" nas Fases
 * 3, 4 e futuras recalibrações do Titan Score.
 */

import type { DrawResult } from "@/data/lotteries";
import { getLotteryProfile } from "@/ai/knowledge/lotteryProfiles";

export type BetGenerator = (
  /** Sorteios disponíveis ATÉ o momento do backtest (não inclui o alvo). */
  historicalDraws: DrawResult[],
  /** Índice do sorteio-alvo dentro do array completo (para logging/debug). */
  targetIndex: number,
) => number[];

export interface BacktestMetrics {
  /** Quantidade de sorteios avaliados */
  drawsEvaluated: number;
  /** Acertos médios por jogo */
  avgHits: number;
  /** Melhor acerto observado em qualquer jogo */
  maxHits: number;
  /** Distribuição: quantos jogos tiveram X acertos */
  distribution: Record<number, number>;
  /** % de jogos que atingiram ≥ pick-2 acertos (faixa premiável na maioria) */
  premiumHitRate: number;
  /** Score consolidado 0-100 (avgHits normalizado pelo pick) */
  qualityScore: number;
}

export interface BacktestComparison {
  before: BacktestMetrics;
  after: BacktestMetrics;
  delta: {
    avgHits: number;
    premiumHitRate: number;
    qualityScore: number;
  };
  improved: boolean;
}

/** Conta acertos entre uma aposta e o resultado oficial. */
export function countHits(bet: number[], drawn: number[]): number {
  const set = new Set(drawn);
  let hits = 0;
  for (const n of bet) if (set.has(n)) hits++;
  return hits;
}

/**
 * Executa o backtest de uma estratégia contra os últimos `lookback` sorteios.
 * Para cada sorteio-alvo, gera um jogo usando APENAS o histórico anterior
 * (evita data leakage) e compara com o resultado real.
 */
export function runBacktest(
  draws: DrawResult[],
  generator: BetGenerator,
  options: { lotteryId: string; lookback?: number } = { lotteryId: "megasena" },
): BacktestMetrics {
  const lookback = Math.min(options.lookback ?? 200, Math.max(0, draws.length - 1));
  const profile = getLotteryProfile(options.lotteryId);

  const distribution: Record<number, number> = {};
  let totalHits = 0;
  let maxHits = 0;
  let premiumCount = 0;
  const premiumThreshold = Math.max(1, profile.pick - 2);

  // draws[0] costuma ser o mais recente; usamos os `lookback` primeiros como alvos
  for (let i = 0; i < lookback; i++) {
    const target = draws[i];
    if (!target?.numbers?.length) continue;
    const history = draws.slice(i + 1); // apenas sorteios anteriores ao alvo
    const bet = generator(history, i);
    if (!bet?.length) continue;

    const hits = countHits(bet, target.numbers);
    totalHits += hits;
    if (hits > maxHits) maxHits = hits;
    distribution[hits] = (distribution[hits] ?? 0) + 1;
    if (hits >= premiumThreshold) premiumCount++;
  }

  const drawsEvaluated = lookback;
  const avgHits = drawsEvaluated > 0 ? totalHits / drawsEvaluated : 0;
  const premiumHitRate = drawsEvaluated > 0 ? premiumCount / drawsEvaluated : 0;
  const qualityScore = Math.round((avgHits / profile.pick) * 100);

  return { drawsEvaluated, avgHits, maxHits, distribution, premiumHitRate, qualityScore };
}

/**
 * Compara duas estratégias sobre o mesmo histórico. Retorna delta e flag
 * `improved` (true se avgHits E premiumHitRate melhoraram).
 */
export function compareStrategies(
  draws: DrawResult[],
  before: BetGenerator,
  after: BetGenerator,
  options: { lotteryId: string; lookback?: number },
): BacktestComparison {
  const b = runBacktest(draws, before, options);
  const a = runBacktest(draws, after, options);
  const delta = {
    avgHits: a.avgHits - b.avgHits,
    premiumHitRate: a.premiumHitRate - b.premiumHitRate,
    qualityScore: a.qualityScore - b.qualityScore,
  };
  return {
    before: b,
    after: a,
    delta,
    improved: delta.avgHits >= 0 && delta.premiumHitRate >= 0,
  };
}
