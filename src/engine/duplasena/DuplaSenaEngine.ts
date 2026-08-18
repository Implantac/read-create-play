import { DrawResult, LotteryConfig } from "@/data/lotteries";

export class DuplaSenaEngine {
  static validateIntegrity(game: number[]): boolean {
    return game.length === 6;
  }
}
