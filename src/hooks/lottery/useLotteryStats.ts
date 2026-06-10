import { useMemo } from "react";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { getLotteryStats } from "@/features/lottery/utils/stats-utils";

export function useLotteryStats(draws: DrawResult[], config: LotteryConfig) {
  return useMemo(() => 
    getLotteryStats(draws, config),
    [draws, config]
  );
}

