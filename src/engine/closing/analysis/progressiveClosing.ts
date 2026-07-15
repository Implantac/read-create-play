/**
 * progressiveClosing — simula um fechamento em rodadas.
 * A cada rodada:
 *  1) Confere jogos contra o sorteio correspondente.
 *  2) Promove dezenas quentes (as que apareceram nas últimas K rodadas).
 *  3) Substitui dezenas frias (sem hits) por candidatas fora da base.
 *
 * É um simulador determinístico — útil para o usuário visualizar como a base
 * ideal evoluiria se ele ajustasse a cada concurso, sem alterar o gerador.
 */

export interface ProgressiveRoundInput {
  totalNumbers: number;
  baseNumbers: number[];
  games: number[][];
  recentDraws: Array<{ concurso: number; numbers: number[]; date?: string }>;
  rounds?: number;         // default 5
  swapRate?: number;       // 0..1, fração da base que pode trocar por rodada (default 0.15)
  ticketPrice: number;
}

export interface ProgressiveRound {
  round: number;
  concurso: number;
  date?: string;
  baseBefore: number[];
  baseAfter: number[];
  removed: number[];
  added: number[];
  bestHits: number;
  avgHits: number;
  cost: number;
}

export interface ProgressiveSimulation {
  rounds: ProgressiveRound[];
  finalBase: number[];
  totalCost: number;
  cumulativeBest: number[];  // melhor hits por rodada
  avgBaseChurn: number;      // média de trocas por rodada
}

export function simulateProgressive(input: ProgressiveRoundInput): ProgressiveSimulation {
  const rounds = input.rounds ?? 5;
  const swapRate = input.swapRate ?? 0.15;
  const universe = Array.from({ length: input.totalNumbers }, (_, i) => i + 1);
  let base = [...input.baseNumbers].sort((a, b) => a - b);
  const roundsOut: ProgressiveRound[] = [];
  const cumulativeBest: number[] = [];

  const freq = new Map<number, number>();
  for (const n of universe) freq.set(n, 0);

  const draws = input.recentDraws.slice(0, rounds);
  for (let i = 0; i < draws.length; i++) {
    const draw = draws[i];
    const drawSet = new Set(draw.numbers);
    // update freq com dezenas do concurso
    for (const n of draw.numbers) freq.set(n, (freq.get(n) ?? 0) + 1);

    const hitsByGame = input.games.map(g => g.filter(n => drawSet.has(n)).length);
    const bestHits = hitsByGame.reduce((m, h) => Math.max(m, h), 0);
    const avgHits = hitsByGame.reduce((a, b) => a + b, 0) / Math.max(1, hitsByGame.length);
    cumulativeBest.push(bestHits);

    const baseBefore = [...base];
    // Decide swap: substitui piores (menos frequência recente) por melhores fora da base
    const maxSwap = Math.max(1, Math.round(base.length * swapRate));
    const outsiders = universe.filter(n => !base.includes(n))
      .sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0));
    const insiders = [...base].sort((a, b) => (freq.get(a) ?? 0) - (freq.get(b) ?? 0));

    const removed: number[] = [];
    const added: number[] = [];
    for (let k = 0; k < maxSwap; k++) {
      const worst = insiders[k];
      const best = outsiders[k];
      if (worst === undefined || best === undefined) break;
      if ((freq.get(best) ?? 0) <= (freq.get(worst) ?? 0)) break;
      removed.push(worst);
      added.push(best);
    }
    base = [...base.filter(n => !removed.includes(n)), ...added].sort((a, b) => a - b);

    roundsOut.push({
      round: i + 1,
      concurso: draw.concurso,
      date: draw.date,
      baseBefore,
      baseAfter: [...base],
      removed,
      added,
      bestHits,
      avgHits: Number(avgHits.toFixed(2)),
      cost: input.games.length * input.ticketPrice,
    });
  }

  const churnAvg = roundsOut.reduce((a, r) => a + r.removed.length, 0) / Math.max(1, roundsOut.length);
  return {
    rounds: roundsOut,
    finalBase: base,
    totalCost: roundsOut.reduce((a, r) => a + r.cost, 0),
    cumulativeBest,
    avgBaseChurn: Number(churnAvg.toFixed(2)),
  };
}
