/**
 * Hook para invocar o closing.worker sem travar a UI, com progresso e
 * cancelamento cooperativo (terminate + fallback inline).
 *
 * API:
 *   const { run, cancel, progress, running } = useClosingWorker();
 *   const r = await run({ kind: "generate", request });
 *   const rs = await run({ kind: "compare", request, strategies });
 *   cancel();  // aborta a execução corrente
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  generateClosing as generateInline,
  compareStrategies as compareInline,
  type ClosingRequest, type ClosingResult, type ClosingStrategy,
} from "@/engine/closing";

export interface ClosingProgress {
  stage: "idle" | "generating" | "done" | "canceled";
  current: number;
  total: number;
  label?: string;
  startedAt?: number;
}

export type ClosingJob =
  | { kind: "generate"; request: ClosingRequest }
  | { kind: "compare"; request: ClosingRequest; strategies: ClosingStrategy[] };

const IDLE: ClosingProgress = { stage: "idle", current: 0, total: 0 };

let idSeq = 0;
const nextId = () => `${Date.now()}-${++idSeq}`;

export class ClosingCanceledError extends Error {
  constructor() { super("Geração cancelada."); this.name = "ClosingCanceledError"; }
}

export function useClosingWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef<{
    id: string;
    resolve: (v: unknown) => void;
    reject: (e: Error) => void;
  } | null>(null);
  const [progress, setProgress] = useState<ClosingProgress>(IDLE);
  const [running, setRunning] = useState(false);

  const spawn = useCallback(() => {
    try {
      const w = new Worker(new URL("@/workers/closing.worker.ts", import.meta.url), { type: "module" });
      w.addEventListener("message", (e: MessageEvent<{ id: string; type: string } & Record<string, unknown>>) => {
        const data = e.data;
        if (!pending.current || data.id !== pending.current.id) return;
        if (data.type === "progress") {
          setProgress(p => ({
            stage: (data.stage as ClosingProgress["stage"]) ?? "generating",
            current: Number(data.current) || 0,
            total: Number(data.total) || 0,
            label: typeof data.label === "string" ? data.label : p.label,
            startedAt: p.startedAt ?? Date.now(),
          }));
        } else if (data.type === "done") {
          const p = pending.current;
          pending.current = null;
          setRunning(false);
          if (data.ok) {
            setProgress(prev => ({ ...prev, stage: "done" }));
            p.resolve(data);
          } else {
            setProgress(IDLE);
            p.reject(new Error((data.error as string) || "Worker error"));
          }
        }
      });
      workerRef.current = w;
    } catch {
      workerRef.current = null;
    }
  }, []);

  useEffect(() => {
    spawn();
    return () => { workerRef.current?.terminate(); workerRef.current = null; };
  }, [spawn]);

  const cancel = useCallback(() => {
    if (!pending.current) return;
    workerRef.current?.terminate();
    workerRef.current = null;
    const p = pending.current;
    pending.current = null;
    setRunning(false);
    setProgress({ stage: "canceled", current: 0, total: 0 });
    p.reject(new ClosingCanceledError());
    // respawn a fresh worker for the next run
    spawn();
  }, [spawn]);

  const run = useCallback((job: ClosingJob): Promise<ClosingResult | ClosingResult[]> => {
    if (pending.current) {
      return Promise.reject(new Error("Já há uma geração em andamento."));
    }
    const w = workerRef.current;
    setRunning(true);
    setProgress({
      stage: "generating",
      current: 0,
      total: job.kind === "compare" ? job.strategies.length : 1,
      label: job.kind === "compare" ? "Preparando comparação…" : "Iniciando…",
      startedAt: Date.now(),
    });

    // Fallback inline (sem worker): não cancelável, sem progresso granular.
    if (!w) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const out = job.kind === "generate"
              ? generateInline(job.request)
              : compareInline(job.request, job.strategies);
            setRunning(false);
            setProgress({ stage: "done", current: 1, total: 1 });
            resolve(out);
          } catch (e) {
            setRunning(false);
            setProgress(IDLE);
            reject(e instanceof Error ? e : new Error(String(e)));
          }
        }, 0);
      });
    }

    return new Promise((resolve, reject) => {
      const id = nextId();
      pending.current = {
        id,
        resolve: (raw) => {
          const r = raw as { ok: boolean; result?: ClosingResult; results?: ClosingResult[] };
          if (job.kind === "generate") resolve(r.result as ClosingResult);
          else resolve(r.results as ClosingResult[]);
        },
        reject,
      };
      if (job.kind === "generate") {
        w.postMessage({ type: "generate", id, request: job.request });
      } else {
        w.postMessage({ type: "compare", id, request: job.request, strategies: job.strategies });
      }
    });
  }, []);

  // Backwards-compatible helpers
  const generate = useCallback(
    (request: ClosingRequest) => run({ kind: "generate", request }) as Promise<ClosingResult>,
    [run],
  );
  const compare = useCallback(
    (request: ClosingRequest, strategies: ClosingStrategy[]) =>
      run({ kind: "compare", request, strategies }) as Promise<ClosingResult[]>,
    [run],
  );

  return { run, generate, compare, cancel, progress, running };
}
