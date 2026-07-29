/**
 * Sinais compartilhados de qualidade Lotofácil.
 *
 * Fonte única de verdade dos filtros/bandas usados por `JackpotFocusPanel`,
 * `strategyLotofacilJackpot`, `coreSectors`/`repetition`/`coreRepetition`
 * e qualquer painel futuro. Antes desta consolidação as constantes
 * (frame, cantos, cols, alvo de repetição, faixa de soma) viviam
 * duplicadas em pelo menos 4 arquivos com valores divergentes.
 */

import type { DrawResult } from "@/data/lotteries";
import {
  LOTOFACIL_FRAME,
  LOTOFACIL_CENTER,
  LOTOFACIL_CORNERS,
  LOTOFACIL_MULT3,
  LOTOFACIL_FRAME_RANGE,
  LOTOFACIL_REPEAT_RANGE,
  LOTOFACIL_SUM_RANGE,
  PRIMES,
  FIBONACCI,
  lotofacilCol,
  lotofacilRow,
} from "@/ai/knowledge/lotteriesKnowledge";
import { chiSquareDecades, anomalyProfile } from "./statisticalTests";

export interface QualitySignal {
  label: string;
  ok: boolean;
  hint: string;
  /** Severidade quando não OK (info: neutro; warn: subótimo; error: viola padrão) */
  severity?: "info" | "warn" | "error";
}

/**
 * Sinais completos para um jogo Lotofácil de 15 dezenas.
 * Inclui as verificações clássicas (frame, cantos, colunas, repetição,
 * consecutivos, primos, fibonacci, múltiplos de 3, soma, paridade) MAIS
 * dois sinais estatísticos formais que o sistema não expunha antes:
 *   - χ² da distribuição por décadas (1-10, 11-20, 21-25)
 *   - Perfil de anomalias de atraso (dezenas vencidas × sobre-repetidas)
 * E também checa **linhas** do grid 5×5 (antes só colunas eram verificadas).
 */
