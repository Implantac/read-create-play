import { createContext, useContext, useState, useMemo, useCallback, ReactNode, useEffect } from "react";
import { LOTTERIES, DrawResult } from "@/data/lotteries";
import { computeFrequencyStats, computeSumDistribution, NumberStats } from "@/engine/stats/statistics";
import { FarolStats, CycleStats } from "@/engine/stats/farol-engine";
import { useLotteryDraws, DrawResultWithPrizes } from "@/hooks/useLotteryDraws";
import { useLotteryStats } from "@/hooks/lottery/useLotteryStats";

import { TimeRange } from "@/hooks/lottery/useLotteryStats";

interface LotteryContextType {
  selectedLottery: string;
  setSelectedLottery: (id: string) => void;
  config: (typeof LOTTERIES)[0];
  draws: DrawResult[];
  drawsWithPrizes: DrawResultWithPrizes[];
  loading: boolean;
  syncing: boolean;
  lastSyncAt: Date | null;
  syncError: string | null;
  count: number;
  syncDraws: (isSilent?: boolean) => Promise<{ success: boolean; result?: any; error?: string }>;
  syncAllLotteries: () => void;
  addDraw: (draw: DrawResult) => void;
  stats: NumberStats[];
  sumData: ReturnType<typeof computeSumDistribution>;
  hotNumbers: number[];
  coldNumbers: number[];
  farol: FarolStats[];
  cycle: CycleStats | null;
  viewMode: "simple" | "advanced";
  setViewMode: (mode: "simple" | "advanced") => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  customInterval: { start: Date; end: Date } | undefined;
  setCustomInterval: (interval: { start: Date; end: Date } | undefined) => void;
}

const LotteryContext = createContext<LotteryContextType | null>(null);

export function LotteryProvider({ children }: { children: ReactNode }) {
  const [selectedLottery, setSelectedLottery] = useState("lotofacil");
  const [viewMode, setViewMode] = useState<"simple" | "advanced">("simple");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [customInterval, setCustomInterval] = useState<{ start: Date; end: Date } | undefined>(undefined);
  const config = useMemo(() => LOTTERIES.find(l => l.id === selectedLottery) || LOTTERIES[0], [selectedLottery]);
  const { draws, drawsWithPrizes, loading, syncing, lastSyncAt, syncError, count, syncDraws, syncAllLotteries, addDraw } = useLotteryDraws(selectedLottery);
  
  // Implement periodic sync (every 5 minutes)
  useEffect(() => {
    if (loading) return;

    // Trigger immediate sync for ALL lotteries on mount to catch up
    if (draws.length === 0) {
      console.log(`[AutoSync] Initial global sync`);
      syncAllLotteries(); // useLotteryDraws syncAllLotteries will now trigger full sync internally if called via this context if needed, but we rely on syncDraws(true) below
    } else {
      console.log(`[AutoSync] Initial sync for ${selectedLottery}`);
      syncDraws(true);
    }

    const intervalId = setInterval(() => {
      console.log(`[AutoSync] Triggering background sync for ${selectedLottery}`);
      syncDraws(true);
    }, 60 * 1000); // 60 seconds (1 minute) for professional bettors precision

    return () => clearInterval(intervalId);
  }, [selectedLottery, syncDraws, draws.length, loading]);

  const { stats, sumData, hotNumbers, coldNumbers, farol, cycle } = useLotteryStats(draws, config, timeRange, customInterval);

  return (
    <LotteryContext.Provider value={{
      selectedLottery, 
      setSelectedLottery: useCallback((id: string) => setSelectedLottery(id), []),
      config, 
      draws, 
      drawsWithPrizes, 
      loading, 
      syncing, 
      lastSyncAt,
      syncError,
      count, 
      syncDraws, 

      syncAllLotteries, 
      addDraw, 
      stats, 
      sumData,
      hotNumbers,
      coldNumbers,
      farol,
      cycle,
      viewMode,
      setViewMode,
      timeRange,
      setTimeRange,
      customInterval,
      setCustomInterval
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

export function useLotteryContextSafe() {
  return useContext(LotteryContext);
}
