import { DrawResult, LotteryConfig } from "@/data/lotteries";

export class QuinaEngine {
  static validateIntegrity(game: number[]): boolean {
    if (game.length !== 5) return false;
    const sum = game.reduce((a, b) => a + b, 0);
    return sum >= 40 && sum <= 380;
  }
}
