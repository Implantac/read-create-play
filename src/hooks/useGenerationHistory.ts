import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GenerationRecord {
  id: string;
  lottery_id: string;
  numbers: number[];
  score: number;
  strategy: string;
  description: string;
  pipeline: { step: string; detail: string; count: number }[];
  created_at: string;
}

export function useGenerationHistory(lotteryId: string) {
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("generation_history")
      .select("*")
      .eq("user_id", user.id)
      .eq("lottery_id", lotteryId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setHistory(data as any[]);
    }
    setLoading(false);
  }, [lotteryId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveGeneration = useCallback(async (record: {
    numbers: number[];
    score: number;
    strategy: string;
    description: string;
    pipeline: any;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("generation_history")
      .insert({
        user_id: user.id,
        lottery_id: lotteryId,
        numbers: record.numbers,
        score: record.score,
        strategy: record.strategy,
        description: record.description,
        pipeline: record.pipeline,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving generation:", error);
      return null;
    }

    setHistory(prev => [data as any, ...prev].slice(0, 10));
    return data;
  }, [lotteryId]);

  const deleteGeneration = useCallback(async (id: string) => {
    const { error } = await supabase.from("generation_history").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover registro");
      return;
    }
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  return { 
    history, 
    loading, 
    saveGeneration, 
    deleteGeneration, 
    refetch: fetchHistory 
  };
}
