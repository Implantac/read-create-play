import { DrawResult, LotteryConfig } from "@/data/lotteries";

export class LotomaniaEngine {
  static validateIntegrity(game: number[]): boolean {
    return game.length === 50;
  }

  static getMirror(game: number[]): number[] {
    const gameSet = new Set(game);
    const mirror: number[] = [];
    for (let i = 0; i < 100; i++) {
      if (!gameSet.has(i)) mirror.push(i);
    }
    return mirror;
  }
}
