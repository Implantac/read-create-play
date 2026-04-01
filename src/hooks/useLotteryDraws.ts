import { supabase } from "@/integrations/supabase/client";
import { DrawResult } from "@/data/lotteries";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

export interface PrizeTierInfo {
  descricao: string;
  faixa: number;
  ganhadores: number;
  valorPremio: number;
}

export interface DrawPrizeData {
  premiacoes: PrizeTierInfo[];
  acumulou: boolean;
  valorAcumulado: number;
  valorEstimado: number;
  valorArrecadado: number;
}

export interface DrawResultWithPrizes extends DrawResult {
  prizeTiers?: DrawPrizeData | null;
}

/**
 * Hook to load lottery draws from Supabase database
 */
export function useLotteryDraws(lotteryId: string) {
  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [drawsWithPrizes, setDrawsWithPrizes] = useState<DrawResultWithPrizes[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [count, setCount] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const mapRows = useCallback((allData: any[]) => {
    const mapped: DrawResult[] = allData.map((row: any) => ({
      concurso: row.concurso,
      date: row.draw_date || "",
      numbers: row.numbers || [],
    }));
    const mappedWithPrizes: DrawResultWithPrizes[] = allData.map((row: any) => ({
      concurso: row.concurso,
      date: row.draw_date || "",
      numbers: row.numbers || [],
      prizeTiers: row.prize_tiers as DrawPrizeData | null,
    }));
    return { mapped, mappedWithPrizes };
  }, []);

  const fetchDraws = useCallback(async () => {
    // Cancel any in-flight request
    cancelRef.current.cancelled = true;
    const signal = { cancelled: false };
    cancelRef.current = signal;

    setLoading(true);
    try {
      const { data: initialData, error: initialError, count: totalCount } = await supabase
        .from("lottery_draws")
        .select("concurso, draw_date, numbers, prize_tiers", { count: "exact" })
        .eq("lottery_id", lotteryId)
        .order("concurso", { ascending: false })
        .range(0, 49);

      if (initialError) throw initialError;
      if (signal.cancelled) return;

      const total = totalCount ?? 0;
      setCount(total);

      if (initialData && initialData.length > 0) {
        const { mapped, mappedWithPrizes } = mapRows(initialData);
        setDraws(mapped);
        setDrawsWithPrizes(mappedWithPrizes);
        setLoadedCount(initialData.length);
      } else {
        setDraws([]);
        setDrawsWithPrizes([]);
        setLoadedCount(0);
      }

      setLoading(false);

      // Background: load remaining draws
      if (total > 50) {
        let allData = initialData ? [...initialData] : [];
        let from = 50;
        const pageSize = 1000;

        while (from < total) {
          if (signal.cancelled) return;
          const { data, error: pageError } = await supabase
            .from("lottery_draws")
            .select("concurso, draw_date, numbers, prize_tiers")
            .eq("lottery_id", lotteryId)
            .order("concurso", { ascending: false })
            .range(from, from + pageSize - 1);

          if (pageError) break;
          if (!data || data.length === 0) break;
          allData = allData.concat(data);
          if (!signal.cancelled) setLoadedCount(allData.length);
          if (data.length < pageSize) break;
          from += pageSize;
        }

        if (!signal.cancelled) {
          const { mapped, mappedWithPrizes } = mapRows(allData);
          setDraws(mapped);
          setDrawsWithPrizes(mappedWithPrizes);
        }
      }
    } catch (e) {
      console.error("Error fetching draws:", e);
    } finally {
      if (!signal.cancelled) setLoading(false);
    }
  }, [lotteryId, mapRows]);

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
    return () => {
      cancelRef.current.cancelled = true;
    };
  }, [fetchDraws]);

  return {
    draws,
    drawsWithPrizes,
    loading,
    syncing,
    count,
    loadedCount,
    syncDraws,
    syncAllLotteries,
    addDraw,
    refetch: fetchDraws,
  };
}
