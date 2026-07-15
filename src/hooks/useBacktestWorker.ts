/**
 * useBacktestWorker — invoca o backtest.worker com progresso e cancelamento.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  runHistoricalBacktest,
  type BacktestOptions,
  type BacktestResult,
} from "@/engine/closing/simulation/HistoricalBacktest";

export interface BacktestProgress {
  stage: "idle" | "running" | "done" | "canceled";
  current: number;
  total: number;
  startedAt?: number;
}

const IDLE: BacktestProgress = { stage: "idle", current: 0, total: 0 };
let idSeq = 0;
const nextId = () => `${Date.now()}-${++idSeq}`;

export class BacktestCanceledError extends Error {
  constructor() { super("Backtest cancelado."); this.name = "BacktestCanceledError"; }
}

export function useBacktestWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef<{
    id: string;
    resolve: (v: BacktestResult) => void;
    reject: (e: Error) => void;
  } | null>(null);
  const [progress, setProgress] = useState<BacktestProgress>(IDLE);
  const [running, setRunning] = useState(false);

  const spawn = useCallback(() => {
    try {
      const w = new Worker(new URL("@/workers/backtest.worker.ts", import.meta.url), { type: "module" });
      w.addEventListener("message", (e: MessageEvent<Record<string, unknown>>) => {
        const data = e.data as { id: string; type: string; [k: string]: unknown };
        if (!pending.current || data.id !== pending.current.id) return;
        if (data.type === "progress") {
          setProgress(p => ({
            stage: "running",
            current: Number(data.current) || 0,
            total: Number(data.total) || 0,
            startedAt: p.startedAt ?? Date.now(),
          }));
        } else if (data.type === "done") {
          const p = pending.current;
          pending.current = null;
          setRunning(false);
          if (data.ok) {
            setProgress(prev => ({ ...prev, stage: "done" }));
            p.resolve(data.result as BacktestResult);
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
    p.reject(new BacktestCanceledError());
    spawn();
  }, [spawn]);

  const run = useCallback(
    (options: BacktestOptions, chunkSize?: number): Promise<BacktestResult> => {
      if (pending.current) return Promise.reject(new Error("Já há um backtest em andamento."));
      setRunning(true);
      setProgress({
        stage: "running",
        current: 0,
        total: options.draws.length,
        startedAt: Date.now(),
      });

      const w = workerRef.current;
      if (!w) {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            try {
              const out = runHistoricalBacktest(options);
              setRunning(false);
              setProgress(p => ({ ...p, stage: "done", current: out.totalDraws, total: out.totalDraws }));
              resolve(out);
            } catch (e) {
              setRunning(false);
              setProgress(IDLE);
              reject(e instanceof Error ? e : new Error(String(e)));
            }
          }, 0);
        });
      }

      return new Promise<BacktestResult>((resolve, reject) => {
        const id = nextId();
        pending.current = { id, resolve, reject };
        w.postMessage({ type: "run", id, options, chunkSize });
      });
    },
    [],
  );

  return { run, cancel, progress, running };
}
