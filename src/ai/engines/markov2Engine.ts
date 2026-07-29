/**
 * 2nd-order Markov Engine
 * -----------------------------------------------------------------------------
 * Modela a probabilidade condicional P(n | a, b) — "após ver A e B saírem em
 * sorteios recentes, qual a probabilidade de N sair no próximo?".
 *
 * Diferente do Markov de 1ª ordem (padrão do `patternEngine`), aqui capturamos
 * pares antecedentes, o que revela cadeias do tipo "quando 07 e 13 saem, 22
 * tende a aparecer no sorteio seguinte com lift 1.8x".
 *
 * Estrutura:
 *   - `buildMarkov2Model(draws)` monta um mapa `"a-b" -> {n: count}` a partir
 *     de sorteios consecutivos (janela deslizante de 2).
 *   - `scoreNumbersMarkov2(model, recentPair, universe)` retorna score 0..1
 *     por número, normalizado sobre o universo da modalidade.
 *
 * Complexidade: O(D · K²) onde D=nº sorteios, K=pick. Aceitável para até
 * ~5000 sorteios em <100ms sem worker.
 */

export interface Markov2Model {
  /** transitions[pairKey][n] = P(n | pair) */
  transitions: Map<string, Map<number, number>>;
  /** number of times pair (a,b) was observed */
  pairCounts: Map<string, number>;
  /** total draws used to build the model */
  drawsAnalyzed: number;
}

const pairKey = (a: number, b: number): string =>
  a < b ? `${a}-${b}` : `${b}-${a}`;

/**
 * Constrói o modelo de 2ª ordem. Para cada trio de sorteios consecutivos
 * (D_{i-2}, D_{i-1}, D_i) e cada par (a ∈ D_{i-2}, b ∈ D_{i-1}), incrementa
 * a contagem de todo n ∈ D_i.
 */
export function buildMarkov2Model(draws: number[][]): Markov2Model {
  const transitions = new Map<string, Map<number, number>>();
  const pairCounts = new Map<string, number>();

  for (let i = 2; i < draws.length; i++) {
    const d2 = draws[i - 2];
    const d1 = draws[i - 1];
    const d0 = draws[i];

    for (const a of d2) {
      for (const b of d1) {
        if (a === b) continue;
        const key = pairKey(a, b);
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
        let bucket = transitions.get(key);
        if (!bucket) {
          bucket = new Map();
          transitions.set(key, bucket);
        }
        for (const n of d0) {
          bucket.set(n, (bucket.get(n) ?? 0) + 1);
        }
      }
    }
  }

  // normaliza para probabilidade
  for (const [key, bucket] of transitions) {
    const total = pairCounts.get(key) ?? 1;
    for (const [n, c] of bucket) {
      bucket.set(n, c / total);
    }
  }

  return { transitions, pairCounts, drawsAnalyzed: draws.length };
}

/**
 * Dado um par recente (últimos 2 sorteios), retorna score 0..1 por número.
 * Usa média das transições de todos os pares (a, b) com a ∈ d2, b ∈ d1.
 */
export function scoreNumbersMarkov2(
  model: Markov2Model,
  lastTwoDraws: [number[], number[]],
  totalNumbers: number,
): Map<number, number> {
  const [d2, d1] = lastTwoDraws;
  const scores = new Map<number, number>();
  for (let n = 1; n <= totalNumbers; n++) scores.set(n, 0);

  let pairsUsed = 0;
  for (const a of d2) {
    for (const b of d1) {
      if (a === b) continue;
      const bucket = model.transitions.get(pairKey(a, b));
      if (!bucket) continue;
      pairsUsed++;
      for (const [n, p] of bucket) {
        scores.set(n, (scores.get(n) ?? 0) + p);
      }
    }
  }

  if (pairsUsed === 0) return scores;

  // normaliza para 0..1 (dividido pelo par com maior soma teórica)
  let max = 0;
  for (const v of scores.values()) if (v > max) max = v;
  if (max > 0) {
    for (const [n, v] of scores) scores.set(n, v / max);
  }
  return scores;
}

/** Retorna as top-K dezenas com maior probabilidade condicional */
export function topKMarkov2(
  scores: Map<number, number>,
  k: number,
): Array<{ number: number; score: number }> {
  return Array.from(scores.entries())
    .map(([number, score]) => ({ number, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
