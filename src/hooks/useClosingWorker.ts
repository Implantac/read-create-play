/**
 * Hook para invocar o closing.worker sem travar a UI.
 * Fallback: se o worker falhar (ex. SSR/preview), roda inline.
 */

import { useCallback, useEffect, useRef } from "react";
import {
  generateClosing as generateInline,
  compareStrategies as compareInline,
  type ClosingRequest, type ClosingResult, type ClosingStrategy,
} from "@/engine/closing";

let idSeq = 0;
const nextId = () => `${Date.now()}-${++idSeq}`;

export function useClosingWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(new Map<string, (v: unknown) => void>());

  useEffect(() => {
    try {
      const w = new Worker(new URL("@/workers/closing.worker.ts", import.meta.url), { type: "module" });
      w.addEventListener("message", (e: MessageEvent<{ id: string } & Record<string, unknown>>) => {
        const cb = pending.current.get(e.data.id);
        if (cb) { cb(e.data); pending.current.delete(e.data.id); }
      });
      workerRef.current = w;
    } catch {
      workerRef.current = null;
    }
    return () => { workerRef.current?.terminate(); workerRef.current = null; };
  }, []);

  const generate = useCallback((request: ClosingRequest): Promise<ClosingResult> => {
    const w = workerRef.current;
    if (!w) return Promise.resolve(generateInline(request));
    return new Promise((resolve, reject) => {
      const id = nextId();
      pending.current.set(id, (raw) => {
        const r = raw as { ok: boolean; result?: ClosingResult; error?: string };
        if (r.ok && r.result) resolve(r.result);
        else reject(new Error(r.error || "Worker error"));
      });
      w.postMessage({ type: "generate", id, request });
    });
  }, []);

  const compare = useCallback((
    request: ClosingRequest, strategies: ClosingStrategy[],
  ): Promise<ClosingResult[]> => {
    const w = workerRef.current;
    if (!w) return Promise.resolve(compareInline(request, strategies));
    return new Promise((resolve, reject) => {
      const id = nextId();
      pending.current.set(id, (raw) => {
        const r = raw as { ok: boolean; results?: ClosingResult[]; error?: string };
        if (r.ok && r.results) resolve(r.results);
        else reject(new Error(r.error || "Worker error"));
      });
      w.postMessage({ type: "compare", id, request, strategies });
    });
  }, []);

  return { generate, compare };
}
