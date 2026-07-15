/**
 * ProbabilityEngine — probabilidades exatas de acertos em um fechamento.
 *
 * Fundamentos:
 * - Distribuição hipergeométrica: dado universo `total`, `pick` sorteados,
 *   base do fechamento com `baseSize` dezenas, probabilidade de exatamente `k`
 *   sorteados caírem na base = C(baseSize,k)·C(total-baseSize,pick-k)/C(total,pick).
 * - Para cada jogo do fechamento (com `pick` números), P(exatamente h acertos)
 *   também segue hipergeométrica (universo = total, sucessos = pick sorteados,
 *   amostra = pick jogados).
 * - Probabilidade combinada de "pelo menos um jogo com ≥ h acertos" é limitada
 *   inferiormente por 1-(1-p_jogo)^n (independência aproximada) e superiormente
 *   pela união de Bonferroni.
 */

import { binomial } from "../core/combinatorics";

export interface HitDistribution {
  hits: number;
  probability: number;      // P(exatamente `hits` acertos em um único jogo aleatório com `pick` números)
  probabilityCumulative: number; // P(>= hits)
  oneInX: number;           // 1/probability
}

export interface BaseHitDistribution {
  hitsInBase: number;
  probability: number;      // P(exatamente k sorteados caem na base do fechamento)
  probabilityCumulative: number;
  oneInX: number;
}

export interface ClosingProbabilityReport {
  total: number;
  pick: number;
  baseSize: number;
  gameCount: number;
  singleGame: HitDistribution[];
  baseHits: BaseHitDistribution[];
  /** Probabilidade de o fechamento entregar >= h acertos em pelo menos 1 jogo (limite inferior por independência). */
  atLeastOneGameHits: Array<{ hits: number; probability: number; oneInX: number }>;
}

/** P(exatamente k acertos) em um único jogo, hipergeométrica pura. */
export function singleGameHitProbability(total: number, pick: number, hits: number): number {
  if (hits < 0 || hits > pick) return 0;
  const num = binomial(pick, hits) * binomial(total - pick, pick - hits);
  const den = binomial(total, pick);
  return den > 0 ? num / den : 0;
}

/** P(exatamente k sorteados caem em um subconjunto de `baseSize` da urna). */
export function hitsInBaseProbability(total: number, pick: number, baseSize: number, k: number): number {
  if (k < 0 || k > pick || k > baseSize) return 0;
  const num = binomial(baseSize, k) * binomial(total - baseSize, pick - k);
  const den = binomial(total, pick);
  return den > 0 ? num / den : 0;
}

/** Constrói o relatório completo de probabilidades para o fechamento. */
export function computeClosingProbability(
  total: number,
  pick: number,
  baseSize: number,
  gameCount: number,
): ClosingProbabilityReport {
  const singleGame: HitDistribution[] = [];
  for (let h = pick; h >= 0; h--) {
    const p = singleGameHitProbability(total, pick, h);
    singleGame.push({
      hits: h,
      probability: p,
      probabilityCumulative: 0,
      oneInX: p > 0 ? 1 / p : Infinity,
    });
  }
  // cumulativa P(>= h) do maior para menor
  let acc = 0;
  for (const row of singleGame) {
    acc += row.probability;
    row.probabilityCumulative = acc;
  }

  const baseHits: BaseHitDistribution[] = [];
  for (let k = pick; k >= 0; k--) {
    const p = hitsInBaseProbability(total, pick, baseSize, k);
    baseHits.push({
      hitsInBase: k,
      probability: p,
      probabilityCumulative: 0,
      oneInX: p > 0 ? 1 / p : Infinity,
    });
  }
  let accB = 0;
  for (const row of baseHits) {
    accB += row.probability;
    row.probabilityCumulative = accB;
  }

  // Aproximação por independência: P(>= h em pelo menos 1 jogo) ≈ 1 - (1 - p_single)^n
  const atLeastOneGameHits = singleGame.map(row => {
    const pAny = 1 - Math.pow(1 - row.probabilityCumulative, Math.max(1, gameCount));
    return {
      hits: row.hits,
      probability: pAny,
      oneInX: pAny > 0 ? 1 / pAny : Infinity,
    };
  });

  return { total, pick, baseSize, gameCount, singleGame, baseHits, atLeastOneGameHits };
}
