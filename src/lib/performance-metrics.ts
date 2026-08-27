/**
 * performance-metrics — coleta leve de métricas de performance do app.
 *
 * - Core Web Vitals (LCP, CLS, INP, FCP, TTFB) via `web-vitals`.
 * - Tempo de carregamento/troca de rota (navegação client-side).
 * - Tempo de download de chunks lazy (via PerformanceObserver de "resource").
 *
 * Os dados ficam em memória (últimos 100 eventos) e são expostos em
 * `window.__titanPerf` para inspeção. Nenhum dado é enviado para fora.
 */

export type PerfMetric = {
  name: string;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  detail?: string;
  at: number;
};

const MAX_EVENTS = 100;
const metrics: PerfMetric[] = [];
const listeners = new Set<(m: PerfMetric) => void>();

const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;

export function recordMetric(metric: Omit<PerfMetric, "at">): void {
  const entry: PerfMetric = { ...metric, at: Date.now() };
  metrics.push(entry);
  if (metrics.length > MAX_EVENTS) metrics.shift();
  listeners.forEach((fn) => {
    try {
      fn(entry);
    } catch {
      /* ignore */
    }
  });
  if (isDev) {
    // eslint-disable-next-line no-console
    console.debug(
      `[perf] ${entry.name}: ${Math.round(entry.value)}ms${entry.rating ? ` (${entry.rating})` : ""}${entry.detail ? ` — ${entry.detail}` : ""}`,
    );
  }
}

export function getMetrics(): PerfMetric[] {
  return [...metrics];
}

export function onMetric(fn: (m: PerfMetric) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Marca o início de uma navegação e devolve a função que finaliza a medição. */
export function startRouteMeasure(path: string): () => void {
  const t0 = performance.now();
  let done = false;
  return () => {
    if (done) return;
    done = true;
    recordMetric({ name: "route-render", value: performance.now() - t0, detail: path });
  };
}

let initialized = false;

export async function initPerformanceMetrics(): Promise<void> {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  (window as unknown as Record<string, unknown>).__titanPerf = {
    getMetrics,
    onMetric,
  };

  // Core Web Vitals — import dinâmico para não pesar no bundle inicial.
  try {
    const { onLCP, onCLS, onINP, onFCP, onTTFB } = await import("web-vitals");
    const report = (m: { name: string; value: number; rating: string }) =>
      recordMetric({ name: m.name, value: m.value, rating: m.rating as PerfMetric["rating"] });
    onLCP(report);
    onCLS(report);
    onINP(report);
    onFCP(report);
    onTTFB(report);
  } catch {
    /* web-vitals indisponível — segue sem vitals */
  }

  // Tempo de download dos chunks lazy das rotas.
  try {
    if ("PerformanceObserver" in window) {
      const obs = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          const r = e as PerformanceResourceTiming;
          if (r.initiatorType !== "script" || !/\.js(\?|$)/.test(r.name)) continue;
          if (r.duration < 30) continue; // ignora ruído de cache
          const file = r.name.split("/").pop() ?? r.name;
          recordMetric({ name: "chunk-load", value: r.duration, detail: file });
        }
      });
      obs.observe({ type: "resource", buffered: true });
    }
  } catch {
    /* ignore */
  }

  // Boot inicial (navigation timing).
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      recordMetric({ name: "dom-content-loaded", value: nav.domContentLoadedEventEnd - nav.startTime });
      recordMetric({ name: "load", value: nav.loadEventEnd - nav.startTime });
    }
  } catch {
    /* ignore */
  }
}
