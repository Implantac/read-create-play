/**
 * useClosingHistory — persiste e lê fechamentos arquivados em `closing_history`.
 * Cada linha representa UM fechamento completo (parâmetros + jogos + métricas).
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ClosingResult } from "@/engine/closing";

export interface ClosingHistoryRow {
  id: string;
  user_id: string;
  lottery_id: string;
  lottery_name: string | null;
  strategy: string;
  base_numbers: number[];
  min_hits: number;
  max_games: number | null;
  game_count: number;
  cost: number;
  games: number[][];
  validation: ClosingResult["validation"];
  score: ClosingResult["score"];
  lower_bound: number | null;
  elapsed_ms: number | null;
  notes: string[] | null;
  created_at: string;
}

export function useClosingHistory(lotteryId?: string) {
  const qc = useQueryClient();

  const { data: history = [], isLoading, refetch } = useQuery({
    queryKey: ["closing-history", lotteryId ?? "all"],
    queryFn: async (): Promise<ClosingHistoryRow[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      let q = supabase
        .from("closing_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (lotteryId) q = q.eq("lottery_id", lotteryId);
      const { data, error } = await q;
      if (error) throw error;
      return (data as unknown as ClosingHistoryRow[]) ?? [];
    },
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (result: ClosingResult) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("closing_history").insert({
        user_id: user.id,
        lottery_id: result.request.lottery.id,
        lottery_name: result.request.lottery.name,
        strategy: result.strategy,
        base_numbers: result.request.baseNumbers,
        min_hits: result.request.guarantee.minHits,
        max_games: result.request.maxGames ?? null,
        game_count: result.gameCount,
        cost: result.cost,
        games: result.games as unknown as never,
        validation: result.validation as unknown as never,
        score: result.score as unknown as never,
        lower_bound: result.lowerBound,
        elapsed_ms: result.elapsedMs,
        notes: result.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["closing-history"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("closing_history").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Fechamento removido do histórico.");
      qc.invalidateQueries({ queryKey: ["closing-history"] });
    },
    onError: () => toast.error("Falha ao remover fechamento."),
  });

  const saveClosing = useCallback(async (result: ClosingResult): Promise<boolean> => {
    try { await saveMutation.mutateAsync(result); return true; }
    catch { return false; }
  }, [saveMutation]);

  const deleteClosing = useCallback(async (id: string): Promise<boolean> => {
    try { await deleteMutation.mutateAsync(id); return true; }
    catch { return false; }
  }, [deleteMutation]);

  return { history, isLoading, saveClosing, deleteClosing, refetch };
}
