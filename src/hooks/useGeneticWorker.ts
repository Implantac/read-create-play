/**
 * useGeneticWorker — invoca o genetic.worker com progresso e cancelamento.
 * Fallback inline caso o worker não instancie.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  runGeneticAlgorithm,
  type GAOptions,
  type GAOutput,
} from "@/engine/closing/generators/GeneticOptimizer";

export interface GeneticProgress {
  stage: "idle" | "running" | "done" | "canceled";
  gen: number;
  best: number;
  avg: number;
  startedAt?: number;
}

const IDLE: GeneticProgress = { stage: "idle", gen: 0, best: 0, avg: 0 };
let idSeq = 0;
const nextId = () => `${Date.now()}-${++idSeq}`;

export class GeneticCanceledError extends Error {
  constructor() { super("Execução cancelada."); this.name = "GeneticCanceledError"; }
}

export function useGeneticWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef<{
    id: string;
    resolve: (v: GAOutput) => void;
    reject: (e: Error) => void;
  } | null>(null);
  const [progress, setProgress] = useState<GeneticProgress>(IDLE);
  const [running, setRunning] = useState(false);

  const spawn = useCallback(() => {
    try {
      const w = new Worker(new URL("@/workers/genetic.worker.ts", import.meta.url), { type: "module" });
      w.addEventListener("message", (e: MessageEvent<Record<string, unknown>>) => {
        const data = e.data as { id: string; type: string; [k: string]: unknown };
        if (!pending.current || data.id !== pending.current.id) return;
        if (data.type === "progress") {
          setProgress(p => ({
            stage: "running",
            gen: Number(data.gen) || 0,
            best: Number(data.best) || 0,
            avg: Number(data.avg) || 0,
            startedAt: p.startedAt ?? Date.now(),
          }));
        } else if (data.type === "done") {
          const p = pending.current;
          pending.current = null;
          setRunning(false);
          if (data.ok) {
            setProgress(prev => ({ ...prev, stage: "done" }));
            p.resolve(data.result as GAOutput);
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
    setProgress({ stage: "canceled", gen: 0, best: 0, avg: 0 });
    p.reject(new GeneticCanceledError());
    spawn();
  }, [spawn]);

  const run = useCallback(
    (baseSize: number, pick: number, m: number, options?: Omit<GAOptions, "onProgress">): Promise<GAOutput> => {
      if (pending.current) return Promise.reject(new Error("Já há uma execução em andamento."));
      setRunning(true);
      setProgress({ stage: "running", gen: 0, best: 0, avg: 0, startedAt: Date.now() });

      const w = workerRef.current;
      if (!w) {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            try {
              const out = runGeneticAlgorithm(baseSize, pick, m, {
                ...(options ?? {}),
                onProgress: (gen, best, avg) =>
                  setProgress({ stage: "running", gen, best, avg }),
              });
              setRunning(false);
              setProgress(p => ({ ...p, stage: "done" }));
              resolve(out);
            } catch (e) {
              setRunning(false);
              setProgress(IDLE);
              reject(e instanceof Error ? e : new Error(String(e)));
            }
          }, 0);
        });
      }

      return new Promise<GAOutput>((resolve, reject) => {
        const id = nextId();
        pending.current = { id, resolve, reject };
        w.postMessage({ type: "run", id, baseSize, pick, m, options });
      });
    },
    [],
  );

  return { run, cancel, progress, running };
}
