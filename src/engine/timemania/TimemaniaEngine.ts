import { DrawResult, LotteryConfig } from "@/data/lotteries";

export class TimemaniaEngine {
  static validateIntegrity(game: number[], teamId?: number): boolean {
    return game.length === 10;
  }
}
