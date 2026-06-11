import { NumberStats } from "@/engine/stats/statistics";
import { DrawResult } from "@/data/lotteries";

export function runHistoricalSimulation(
  stats: NumberStats[],
  draws: DrawResult[],
  strategy: string,
  gameCount: number = 100
) {
  // Mock simulation for now
  return {
    performance: 82.5,
    roi: 1.45,
    hits: [
      { level: "Quadra", count: 12 },
      { level: "Quina", count: 2 },
      { level: "Sena", count: 0 }
    ],
    efficiency: "Alta"
  };
}
