import { supabase } from "@/integrations/supabase/client";
import { DrawResult } from "@/data/lotteries";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

/**
 * Hook to load lottery draws from Supabase database
 */
export function useLotteryDraws(lotteryId: string) {
  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [count, setCount] = useState(0);

  const fetchDraws = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error, count: totalCount } = await supabase
        .from("lottery_draws")
        .select("concurso, draw_date, numbers", { count: "exact" })
        .eq("lottery_id", lotteryId)
        .order("concurso", { ascending: false });

      if (error) throw error;

      const mapped: DrawResult[] = (data || []).map((row: any) => ({
        concurso: row.concurso,
        date: row.draw_date || "",
        numbers: row.numbers || [],
      }));

      setDraws(mapped);
      setCount(totalCount || mapped.length);
    } catch (e) {
      console.error("Error fetching draws:", e);
      // Don't show error toast on initial load - data might not be synced yet
    } finally {
      setLoading(false);
    }
  }, [lotteryId]);

  const syncDraws = useCallback(async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-lottery-draws", {
        body: { lottery_id: lotteryId },
      });

      if (error) throw error;

      const result = data?.results?.[0];
      if (result) {
        if (result.inserted > 0) {
          toast.success(`${result.inserted} novos concursos importados para ${lotteryId}`);
        } else {
          toast.info("Banco de dados já está atualizado");
        }
        if (result.errors > 0) {
          toast.warning(`${result.errors} erros durante a importação`);
        }
      }

      // Reload draws after sync
      await fetchDraws();
    } catch (e) {
      console.error("Sync error:", e);
      toast.error("Erro ao sincronizar: " + (e instanceof Error ? e.message : "Erro desconhecido"));
    } finally {
      setSyncing(false);
    }
  }, [lotteryId, fetchDraws]);

  const syncAllLotteries = useCallback(async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-lottery-draws", {
        body: {},
      });

      if (error) throw error;

      let totalInserted = 0;
      let totalErrors = 0;
      (data?.results || []).forEach((r: any) => {
        totalInserted += r.inserted || 0;
        totalErrors += r.errors || 0;
      });

      if (totalInserted > 0) {
        toast.success(`${totalInserted} concursos importados de todas as loterias`);
      } else {
        toast.info("Todas as loterias já estão atualizadas");
      }
      if (totalErrors > 0) {
        toast.warning(`${totalErrors} erros durante a importação`);
      }

      await fetchDraws();
    } catch (e) {
      console.error("Sync all error:", e);
      toast.error("Erro ao sincronizar todas as loterias");
    } finally {
      setSyncing(false);
    }
  }, [fetchDraws]);

  const addDraw = useCallback((draw: DrawResult) => {
    setDraws(prev => {
      if (prev.some(d => d.concurso === draw.concurso)) return prev;
      return [draw, ...prev].sort((a, b) => b.concurso - a.concurso);
    });
  }, []);

  useEffect(() => {
    fetchDraws();
  }, [fetchDraws]);

  return {
    draws,
    loading,
    syncing,
    count,
    syncDraws,
    syncAllLotteries,
    addDraw,
    refetch: fetchDraws,
  };
}
