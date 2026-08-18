import { DrawResult, LotteryConfig } from "@/data/lotteries";

export class MegaSenaEngine {
  static validateIntegrity(game: number[]): boolean {
    if (game.length !== 6) return false;
    const sum = game.reduce((a, b) => a + b, 0);
    // Mega-Sena games rarely have sums below 60 or above 300
    return sum >= 60 && sum <= 300;
  }

  static analyze(game: number[]) {
    const evens = game.filter(n => n % 2 === 0).length;
    const odds = game.length - evens;
    const sum = game.reduce((a, b) => a + b, 0);
    
    return {
      parity: `${odds}:${evens}`,
      sum
    };
  }
}
