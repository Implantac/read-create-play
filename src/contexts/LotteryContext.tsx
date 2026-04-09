import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";
import { LOTTERIES, DrawResult } from "@/data/lotteries";
import { computeFrequencyStats, computeSumDistribution, NumberStats } from "@/engine/statistics";
import { useLotteryDraws, DrawResultWithPrizes } from "@/hooks/useLotteryDraws";

interface LotteryContextType {
  selectedLottery: string;
  setSelectedLottery: (id: string) => void;
  config: (typeof LOTTERIES)[0];
  draws: DrawResult[];
  drawsWithPrizes: DrawResultWithPrizes[];
  loading: boolean;
  syncing: boolean;
  count: number;
  loadedCount: number;
  syncDraws: () => void;
  syncAllLotteries: () => void;
  addDraw: (draw: DrawResultWithPrizes) => void;
  refetchDraws: () => void;
  stats: NumberStats[];
  sumData: ReturnType<typeof computeSumDistribution>;
}

const LotteryContext = createContext<LotteryContextType | null>(null);

export function LotteryProvider({ children }: { children: ReactNode }) {
  const [selectedLottery, setSelectedLottery] = useState("megasena");
  const config = useMemo(() => LOTTERIES.find(l => l.id === selectedLottery)!, [selectedLottery]);
  const { draws, drawsWithPrizes, loading, syncing, count, loadedCount, syncDraws, syncAllLotteries, addDraw, refetch } = useLotteryDraws(selectedLottery);
  const stats = useMemo(() => computeFrequencyStats(draws, config.numbers), [draws, config.numbers]);
  const sumData = useMemo(() => computeSumDistribution(draws), [draws]);
  const handleSetLottery = useCallback((id: string) => setSelectedLottery(id), []);

  const value = useMemo(() => ({
    selectedLottery, setSelectedLottery: handleSetLottery,
    config, draws, drawsWithPrizes, loading, syncing, count, loadedCount, syncDraws, syncAllLotteries, addDraw, refetchDraws: refetch, stats, sumData,
  }), [selectedLottery, handleSetLottery, config, draws, drawsWithPrizes, loading, syncing, count, loadedCount, syncDraws, syncAllLotteries, addDraw, refetch, stats, sumData]);

  return (
    <LotteryContext.Provider value={value}>
      {children}
    </LotteryContext.Provider>
  );
}

export function useLotteryContext() {
  const ctx = useContext(LotteryContext);
  if (!ctx) throw new Error("useLotteryContext must be within LotteryProvider");
  return ctx;
}
