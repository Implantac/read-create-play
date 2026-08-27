import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { recordMetric } from "@/lib/performance-metrics";

/**
 * Mede o tempo entre a mudança de rota e o primeiro paint do conteúdo renderizado
 * (inclui o download do chunk lazy + suspense fallback).
 */
export function useRoutePerformance(): void {
  const location = useLocation();
  const startRef = useRef<number>(performance.now());
  const firstRef = useRef(true);

  useLayoutEffect(() => {
    startRef.current = performance.now();
  }, [location.pathname]);

  useEffect(() => {
    const t0 = startRef.current;
    const raf = requestAnimationFrame(() => {
      const value = performance.now() - t0;
      recordMetric({
        name: firstRef.current ? "route-initial" : "route-change",
        value,
        detail: location.pathname,
      });
      firstRef.current = false;
    });
    return () => cancelAnimationFrame(raf);
  }, [location.pathname]);
}
