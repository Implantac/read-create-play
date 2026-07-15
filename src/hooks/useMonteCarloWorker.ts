/**
 * useMonteCarloWorker — invoca o montecarlo.worker com progresso e cancelamento.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  runMonteCarlo,
  type MonteCarloOptions,
  type MonteCarloResult,
} from "@/engine/closing/simulation/MonteCarloEngine";

export interface MonteCarloProgress {
  stage: "idle" | "running" | "done" | "canceled";
  current: number;
  total: number;
  hitRate?: number;
  startedAt?: number;
}

const IDLE: MonteCarloProgress = { stage: "idle", current: 0, total: 0 };
let idSeq = 0;
const nextId = () => `${Date.now()}-${++idSeq}`;

export class MonteCarloCanceledError extends Error {
  constructor() { super("Simulação cancelada."); this.name = "MonteCarloCanceledError"; }
}

export function useMonteCarloWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef<{
    id: string;
    resolve: (v: MonteCarloResult) => void;
    reject: (e: Error) => void;
  } | null>(null);
  const [progress, setProgress] = useState<MonteCarloProgress>(IDLE);
  const [running, setRunning] = useState(false);

  const spawn = useCallback(() => {
    try {
      const w = new Worker(new URL("@/workers/montecarlo.worker.ts", import.meta.url), { type: "module" });
      w.addEventListener("message", (e: MessageEvent<Record<string, unknown>>) => {
        const data = e.data as { id: string; type: string; [k: string]: unknown };
        if (!pending.current || data.id !== pending.current.id) return;
        if (data.type === "progress") {
          setProgress(p => ({
            stage: "running",
            current: Number(data.current) || 0,
            total: Number(data.total) || 0,
            hitRate: typeof data.hitRate === "number" ? data.hitRate : p.hitRate,
            startedAt: p.startedAt ?? Date.now(),
          }));
        } else if (data.type === "done") {
          const p = pending.current;
          pending.current = null;
          setRunning(false);
          if (data.ok) {
            setProgress(prev => ({ ...prev, stage: "done" }));
            p.resolve(data.result as MonteCarloResult);
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
    p.reject(new MonteCarloCanceledError());
    spawn();
  }, [spawn]);

  const run = useCallback(
    (options: MonteCarloOptions, progressChunks?: number): Promise<MonteCarloResult> => {
      if (pending.current) return Promise.reject(new Error("Já há uma simulação em andamento."));
      setRunning(true);
      setProgress({
        stage: "running",
        current: 0,
        total: options.trials ?? 100_000,
        startedAt: Date.now(),
      });

      const w = workerRef.current;
      if (!w) {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            try {
              const out = runMonteCarlo(options);
              setRunning(false);
              setProgress(p => ({ ...p, stage: "done", current: out.trials, total: out.trials }));
              resolve(out);
            } catch (e) {
              setRunning(false);
              setProgress(IDLE);
              reject(e instanceof Error ? e : new Error(String(e)));
            }
          }, 0);
        });
      }

      return new Promise<MonteCarloResult>((resolve, reject) => {
        const id = nextId();
        pending.current = { id, resolve, reject };
        w.postMessage({ type: "run", id, options, progressChunks });
      });
    },
    [],
  );

  return { run, cancel, progress, running };
}
