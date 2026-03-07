import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SavedBet {
  id: string;
  lottery_id: string;
  numbers: number[];
  strategy: string | null;
  score: number | null;
  grade: string | null;
  label: string | null;
  created_at: string;
}

export function useSavedBets(lotteryId: string) {
  const [savedBets, setSavedBets] = useState<SavedBet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBets = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("saved_bets")
      .select("*")
      .eq("user_id", user.id)
      .eq("lottery_id", lotteryId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSavedBets(data as SavedBet[]);
    }
    setLoading(false);
  }, [lotteryId]);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  const saveBet = useCallback(async (bet: {
    numbers: number[];
    strategy?: string;
    score?: number;
    grade?: string;
    label?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login para salvar apostas");
      return false;
    }

    const { error } = await supabase.from("saved_bets").insert({
      user_id: user.id,
      lottery_id: lotteryId,
      numbers: bet.numbers,
      strategy: bet.strategy || null,
      score: bet.score || null,
      grade: bet.grade || null,
      label: bet.label || null,
    });

    if (error) {
      toast.error("Erro ao salvar aposta");
      return false;
    }

    toast.success("Aposta salva!");
    fetchBets();
    return true;
  }, [lotteryId, fetchBets]);

  const updateBet = useCallback(async (id: string, updates: { label?: string; strategy?: string }) => {
    const { error } = await supabase.from("saved_bets").update(updates).eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar aposta");
      return false;
    }
    toast.success("Aposta atualizada");
    setSavedBets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    return true;
  }, []);

  const deleteBet = useCallback(async (id: string) => {
    const { error } = await supabase.from("saved_bets").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover aposta");
      return;
    }
    toast.success("Aposta removida");
    setSavedBets(prev => prev.filter(b => b.id !== id));
  }, []);

  return { savedBets, loading, saveBet, updateBet, deleteBet, refetch: fetchBets };
}
