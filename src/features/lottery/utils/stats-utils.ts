import { NumberStats, computeFrequencyStats, computeSumDistribution } from "@/engine/stats/statistics";
import { computeFarolStats } from "@/engine/stats/farol-engine";
import { DrawResult, LotteryConfig } from "@/data/lotteries";

export function getLotteryStats(draws: DrawResult[], config: LotteryConfig) {
  const stats = computeFrequencyStats(draws, config.numbers);
  const sumData = computeSumDistribution(draws);

  return {
    stats,
    sumData,
    hotNumbers: stats.filter(s => s.status === "hot").map(s => s.number),
    coldNumbers: stats.filter(s => s.status === "cold").map(s => s.number),
    ...computeFarolStats(draws, config, stats)
  };
}
