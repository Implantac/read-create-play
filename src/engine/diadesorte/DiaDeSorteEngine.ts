import { DrawResult, LotteryConfig } from "@/data/lotteries";

export class DiaDeSorteEngine {
  static validateIntegrity(game: number[], month?: number): boolean {
    return game.length === 7;
  }
}
