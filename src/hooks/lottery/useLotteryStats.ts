import { useState, useMemo, useCallback } from "react";
import { NumberStats, computeFrequencyStats, computeSumDistribution } from "@/engine/stats/statistics";
import { DrawResult, LotteryConfig } from "@/data/lotteries";

export function useLotteryStats(draws: DrawResult[], config: LotteryConfig) {
  const stats = useMemo(() => 
    computeFrequencyStats(draws, config.numbers), 
    [draws, config.numbers]
  );
  
  const sumData = useMemo(() => 
    computeSumDistribution(draws), 
    [draws]
  );

  const hotNumbers = useMemo(() => 
    stats.filter(s => s.status === "hot").map(s => s.number), 
    [stats]
  );

  const coldNumbers = useMemo(() => 
    stats.filter(s => s.status === "cold").map(s => s.number), 
    [stats]
  );

  return {
    stats,
    sumData,
    hotNumbers,
    coldNumbers
  };
}
