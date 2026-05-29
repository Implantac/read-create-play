/**
 * Worker contracts (minimal DTOs + helpers)
 * Objective: reduce `any` in worker job/result payloads without breaking runtime.
 */

export type WorkerMessageType =
  | "progress"
  | "result"
  | "SIMULATION_RESULT"
  | "ENTROPY_RESULT"
  | string;

export type WorkerJobBase = {
  // For compatibility with existing workers that send/receive `type`.
  type: string;
};

export type WorkerProgress = {
  type: "progress";
  data: Record<string, unknown>;
};

export type WorkerResult<T = unknown> = {
  type: "result";
  data: T;
};

export type WorkerSimulationResult = {
  topGames?: unknown[];
  totalGenerated?: number;
  totalEvaluated?: number;
  elapsedMs?: number;
  opsPerSecond?: number;
  patternInsights?: unknown;
  distributionSummary?: unknown;
  performances?: unknown;
  convergenceData?: unknown;
  yearlyProjection?: unknown;
  totalIterations?: number;
};

export type AnyWorkerPayload = unknown;

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function isWorkerProgress(x: unknown): x is WorkerProgress {
  if (!isRecord(x)) return false;
  return x.type === "progress" && isRecord(x.data);
}

export function isWorkerResult(x: unknown): x is WorkerResult {
  if (!isRecord(x)) return false;
  return x.type === "result" && isRecord(x.data);
}

/**
 * Generic validator for messages that follow the convention { type, data }.
 * Useful on the UI side where workers may return different payload shapes.
 */
export function isWorkerMessage(x: unknown): x is { type: WorkerMessageType; data: unknown } {
  if (!isRecord(x)) return false;
  return "type" in x && "data" in x;
}

