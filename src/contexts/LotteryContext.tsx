import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";
import { LOTTERIES, DrawResult } from "@/data/lotteries";
import { computeFrequencyStats, computeSumDistribution, NumberStats } from "@/engine/stats/statistics";
import { useLotteryDraws, DrawResultWithPrizes } from "@/hooks/useLotteryDraws";
import { useLotteryStats } from "@/hooks/lottery/useLotteryStats";

interface LotteryContextType {
  selectedLottery: string;
  setSelectedLottery: (id: string) => void;
  config: (typeof LOTTERIES)[0];
  draws: DrawResult[];
  drawsWithPrizes: DrawResultWithPrizes[];
  loading: boolean;
  syncing: boolean;
  count: number;
  syncDraws: () => void;
  syncAllLotteries: () => void;
  addDraw: (draw: DrawResult) => void;
  stats: NumberStats[];
  sumData: ReturnType<typeof computeSumDistribution>;
  hotNumbers: number[];
  coldNumbers: number[];
}

const LotteryContext = createContext<LotteryContextType | null>(null);

export function LotteryProvider({ children }: { children: ReactNode }) {
  const [selectedLottery, setSelectedLottery] = useState("megasena");
  const config = LOTTERIES.find(l => l.id === selectedLottery)!;
  const { draws, drawsWithPrizes, loading, syncing, count, syncDraws, syncAllLotteries, addDraw } = useLotteryDraws(selectedLottery);
  
  const { stats, sumData, hotNumbers, coldNumbers } = useLotteryStats(draws, config);

  return (
    <LotteryContext.Provider value={{
      selectedLottery, 
      setSelectedLottery: useCallback((id: string) => setSelectedLottery(id), []),
      config, 
      draws, 
      drawsWithPrizes, 
      loading, 
      syncing, 
      count, 
      syncDraws, 
      syncAllLotteries, 
      addDraw, 
      stats, 
      sumData,
      hotNumbers,
      coldNumbers
    }}>
      {children}
    </LotteryContext.Provider>
  );
}

export function useLotteryContext() {
  const ctx = useContext(LotteryContext);
  if (!ctx) throw new Error("useLotteryContext must be within LotteryProvider");
  return ctx;
}
