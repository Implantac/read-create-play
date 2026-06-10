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

/**
 * Lottery API Service
 * Centralizes all communication with Supabase and external lottery APIs.
 */
export const LotteryApi = {
  /**
   * Fetches historical draws for a given lottery.
   */
  async fetchDraws(lotteryId: string, limitCount = 500) {
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let totalCount = 0;

    const { data, error, count } = await supabase
      .from("lottery_draws")
      .select("concurso, draw_date, numbers, prize_tiers", { count: "exact" })
      .eq("lottery_id", lotteryId)
      .order("concurso", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (count !== null) totalCount = count;
    if (data) allData = data;

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
        prize_tiers: row.prize_tiers as DrawPrizeData | null,
      })) as DrawResultWithPrizes[],
      totalCount: totalCount || allData.length
    };
  },

  /**
   * Triggers a sync of lottery draws via Edge Function.
   */
  async syncLottery(lotteryId?: string) {
    const { data, error } = await supabase.functions.invoke("sync-lottery-draws", {
      body: lotteryId ? { lottery_id: lotteryId } : {},
    });
    if (error) throw error;
    return data;
  },

  /**
   * Prize tiers with estimated values for various lotteries.
   */
  getPrizeTiers(lotteryId: string): { hits: number; label: string; estimatedPrize?: string }[] {
    switch (lotteryId) {
      case "megasena":
        return [
          { hits: 6, label: "Sena (6 acertos)", estimatedPrize: "Variável" },
          { hits: 5, label: "Quina (5 acertos)", estimatedPrize: "Variável" },
          { hits: 4, label: "Quadra (4 acertos)", estimatedPrize: "Variável" },
        ];
      case "lotofacil":
        return [
          { hits: 15, label: "15 acertos", estimatedPrize: "Variável" },
          { hits: 14, label: "14 acertos", estimatedPrize: "Variável" },
          { hits: 13, label: "13 acertos", estimatedPrize: "R$ 35,00" },
          { hits: 12, label: "12 acertos", estimatedPrize: "R$ 14,00" },
          { hits: 11, label: "11 acertos", estimatedPrize: "R$ 7,00" },
        ];
      default:
        return [
          { hits: 6, label: "Faixa 1", estimatedPrize: "Variável" },
          { hits: 5, label: "Faixa 2", estimatedPrize: "Variável" },
          { hits: 4, label: "Faixa 3", estimatedPrize: "Variável" },
        ];
    }
  }
};
