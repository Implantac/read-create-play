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
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      if (result) {
        if (result.inserted > 0) {
          if (!isSilent) toast.success(`${result.inserted} novos concursos importados`);
        } else if (!isSilent) {
          toast.info("Dados já atualizados");
        }
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
    return syncMutation.mutateAsync(isSilent).then(() => ({ success: true })).catch(() => ({ success: false }));
  }, [syncMutation]);

  return {
    draws: data?.draws || [],
    drawsWithPrizes: data?.drawsWithPrizes || [],
    loading,
    syncing,
    lastSyncAt,
    syncError,
    count: data?.totalCount || 0,
    syncDraws,
    refetch,
  };
}
