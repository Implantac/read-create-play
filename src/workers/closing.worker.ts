/**
 * closing.worker.ts — Web Worker do Motor Universal de Fechamentos.
 * Roda geração e comparação fora da main thread para não travar a UI.
 */

import { generateClosing, compareStrategies } from "@/engine/closing";
import type { ClosingRequest, ClosingStrategy } from "@/engine/closing";

type InMsg =
  | { type: "generate"; id: string; request: ClosingRequest }
  | { type: "compare"; id: string; request: ClosingRequest; strategies: ClosingStrategy[] };

self.addEventListener("message", (e: MessageEvent<InMsg>) => {
  const msg = e.data;
  try {
    if (msg.type === "generate") {
      const result = generateClosing(msg.request);
      (self as unknown as Worker).postMessage({ id: msg.id, ok: true, result });
    } else if (msg.type === "compare") {
      const results = compareStrategies(msg.request, msg.strategies);
      (self as unknown as Worker).postMessage({ id: msg.id, ok: true, results });
    }
  } catch (err) {
    (self as unknown as Worker).postMessage({
      id: msg.id, ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export {};
