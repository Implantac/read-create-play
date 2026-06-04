import { DrawResult } from "@/data/lotteries";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { LotteryService, DrawResultWithPrizes, DrawPrizeData, PrizeTierInfo } from "@/services/lottery/lottery.service";

export type { PrizeTierInfo, DrawPrizeData, DrawResultWithPrizes };

/**
 * Hook to load lottery draws from Supabase database using LotteryService
 */
export function useLotteryDraws(lotteryId: string) {


  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [drawsWithPrizes, setDrawsWithPrizes] = useState<DrawResultWithPrizes[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchDraws = useCallback(async (limitCount = 2000) => {
    setLoading(true);
    try {
      const { draws, drawsWithPrizes, totalCount } = await LotteryService.fetchDraws(lotteryId, limitCount);
      setDraws(draws);
      setDrawsWithPrizes(drawsWithPrizes);
      setCount(totalCount);
    } catch (e) {
      console.error("Error fetching draws:", e);
      toast.error("Erro ao carregar sorteios");
    } finally {
      setLoading(false);
    }
  }, [lotteryId]);

  const syncDraws = useCallback(async (isSilent = false) => {
    setSyncing(true);
    setSyncError(null);
    try {
      const data = await LotteryService.syncLottery(lotteryId);
      const result = data?.results?.[0];
      setLastSyncAt(new Date());
      
      if (result) {
        if (result.inserted > 0) {
          if (!isSilent) toast.success(`${result.inserted} novos concursos importados para ${lotteryId}`);
        } else {
          if (!isSilent) toast.info("Banco de dados já está atualizado");
        }
        if (result.errors > 0) {
          console.warn(`${result.errors} erros durante a importação para ${lotteryId}`);
          if (!isSilent) toast.warning(`${result.errors} erros durante a importação`);
        }
      }
      await fetchDraws();
      return { success: true, result };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Erro desconhecido";
      console.error("Sync error:", e);
      setSyncError(errorMessage);
      if (!isSilent) toast.error("Erro ao sincronizar: " + errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSyncing(false);
    }
  }, [lotteryId, fetchDraws]);

  const syncAllLotteries = useCallback(async () => {
    setSyncing(true);
    try {
      const data = await LotteryService.syncLottery();
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
    drawsWithPrizes,
    loading,
    syncing,
    lastSyncAt,
    syncError,
    count,
    syncDraws,
    syncAllLotteries,
    addDraw,
    refetch: fetchDraws,
  };
}
