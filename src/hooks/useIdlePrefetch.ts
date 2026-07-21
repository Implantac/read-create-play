import { useEffect } from "react";

type Loader = () => Promise<unknown>;

/**
 * Prefetches route chunks during browser idle time to make subsequent navigation instant.
 * Safe no-op on SSR / when requestIdleCallback is unavailable (falls back to setTimeout).
 */
export function useIdlePrefetch(loaders: Loader[], enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      for (const load of loaders) {
        try { load().catch(() => {}); } catch { /* ignore */ }
      }
    };

    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
      .requestIdleCallback;
    const handle = ric
      ? ric(run, { timeout: 2500 })
      : window.setTimeout(run, 1200);

    return () => {
      cancelled = true;
      const cic = (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
      if (ric && cic) cic(handle as number);
      else window.clearTimeout(handle as number);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
