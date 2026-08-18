import { DrawResult, LotteryConfig } from "@/data/lotteries";

export class LotofacilStructureAnalyzer {
  private static readonly FRAME = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];
  private static readonly CENTER = [7, 8, 9, 12, 13, 14, 17, 18, 19];

  static analyze(game: number[]) {
    const frameCount = game.filter(n => this.FRAME.includes(n)).length;
    const centerCount = game.filter(n => this.CENTER.includes(n)).length;
    
    const evens = game.filter(n => n % 2 === 0).length;
    const odds = game.length - evens;
    
    const sum = game.reduce((a, b) => a + b, 0);
    
    return {
      frame: frameCount,
      center: centerCount,
      ratio: `${frameCount}:${centerCount}`,
      parity: `${odds}:${evens}`,
      sum
    };
  }

  static getJackpotAlignment(game: number[], lastDraw: number[]): number {
    const analysis = this.analyze(game);
    let alignment = 0;
    
    // Padrão ideal 9:6 ou 10:5
    if (analysis.frame === 9 || analysis.frame === 10) alignment += 30;
    
    // Soma ideal
    if (analysis.sum >= 180 && analysis.sum <= 210) alignment += 20;
    
    // Repetição
    const repeats = game.filter(n => lastDraw.includes(n)).length;
    if (repeats >= 8 && repeats <= 10) alignment += 30;
    
    return alignment;
  }
}
