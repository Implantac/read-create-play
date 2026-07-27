import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LotteryROI } from "@/engine/bankroll/bankrollEngine";

/**
 * Agrega o histórico do usuário em user_roi_tracking por modalidade.
 * Retorna array pronto para alimentar o Bankroll Engine.
 */
export function useROIByLottery() {
  const [data, setData] = useState<LotteryROI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data: rows, error } = await supabase
        .from("user_roi_tracking")
        .select("lottery_id, amount_spent, amount_won")
        .eq("user_id", user.id);

      if (cancelled) return;

      if (error || !rows) {
        setLoading(false);
        return;
      }

      const map = new Map<string, { spent: number; won: number; bets: number; wins: number }>();
      for (const row of rows) {
        const cur = map.get(row.lottery_id) ?? { spent: 0, won: 0, bets: 0, wins: 0 };
        cur.spent += Number(row.amount_spent) || 0;
        cur.won += Number(row.amount_won) || 0;
        cur.bets += 1;
        if ((Number(row.amount_won) || 0) > 0) cur.wins += 1;
        map.set(row.lottery_id, cur);
      }

      const roi: LotteryROI[] = Array.from(map.entries()).map(([lotteryId, v]) => ({
        lotteryId,
        totalSpent: v.spent,
        totalWon: v.won,
        bets: v.bets,
        hitRate: v.bets ? v.wins / v.bets : 0,
        roi: v.spent > 0 ? (v.won - v.spent) / v.spent : 0,
      }));

      setData(roi);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  return { data, loading };
}
