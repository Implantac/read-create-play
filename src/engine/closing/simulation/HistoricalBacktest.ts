/**
 * HistoricalBacktest — testa um fechamento contra concursos reais.
 * Para cada concurso passado, mede o melhor hit-count dentre os jogos
 * e agrega estatísticas por faixa (hits ≥ pick, pick-1, pick-2, ...).
 */

export interface HistoricalDraw {
  contest: number | string;
  date?: string;
  numbers: number[];
}

export interface BacktestOptions {
  games: number[][];               // dezenas reais
  draws: HistoricalDraw[];
  ticketPrice: number;
  /** Prêmios estimados por faixa de acertos (hit → valor). */
  prizeTiers?: Record<number, number>;
}

export interface DrawOutcome {
  contest: number | string;
  date?: string;
  bestHits: number;
  winningGameIndex: number;        // -1 se nenhum jogo teve hits > 0
  prize: number;
}

export interface BacktestResult {
  totalDraws: number;
  totalCost: number;
  totalPrize: number;
  netProfit: number;
  roi: number;                     // (prize - cost) / cost * 100
  hitDistribution: Record<number, number>;
  bestOutcome?: DrawOutcome;
  outcomes: DrawOutcome[];
  meanHits: number;
  hitsAtOrAbove: Record<number, number>;  // hits ≥ k → count
  elapsedMs: number;
}

export function runHistoricalBacktest(opts: BacktestOptions): BacktestResult {
  const start = performance.now();
  const gameSets = opts.games.map(g => new Set(g));
  const cost = opts.games.length * opts.ticketPrice;
  const tiers = opts.prizeTiers || {};

  const distribution: Record<number, number> = {};
  const outcomes: DrawOutcome[] = [];
  let totalPrize = 0;
  let hitsSum = 0;
  let best: DrawOutcome | undefined;

  for (const draw of opts.draws) {
    const drawn = new Set(draw.numbers);
    let bestHits = 0;
    let winnerIdx = -1;
    for (let i = 0; i < gameSets.length; i++) {
      let h = 0;
      for (const n of drawn) if (gameSets[i].has(n)) h++;
      if (h > bestHits) { bestHits = h; winnerIdx = i; }
    }
    const prize = tiers[bestHits] ?? 0;
    totalPrize += prize;
    hitsSum += bestHits;
    distribution[bestHits] = (distribution[bestHits] || 0) + 1;
    const outcome: DrawOutcome = {
      contest: draw.contest, date: draw.date,
      bestHits, winningGameIndex: winnerIdx, prize,
    };
    outcomes.push(outcome);
    if (!best || bestHits > best.bestHits || (bestHits === best.bestHits && prize > best.prize)) {
      best = outcome;
    }
  }

  const totalCost = cost * opts.draws.length;

  const hitsAtOrAbove: Record<number, number> = {};
  const maxHits = Math.max(0, ...Object.keys(distribution).map(Number));
  for (let k = 0; k <= maxHits; k++) {
    let sum = 0;
    for (const [h, c] of Object.entries(distribution)) {
      if (Number(h) >= k) sum += c;
    }
    hitsAtOrAbove[k] = sum;
  }

  return {
    totalDraws: opts.draws.length,
    totalCost,
    totalPrize,
    netProfit: totalPrize - totalCost,
    roi: totalCost > 0 ? ((totalPrize - totalCost) / totalCost) * 100 : 0,
    hitDistribution: distribution,
    bestOutcome: best,
    outcomes,
    meanHits: opts.draws.length > 0 ? hitsSum / opts.draws.length : 0,
    hitsAtOrAbove,
    elapsedMs: Math.round(performance.now() - start),
  };
}
