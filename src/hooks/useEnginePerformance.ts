/**
 * useEnginePerformance
 * -----------------------------------------------------------------------------
 * Lê e materializa o histórico de performance do motor Caça-Jackpot.
 * Também expõe helpers para (1) registrar novos lotes gerados e
 * (2) avaliar lotes pendentes contra sorteios oficiais posteriores.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PerfLogRow {
  id: string;
  lottery_id: string;
  preset_hash: string;
  preset_label: string | null;
  config: Record<string, unknown>;
  games: number[][];
  generated_at: string;
  evaluated_concurso: number | null;
  evaluated_at: string | null;
  avg_hits: number | null;
  max_hits: number | null;
  tiers_hit: Record<string, number> | null;
}

export interface PresetStats {
  hash: string;
  label: string;
  runs: number;
  evaluated: number;
  avgHits: number;
  bestHits: number;
  tierHits: Record<string, number>;
  lastUsedAt: string;
}

function hashPreset(config: Record<string, unknown>): string {
  const canonical = Object.keys(config)
    .sort()
    .map((k) => `${k}=${JSON.stringify((config as any)[k])}`)
    .join("|");
  // simple djb2
  let h = 5381;
  for (let i = 0; i < canonical.length; i++) h = ((h << 5) + h + canonical.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function useEnginePerformance(lotteryId?: string) {
  const { user } = useAuth();
  const [rows, setRows] = useState<PerfLogRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let q = supabase
        .from("engine_performance_log")
        .select("*")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(200);
      if (lotteryId) q = q.eq("lottery_id", lotteryId);
      const { data, error } = await q;
      if (error) throw error;
      setRows((data ?? []) as unknown as PerfLogRow[]);
    } catch (e) {
      console.warn("[engine-perf] refresh failed", e);
    } finally {
      setLoading(false);
    }
  }, [user, lotteryId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logGeneration = useCallback(
    async (params: {
      lotteryId: string;
      games: number[][];
      config: Record<string, unknown>;
      label?: string;
    }) => {
      if (!user) return null;
      const hash = hashPreset(params.config);
      const { data, error } = await supabase
        .from("engine_performance_log")
        .insert({
          user_id: user.id,
          lottery_id: params.lotteryId,
          preset_hash: hash,
          preset_label: params.label ?? null,
          config: params.config as any,
          games: params.games as any,
        })
        .select()
        .single();
      if (error) {
        console.warn("[engine-perf] log failed", error);
        return null;
      }
      return data;
    },
    [user],
  );

  /** Avalia lotes pendentes contra o próximo concurso oficial. */
  const evaluatePending = useCallback(async () => {
    if (!user) return 0;
    const { data: pending } = await supabase
      .from("engine_performance_log")
      .select("*")
      .eq("user_id", user.id)
      .is("evaluated_concurso", null)
      .limit(50);
    if (!pending || pending.length === 0) return 0;

    let evaluated = 0;
    for (const p of pending) {
      const generatedAt = new Date((p as any).generated_at).toISOString();
      const { data: nextDraw } = await supabase
        .from("lottery_draws")
        .select("concurso, numbers")
        .eq("lottery_id", (p as any).lottery_id)
        .gt("created_at", generatedAt)
        .order("concurso", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!nextDraw) continue;
      const drawSet = new Set<number>((nextDraw as any).numbers as number[]);
      const games: number[][] = ((p as any).games as number[][]) ?? [];
      const hitsPerGame = games.map((g) => g.filter((n) => drawSet.has(n)).length);
      const avg = hitsPerGame.reduce((s, v) => s + v, 0) / Math.max(1, hitsPerGame.length);
      const max = hitsPerGame.reduce((s, v) => (v > s ? v : s), 0);
      const tiers: Record<string, number> = {};
      for (const h of hitsPerGame) {
        const key = String(h);
        tiers[key] = (tiers[key] ?? 0) + 1;
      }
      await supabase
        .from("engine_performance_log")
        .update({
          evaluated_concurso: (nextDraw as any).concurso,
          evaluated_at: new Date().toISOString(),
          avg_hits: Math.round(avg * 100) / 100,
          max_hits: max,
          tiers_hit: tiers,
        })
        .eq("id", (p as any).id);
      evaluated++;
    }
    if (evaluated > 0) await refresh();
    return evaluated;
  }, [user, refresh]);

  const presetSummary: PresetStats[] = (() => {
    const map = new Map<string, PresetStats>();
    for (const r of rows) {
      const key = r.preset_hash;
      const cur =
        map.get(key) ??
        ({
          hash: key,
          label: r.preset_label ?? "Preset",
          runs: 0,
          evaluated: 0,
          avgHits: 0,
          bestHits: 0,
          tierHits: {},
          lastUsedAt: r.generated_at,
        } as PresetStats);
      cur.runs++;
      if (r.evaluated_concurso != null) {
        cur.evaluated++;
        const w = cur.evaluated;
        cur.avgHits = ((cur.avgHits * (w - 1)) + (r.avg_hits ?? 0)) / w;
        if ((r.max_hits ?? 0) > cur.bestHits) cur.bestHits = r.max_hits ?? 0;
        for (const [k, v] of Object.entries(r.tiers_hit ?? {})) {
          cur.tierHits[k] = (cur.tierHits[k] ?? 0) + (v as number);
        }
      }
      if (r.generated_at > cur.lastUsedAt) cur.lastUsedAt = r.generated_at;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.avgHits - a.avgHits);
  })();

  return { rows, presetSummary, loading, refresh, logGeneration, evaluatePending, hashPreset };
}
