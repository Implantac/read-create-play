import { DrawResult, LotteryConfig } from "@/data/lotteries";

export class SuperSeteEngine {
  static validateIntegrity(game: number[]): boolean {
    return game.length === 7;
  }

  static analyze(game: number[]) {
    const sum = game.reduce((a, b) => a + b, 0);
    return { sum };
  }
  
  static getColumnFrequencies(draws: DrawResult[]) {
    const freqs: Record<number, number[]> = {};
    for (let i = 0; i < 7; i++) {
      freqs[i] = new Array(10).fill(0);
    }
    
    draws.forEach(draw => {
      draw.numbers.forEach((val, col) => {
        if (col < 7 && val < 10) {
          freqs[col][val]++;
        }
      });
    });
    
    return freqs;
  }
}
