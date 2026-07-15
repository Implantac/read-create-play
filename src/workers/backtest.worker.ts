/**
 * backtest.worker.ts — Web Worker dedicado ao HistoricalBacktest.
 * Avalia um fechamento contra concursos históricos fora da main thread,
 * emitindo progresso por chunks de sorteios processados.
 */

import {
  runHistoricalBacktest,
  type BacktestOptions,
  type BacktestResult,
} from "@/engine/closing/simulation/HistoricalBacktest";

type InMsg = {
  type: "run";
  id: string;
  options: BacktestOptions;
  /** tamanho do chunk de sorteios para progresso (default 100). */
  chunkSize?: number;
};

const post = (data: unknown) => (self as unknown as Worker).postMessage(data);

self.addEventListener("message", async (e: MessageEvent<InMsg>) => {
  const msg = e.data;
  try {
    if (msg.type !== "run") return;

    const total = msg.options.draws.length;
    const chunk = Math.max(1, msg.chunkSize ?? 100);

    if (total <= chunk) {
      const result = runHistoricalBacktest(msg.options);
      post({ id: msg.id, type: "progress", current: total, total });
      post({ id: msg.id, type: "done", ok: true, result });
      return;
    }

    // Executa em chunks agregando resultados parciais.
    const start = performance.now();
    let processed = 0;
    const distribution: Record<number, number> = {};
    const outcomes: BacktestResult["outcomes"] = [];
    let totalPrize = 0;
    let hitsSum = 0;
    let best: BacktestResult["bestOutcome"];

    while (processed < total) {
      const slice = msg.options.draws.slice(processed, processed + chunk);
      const partial = runHistoricalBacktest({ ...msg.options, draws: slice });
      for (const [h, count] of Object.entries(partial.hitDistribution)) {
        distribution[Number(h)] = (distribution[Number(h)] || 0) + count;
      }
      outcomes.push(...partial.outcomes);
      totalPrize += partial.totalPrize;
      hitsSum += partial.meanHits * partial.totalDraws;
      if (
        partial.bestOutcome &&
        (!best ||
          partial.bestOutcome.bestHits > best.bestHits ||
          (partial.bestOutcome.bestHits === best.bestHits &&
            partial.bestOutcome.prize > best.prize))
      ) {
        best = partial.bestOutcome;
      }
      processed += slice.length;
      post({ id: msg.id, type: "progress", current: processed, total });
      await new Promise<void>(r => setTimeout(r, 0));
    }

    const cost = msg.options.games.length * msg.options.ticketPrice;
    const totalCost = cost * total;
    const hitsAtOrAbove: Record<number, number> = {};
    const maxHits = Math.max(0, ...Object.keys(distribution).map(Number));
    for (let k = 0; k <= maxHits; k++) {
      let sum = 0;
      for (const [h, c] of Object.entries(distribution)) {
        if (Number(h) >= k) sum += c;
      }
      hitsAtOrAbove[k] = sum;
    }

    const result: BacktestResult = {
      totalDraws: total,
      totalCost,
      totalPrize,
      netProfit: totalPrize - totalCost,
      roi: totalCost > 0 ? ((totalPrize - totalCost) / totalCost) * 100 : 0,
      hitDistribution: distribution,
      bestOutcome: best,
      outcomes,
      meanHits: total > 0 ? hitsSum / total : 0,
      hitsAtOrAbove,
      elapsedMs: Math.round(performance.now() - start),
    };

    post({ id: msg.id, type: "done", ok: true, result });
  } catch (err) {
    post({
      id: msg.id, type: "done", ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export {};
