import { DrawResult } from "@/data/lotteries";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { LotteryService, DrawResultWithPrizes, DrawPrizeData, PrizeTierInfo } from "@/services/lottery/lottery.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type { PrizeTierInfo, DrawPrizeData, DrawResultWithPrizes };

export function useLotteryDraws(lotteryId: string) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ["lottery-draws", lotteryId],
    queryFn: () => LotteryService.fetchDraws(lotteryId, 500),
    staleTime: 5 * 60 * 1000, 
    gcTime: 30 * 60 * 1000,
  });

  const syncMutation = useMutation({
    mutationFn: (isSilent: boolean = false) => LotteryService.syncLottery(lotteryId),
    onMutate: () => {
      setSyncing(true);
      setSyncError(null);
    },
    onSuccess: (data, isSilent) => {
      setLastSyncAt(new Date());
      const result = data?.results?.[0];
      if (result && result.inserted > 0) {
        if (!isSilent) toast.success(`${result.inserted} novos concursos importados`);
      } else if (!isSilent && !syncMutation.isPending) {
        toast.info("Dados já atualizados");
      }
      queryClient.invalidateQueries({ queryKey: ["lottery-draws", lotteryId] });
    },
    onError: (e: any, isSilent) => {
      const errorMessage = e instanceof Error ? e.message : "Erro na sincronização";
      setSyncError(errorMessage);
      if (!isSilent) toast.error(errorMessage);
    },
    onSettled: () => setSyncing(false),
  });

  const syncDraws = useCallback(async (isSilent = false) => {
    try {
      const result = await syncMutation.mutateAsync(isSilent);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro" };
    }
  }, [syncMutation]);

  const syncAllLotteries = useCallback(async () => {
    setSyncing(true);
    try {
      await LotteryService.syncLottery();
      queryClient.invalidateQueries({ queryKey: ["lottery-draws"] });
      toast.success("Sincronização iniciada");
    } catch (e) {
      toast.error("Erro ao sincronizar tudo");
    } finally {
      setSyncing(false);
    }
  }, [queryClient]);

  const addDraw = useCallback((draw: DrawResult) => {
    queryClient.setQueryData(["lottery-draws", lotteryId], (old: any) => {
      if (!old) return old;
      if (old.draws.some((d: any) => d.concurso === draw.concurso)) return old;
      return {
        ...old,
        draws: [draw, ...old.draws].sort((a, b) => b.concurso - a.concurso),
      };
    });
  }, [queryClient, lotteryId]);

  return {
    draws: data?.draws || [],
    drawsWithPrizes: data?.drawsWithPrizes || [],
    loading,
    syncing,
    lastSyncAt,
    syncError,
    count: data?.totalCount || 0,
    syncDraws,
    syncAllLotteries,
    addDraw,
    refetch,
  };
}