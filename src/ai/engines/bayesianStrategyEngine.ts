/**
 * Bayesian Strategy Weighting Engine
 * -----------------------------------------------------------------------------
 * Modela cada estratégia como uma distribuição Beta(α, β) sobre "probabilidade
 * de gerar um jogo premiado". Após cada sorteio auditado, atualizamos os
 * priors: sucesso (hits ≥ threshold) → α++, falha → β++.
 *
 * Vantagens sobre média simples:
 *   - Regularização automática: estratégia com 1/1 acerto não domina 50/100.
 *   - Intervalo de credibilidade (percentis 5-95) mostra incerteza real.
 *   - Thompson Sampling para explorar estratégias novas sem viés.
 *
 * Uso típico:
 *   1. Carregar priors do DB (tabela `strategy_priors` ou `localStorage`).
 *   2. Após backtest/sorteio real, chamar `updatePosterior`.
 *   3. Antes de gerar, chamar `sampleWeights` (Thompson) ou `expectedValue`.
 */

export interface StrategyPrior {
  strategy: string;
  alpha: number;   // successes + 1 (Laplace smoothing)
  beta: number;    // failures + 1
  updatedAt: number;
}

/** Prior fraco por padrão (Beta(1,1) = uniforme) */
export const defaultPrior = (strategy: string): StrategyPrior => ({
  strategy,
  alpha: 1,
  beta: 1,
  updatedAt: Date.now(),
});

/**
 * Atualiza o posterior após um ensaio.
 *   hits ≥ threshold → sucesso.
 *   hits < threshold → falha.
 * Mantém a atualização conjugada (Beta é conjugada de Bernoulli).
 */
export function updatePosterior(
  prior: StrategyPrior,
  hits: number,
  threshold: number,
): StrategyPrior {
  const success = hits >= threshold ? 1 : 0;
  return {
    ...prior,
    alpha: prior.alpha + success,
    beta: prior.beta + (1 - success),
    updatedAt: Date.now(),
  };
}

/**
 * Atualiza em lote (útil para backtest de N sorteios).
 * successes / trials devem ser inteiros ≥ 0.
 */
export function batchUpdate(
  prior: StrategyPrior,
  successes: number,
  trials: number,
): StrategyPrior {
  const failures = Math.max(0, trials - successes);
  return {
    ...prior,
    alpha: prior.alpha + successes,
    beta: prior.beta + failures,
    updatedAt: Date.now(),
  };
}

/** Média da Beta = α / (α + β) */
export const expectedValue = (p: StrategyPrior): number =>
  p.alpha / (p.alpha + p.beta);

/** Variância da Beta = αβ / [(α+β)² (α+β+1)] */
export const variance = (p: StrategyPrior): number => {
  const s = p.alpha + p.beta;
  return (p.alpha * p.beta) / (s * s * (s + 1));
};

/**
 * Intervalo de credibilidade 90% via aproximação normal (válido para α,β ≥ 5).
 * Para caudas pequenas, use quantis da Beta (não implementado aqui para manter leve).
 */
export function credibilityInterval(
  p: StrategyPrior,
  z = 1.645, // 90%
): [number, number] {
  const mean = expectedValue(p);
  const sd = Math.sqrt(variance(p));
  return [
    Math.max(0, mean - z * sd),
    Math.min(1, mean + z * sd),
  ];
}

/**
 * Sample de Beta via método de razão de Gammas.
 * Gamma(k) via soma de exponenciais (Marsaglia-Tsang p/ k≥1).
 */
function sampleGamma(shape: number): number {
  if (shape < 1) {
    // Ahrens-Dieter para shape < 1
    return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x = 0;
    let v = 0;
    do {
      x = normalSample();
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function normalSample(): number {
  // Box-Muller
  const u1 = 1 - Math.random();
  const u2 = 1 - Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function sampleBeta(p: StrategyPrior): number {
  const x = sampleGamma(p.alpha);
  const y = sampleGamma(p.beta);
  return x / (x + y);
}

/**
 * Thompson Sampling: sorteia um valor da posterior de cada estratégia e
 * retorna os pesos normalizados. Estratégias com posterior alto tendem a
 * dominar, mas com exploração natural (variance-aware).
 */
export function thompsonWeights(
  priors: StrategyPrior[],
): Array<{ strategy: string; weight: number; sample: number }> {
  const samples = priors.map((p) => ({
    strategy: p.strategy,
    sample: sampleBeta(p),
  }));
  const total = samples.reduce((s, x) => s + x.sample, 0) || 1;
  return samples.map((s) => ({
    strategy: s.strategy,
    sample: s.sample,
    weight: s.sample / total,
  }));
}

/**
 * Ranking determinístico (usa expectedValue). Prefira em UI de auditoria.
 */
export function rankByPosterior(
  priors: StrategyPrior[],
): Array<StrategyPrior & { mean: number; ci: [number, number] }> {
  return priors
    .map((p) => ({ ...p, mean: expectedValue(p), ci: credibilityInterval(p) }))
    .sort((a, b) => b.mean - a.mean);
}
