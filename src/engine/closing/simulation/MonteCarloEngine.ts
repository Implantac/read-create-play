/**
 * MonteCarloEngine — simula milhões de sorteios aleatórios uniformes e mede
 * a distribuição de acertos entregue pelo fechamento.
 *
 * Modelo: cada sorteio é uma combinação aleatória de `drawSize` dezenas
 * do universo [1..totalNumbers]. Para cada sorteio calculamos o melhor
 * hit-count dentre os jogos do fechamento.
 */

export interface MonteCarloOptions {
  games: number[][];              // jogos como dezenas reais
  totalNumbers: number;           // universo completo (ex: 25)
  drawSize: number;               // quantas dezenas por sorteio oficial (ex: 15)
  trials?: number;                // default 100k
  targetHits?: number;            // meta para calcular hit-rate
}

export interface MonteCarloResult {
  trials: number;
  distribution: Record<number, number>;    // hits → count
  meanHits: number;
  bestHits: number;
  worstHits: number;
  hitRate: number;                          // % trials com hits ≥ target
  targetHits: number;
  elapsedMs: number;
}

export function runMonteCarlo(opts: MonteCarloOptions): MonteCarloResult {
  const start = performance.now();
  const trials = opts.trials ?? 100_000;
  const target = opts.targetHits ?? opts.games[0]?.length ?? 0;

  const universe = Array.from({ length: opts.totalNumbers }, (_, i) => i + 1);
  const gameSets = opts.games.map(g => new Set(g));

  const distribution: Record<number, number> = {};
  let hitsSum = 0;
  let best = 0;
  let worst = Number.MAX_SAFE_INTEGER;
  let meetsTarget = 0;

  const pool = new Array<number>(opts.totalNumbers);

  for (let t = 0; t < trials; t++) {
    // Fisher-Yates parcial: só as primeiras drawSize posições
    for (let i = 0; i < opts.totalNumbers; i++) pool[i] = universe[i];
    for (let i = 0; i < opts.drawSize; i++) {
      const j = i + Math.floor(Math.random() * (opts.totalNumbers - i));
      const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    // pool[0..drawSize-1] é o sorteio.
    let bestHits = 0;
    for (const gs of gameSets) {
      let h = 0;
      for (let i = 0; i < opts.drawSize; i++) if (gs.has(pool[i])) h++;
      if (h > bestHits) bestHits = h;
    }
    distribution[bestHits] = (distribution[bestHits] || 0) + 1;
    hitsSum += bestHits;
    if (bestHits > best) best = bestHits;
    if (bestHits < worst) worst = bestHits;
    if (bestHits >= target) meetsTarget++;
  }

  return {
    trials,
    distribution,
    meanHits: hitsSum / trials,
    bestHits: best,
    worstHits: worst === Number.MAX_SAFE_INTEGER ? 0 : worst,
    hitRate: (meetsTarget / trials) * 100,
    targetHits: target,
    elapsedMs: Math.round(performance.now() - start),
  };
}
