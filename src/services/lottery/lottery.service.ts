import { supabase } from "@/integrations/supabase/client";
import { DrawResult } from "@/data/lotteries";

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

export class LotteryService {
  static async fetchDraws(lotteryId: string, limitCount = 500) {
    let allData: any[] = [];
    let from = 0;
    const pageSize = Math.min(limitCount, 1000);
    let totalCount = 0;

    // First fetch to get count and initial data
    const { data, error, count } = await supabase
      .from("lottery_draws")
      .select("concurso, draw_date, numbers, prize_tiers", { count: "exact" })
      .eq("lottery_id", lotteryId)
      .order("concurso", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (count !== null) totalCount = count;
    if (data) allData = data;

    // Continue fetching if we need more to reach limitCount
    while (allData.length < limitCount && data && data.length === pageSize) {
      from += pageSize;
      const nextSize = Math.min(pageSize, limitCount - allData.length);
      const { data: nextData, error: nextError } = await supabase
        .from("lottery_draws")
        .select("concurso, draw_date, numbers, prize_tiers")
        .eq("lottery_id", lotteryId)
        .order("concurso", { ascending: false })
        .range(from, from + nextSize - 1);

      if (nextError) throw nextError;
      if (!nextData || nextData.length === 0) break;
      allData = allData.concat(nextData);
      if (nextData.length < nextSize) break;
    }

    return {
      draws: allData.map(row => ({
        concurso: row.concurso,
        date: row.draw_date || "",
        numbers: row.numbers || [],
      })) as DrawResult[],
      drawsWithPrizes: allData.map(row => ({
        concurso: row.concurso,
        date: row.draw_date || "",
        numbers: row.numbers || [],
        prizeTiers: row.prize_tiers as DrawPrizeData | null,
      })) as DrawResultWithPrizes[],
      totalCount: totalCount || allData.length
    };
  }

  static async syncLottery(lotteryId?: string) {
    const { data, error } = await supabase.functions.invoke("sync-lottery-draws", {
      body: lotteryId ? { lottery_id: lotteryId } : {},
    });
    if (error) throw error;
    return data;
  }
}
