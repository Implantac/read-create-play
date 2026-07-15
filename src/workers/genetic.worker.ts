/**
 * genetic.worker.ts — Web Worker dedicado ao GeneticOptimizer do Motor de Fechamentos.
 * Executa o algoritmo genético fora da main thread e emite progresso por geração.
 */

import { runGeneticAlgorithm, type GAOptions, type GAOutput } from "@/engine/closing/generators/GeneticOptimizer";

type InMsg = {
  type: "run";
  id: string;
  baseSize: number;
  pick: number;
  m: number;
  options?: Omit<GAOptions, "onProgress">;
};

const post = (data: unknown) => (self as unknown as Worker).postMessage(data);

self.addEventListener("message", (e: MessageEvent<InMsg>) => {
  const msg = e.data;
  try {
    if (msg.type !== "run") return;
    const out: GAOutput = runGeneticAlgorithm(msg.baseSize, msg.pick, msg.m, {
      ...(msg.options ?? {}),
      onProgress: (gen, best, avg) => {
        post({ id: msg.id, type: "progress", gen, best, avg });
      },
    });
    post({ id: msg.id, type: "done", ok: true, result: out });
  } catch (err) {
    post({
      id: msg.id, type: "done", ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export {};
