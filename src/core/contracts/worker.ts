/**
 * Worker contracts — reexports the base worker DTO helpers and adds
 * per-worker job/result shapes so callers can stop reaching for `any`.
 *
 * Runtime behaviour is unchanged; these are purely compile-time contracts
 * with lightweight guards for the UI/worker boundary.
 */

export {
  isWorkerMessage,
  isWorkerProgress,
  isWorkerResult,
  isWorkerSimulationResult,
} from "@/core/workerContracts";

export type {
  WorkerMessageType,
  WorkerJobBase,
  WorkerProgress,
  WorkerResult,
  WorkerSimulationResult,
  AnyWorkerPayload,
} from "@/core/workerContracts";

// ─── Per-worker job kinds (loose union — workers keep their own switch) ──

export type ClosingWorkerJobKind =
  | "generate"
  | "validate"
  | "optimize"
  | "backtest"
  | "simulate";

export type BacktestWorkerJobKind = "run" | "cancel";

export type GeneticWorkerJobKind = "start" | "cancel";

export type MonteCarloWorkerJobKind = "start" | "cancel";

/**
 * Generic envelope used by most workers: `{ type, payload }`.
 * Kept intentionally open — each worker refines `payload` internally.
 */
export interface WorkerJobEnvelope<K extends string = string, P = unknown> {
  type: K;
  payload?: P;
}

export interface WorkerResultEnvelope<T = unknown> {
  type: "result" | "progress" | "error";
  data?: T;
  error?: string;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function isWorkerErrorMessage(x: unknown): x is { type: "error"; error: string } {
  return isRecord(x) && x.type === "error" && typeof x.error === "string";
}
