/**
 * HMM Regime Detection (leve)
 * -----------------------------------------------------------------------------
 * Detecta em qual "regime" a loteria está operando: HOT (números quentes
 * dominam), COLD (atrasados voltando), NEUTRAL (aleatoriedade máxima).
 *
 * Aqui NÃO implementamos Baum-Welch completo (custo alto e overkill).
 * Usamos uma versão leve baseada em janelas + soft-assignment:
 *
 *   1. Para cada sorteio recente, calcula um feature vector:
 *        - heatIndex: soma de frequência das dezenas dividida pela média
 *        - repeatRate: quantas repetiram do sorteio anterior
 *        - entropy: entropia de Shannon sobre décadas
 *
 *   2. Cada regime é definido por um centroide no espaço de features.
 *   3. Retorna a "posterior soft" (softmax de -distância) sobre 3 regimes.
 *   4. Sequência de posteriors ao longo do tempo → detecção de mudança.
 *
 * Uso: modula o peso de estratégias (quente/frio/neutro) no gerador.
 */

export type Regime = "HOT" | "COLD" | "NEUTRAL";

export interface RegimeSnapshot {
  regime: Regime;
  posterior: Record<Regime, number>;
  features: { heatIndex: number; repeatRate: number; entropy: number };
  confidence: number; // max posterior
}

/** Centroides empíricos calibrados em backtests da Lotofácil */
const CENTROIDS: Record<Regime, [number, number, number]> = {
  //         heat, repeat, entropy
  HOT:     [1.25, 0.65, 0.85],
  COLD:    [0.75, 0.40, 0.95],
  NEUTRAL: [1.00, 0.55, 0.98],
};

function entropy(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  let h = 0;
  for (const c of counts) {
    if (c === 0) continue;
    const p = c / total;
    h -= p * Math.log2(p);
  }
  const maxH = Math.log2(counts.length);
  return maxH > 0 ? h / maxH : 0; // normaliza 0..1
}

function computeFeatures(
  draw: number[],
  prevDraw: number[] | undefined,
  history: number[][],
  totalNumbers: number,
): { heatIndex: number; repeatRate: number; entropy: number } {
  // frequência histórica das dezenas
  const freq = new Array(totalNumbers + 1).fill(0);
  for (const d of history) for (const n of d) freq[n]++;
  const meanFreq =
    freq.slice(1).reduce((a, b) => a + b, 0) / totalNumbers || 1;

  const heat =
    draw.reduce((s, n) => s + freq[n], 0) / (draw.length * meanFreq || 1);

  const repeats = prevDraw
    ? draw.filter((n) => prevDraw.includes(n)).length / draw.length
    : 0.5;

  // décadas (0..9, 10..19, etc.)
  const buckets = new Array(Math.ceil(totalNumbers / 10)).fill(0);
  for (const n of draw) buckets[Math.floor((n - 1) / 10)]++;
  const ent = entropy(buckets);

  return { heatIndex: heat, repeatRate: repeats, entropy: ent };
}

function distance(
  f: [number, number, number],
  c: [number, number, number],
): number {
  return Math.sqrt(
    (f[0] - c[0]) ** 2 + (f[1] - c[1]) ** 2 + (f[2] - c[2]) ** 2,
  );
}

/** Softmax de -distância → posterior sobre regimes */
function softAssign(
  f: [number, number, number],
): Record<Regime, number> {
  const regimes: Regime[] = ["HOT", "COLD", "NEUTRAL"];
  const logits = regimes.map((r) => -distance(f, CENTROIDS[r]) * 4);
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const total = exps.reduce((a, b) => a + b, 0) || 1;
  return {
    HOT: exps[0] / total,
    COLD: exps[1] / total,
    NEUTRAL: exps[2] / total,
  };
}

export function detectRegime(
  currentDraw: number[],
  history: number[][],
  totalNumbers: number,
): RegimeSnapshot {
  const prev = history[history.length - 1];
  const f = computeFeatures(currentDraw, prev, history, totalNumbers);
  const posterior = softAssign([f.heatIndex, f.repeatRate, f.entropy]);
  const [best] = Object.entries(posterior).sort((a, b) => b[1] - a[1]);
  return {
    regime: best[0] as Regime,
    posterior,
    features: f,
    confidence: best[1],
  };
}

/**
 * Trajetória de regimes sobre os últimos N sorteios — usado em UI de linha do
 * tempo para mostrar transições.
 */
export function regimeTrajectory(
  draws: number[][],
  totalNumbers: number,
  window = 30,
): RegimeSnapshot[] {
  const start = Math.max(0, draws.length - window);
  const out: RegimeSnapshot[] = [];
  for (let i = start; i < draws.length; i++) {
    const history = draws.slice(0, i);
    if (history.length < 5) continue;
    out.push(detectRegime(draws[i], history, totalNumbers));
  }
  return out;
}

/**
 * Multiplicadores recomendados para estratégias por regime.
 * Ex: em regime HOT, boost hot-number strategies e nerf contrarians.
 */
export const REGIME_STRATEGY_MULTIPLIERS: Record<
  Regime,
  { hot: number; cold: number; balanced: number; contrarian: number }
> = {
  HOT:     { hot: 1.30, cold: 0.75, balanced: 1.00, contrarian: 0.80 },
  COLD:    { hot: 0.75, cold: 1.30, balanced: 1.00, contrarian: 1.15 },
  NEUTRAL: { hot: 1.00, cold: 1.00, balanced: 1.10, contrarian: 1.00 },
};