export function computeLotofacilSignals(
  numbers: number[],
  draws: DrawResult[],
): QualitySignal[] {
  const set = new Set(numbers);
  const sorted = [...numbers].sort((a, b) => a - b);

  const frameCount = numbers.filter((n) => LOTOFACIL_FRAME.has(n)).length;
  const centerCount = numbers.filter((n) => LOTOFACIL_CENTER.has(n)).length;
  const last = draws[0]?.numbers ?? [];
  const reps = last.filter((n) => set.has(n)).length;
  const hasPair = sorted.some((n, i) => i > 0 && n - sorted[i - 1] === 1);
  const cols = new Set(numbers.map((n) => lotofacilCol(n)));
  const rows = new Set(numbers.map((n) => lotofacilRow(n)));
  const cornerHits = [...LOTOFACIL_CORNERS].filter((c) => set.has(c)).length;
  const sum = numbers.reduce((a, b) => a + b, 0);
  const odd = numbers.filter((n) => n % 2 === 1).length;
  const primeHits = numbers.filter((n) => PRIMES.has(n)).length;
  const fiboHits = numbers.filter((n) => FIBONACCI.has(n)).length;
  const mult3Hits = numbers.filter((n) => LOTOFACIL_MULT3.has(n)).length;

  const [frameLo, frameHi] = LOTOFACIL_FRAME_RANGE;
  const [repLo, repHi] = LOTOFACIL_REPEAT_RANGE;
  const [sumLo, sumHi] = LOTOFACIL_SUM_RANGE;

  const chi = chiSquareDecades(numbers);
  const anomaly = anomalyProfile(numbers, draws, 25, 15);

  const signals: QualitySignal[] = [
    {
      label: `Moldura ${frameCount}·${centerCount}`,
      ok: frameCount >= frameLo && frameCount <= frameHi,
      hint: `Moldura ${frameLo}-${frameHi} · miolo complementar (padrão 87% dos sorteios)`,
      severity: "warn",
    },
    {
      label: `Repete ${reps}`,
      ok: reps >= repLo && reps <= repHi,
      hint: `Ideal ${repLo}-${repHi} do sorteio anterior (~92% dos sorteios)`,
      severity: "error",
    },
    {
      label: hasPair ? "Consec. ✓" : "Consec. ✗",
      ok: hasPair,
      hint: "≥1 par consecutivo (~97% dos sorteios)",
      severity: "warn",
    },
    {
      label: `${cols.size}/5 col.`,
      ok: cols.size === 5,
      hint: "Cobertura das 5 colunas do grid 5×5",
      severity: "warn",
    },
    {
      label: `${rows.size}/5 lin.`,
      ok: rows.size === 5,
      hint: "Cobertura das 5 linhas do grid 5×5",
      severity: "warn",
    },
    {
      label: cornerHits > 0 ? `Cantos ${cornerHits}` : "Sem canto",
      ok: cornerHits >= 1,
      hint: "≥1 âncora física (1, 5, 21, 25) — presente em ~78% dos sorteios",
      severity: "warn",
    },
    {
      label: `Soma ${sum}`,
      ok: sum >= sumLo && sum <= sumHi,
      hint: `Ideal ${sumLo}-${sumHi} (soma média histórica ≈ 195)`,
      severity: "warn",
    },
    {
      label: `${odd}P/${15 - odd}I`,
      ok: odd >= 6 && odd <= 9,
      hint: "Equilíbrio par/ímpar 6-9 (~89% dos sorteios)",
      severity: "warn",
    },
    {
      label: `Primos ${primeHits}`,
      ok: primeHits >= 4 && primeHits <= 7,
      hint: "Primos 4-7 (média histórica 5.5)",
      severity: "info",
    },
    {
      label: `Múlt.3: ${mult3Hits}`,
      ok: mult3Hits >= 4 && mult3Hits <= 6,
      hint: "Múltiplos de 3: 4-6 (padrão histórico)",
      severity: "info",
    },
    {
      label: `Fibo ${fiboHits}`,
      ok: fiboHits >= 3 && fiboHits <= 6,
      hint: "Fibonacci 3-6 (dezenas em {1,2,3,5,8,13,21})",
      severity: "info",
    },
    {
      label: `χ² ${chi.chi2.toFixed(1)}`,
      ok: chi.chi2 < 6.0, // p > ~0.05 com df=2
      hint: `Distribuição por décadas · p=${chi.pValue.toFixed(3)} (χ² baixo = bem distribuído)`,
      severity: "info",
    },
    {
      label: `Atrasadas ${anomaly.overdue}`,
      ok: anomaly.overdue >= 1 && anomaly.overdue <= 5,
      hint: `Dezenas com z-score>1.5 (vencidas). ${anomaly.hot} sobre-repetidas · ${anomaly.neutral} neutras`,
      severity: "info",
    },
  ];

  return signals;
}

/**
 * Versão compacta: só sinais críticos (frame, repete, cols, cantos)
 * para uso em listas densas sem sobrecarga visual.
 */
export function computeLotofacilSignalsCompact(
  numbers: number[],
  draws: DrawResult[],
): QualitySignal[] {
  return computeLotofacilSignals(numbers, draws).filter((s) =>
    s.severity === "error" || s.severity === "warn",
  );
}

/**
 * Score agregado 0-100 baseado exclusivamente nos sinais compartilhados.
 * Útil para ranking secundário ou tiebreaker sem depender de bet-quality.
 */
export function signalsScore(numbers: number[], draws: DrawResult[]): number {
  const signals = computeLotofacilSignals(numbers, draws);
  const errors = signals.filter((s) => s.severity === "error");
  const warns = signals.filter((s) => s.severity === "warn");
  const infos = signals.filter((s) => s.severity === "info");
  const errorScore = errors.length === 0 ? 0 : (errors.filter((s) => s.ok).length / errors.length) * 40;
  const warnScore = warns.length === 0 ? 0 : (warns.filter((s) => s.ok).length / warns.length) * 40;
  const infoScore = infos.length === 0 ? 0 : (infos.filter((s) => s.ok).length / infos.length) * 20;
  return Math.round(errorScore + warnScore + infoScore);
}
