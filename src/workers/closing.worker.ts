/**
 * closing.worker.ts — Web Worker do Motor Universal de Fechamentos.
 * Roda geração e comparação fora da main thread e emite progresso.
 * Cancelamento é feito pelo main thread via terminate().
 */

import { generateClosing } from "@/engine/closing";
import type { ClosingRequest, ClosingStrategy } from "@/engine/closing";

type InMsg =
  | { type: "generate"; id: string; request: ClosingRequest }
  | { type: "compare"; id: string; request: ClosingRequest; strategies: ClosingStrategy[] };

const post = (data: unknown) => (self as unknown as Worker).postMessage(data);

self.addEventListener("message", async (e: MessageEvent<InMsg>) => {
  const msg = e.data;
  try {
    if (msg.type === "generate") {
      post({ id: msg.id, type: "progress", stage: "generating", current: 0, total: 1, label: "Executando algoritmo…" });
      const result = generateClosing(msg.request);
      post({ id: msg.id, type: "progress", stage: "done", current: 1, total: 1 });
      post({ id: msg.id, type: "done", ok: true, result });
    } else if (msg.type === "compare") {
      const results = [];
      const total = msg.strategies.length;
      for (let i = 0; i < total; i++) {
        const s = msg.strategies[i];
        post({
          id: msg.id, type: "progress",
          stage: "generating", current: i, total,
          label: `Estratégia ${i + 1}/${total}: ${s}`,
        });
        // yield a microtask so the progress message flushes before the heavy sync call
        await new Promise<void>(r => setTimeout(r, 0));
        const r = generateClosing({ ...msg.request, strategy: s });
        results.push(r);
      }
      results.sort((a, b) => b.score.overall - a.score.overall);
      post({ id: msg.id, type: "progress", stage: "done", current: total, total });
      post({ id: msg.id, type: "done", ok: true, results });
    }
  } catch (err) {
    post({
      id: msg.id, type: "done", ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export {};
