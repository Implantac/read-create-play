import { DrawResult, LotteryConfig } from "@/data/lotteries";

/**
 * Analisador Estrutural Específico para Lotofácil.
 * Foca em Frame/Center, Ciclos, Soma e Paridade conforme Regra 14.
 */
export class LotofacilStructureAnalyzer {
  private static readonly FRAME = new Set([1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25]);
  private static readonly CENTER = new Set([7, 8, 9, 12, 13, 14, 17, 18, 19]);

  static analyze(game: number[]) {
    const frameCount = game.filter(n => this.FRAME.has(n)).length;
    const centerCount = game.filter(n => this.CENTER.has(n)).length;
    
    const evens = game.filter(n => n % 2 === 0).length;
    const odds = game.length - evens;
    
    const sum = game.reduce((a, b) => a + b, 0);
    
    // Quadrantes
    const quadrants = [0, 0, 0, 0];
    game.forEach(n => {
      const row = Math.floor((n - 1) / 5);
      const col = (n - 1) % 5;
      if (row < 2 && col < 2) quadrants[0]++;
      else if (row < 2 && col >= 3) quadrants[1]++;
      else if (row >= 3 && col < 2) quadrants[2]++;
      else if (row >= 3 && col >= 3) quadrants[3]++;
    });

    return {
      frame: frameCount,
      center: centerCount,
      ratio: `${frameCount}:${centerCount}`,
      parity: `${odds}:${evens}`,
      sum,
      quadrants
    };
  }

  static getJackpotAlignment(game: number[], lastDraw: number[]): number {
    const analysis = this.analyze(game);
    let alignment = 0;
    
    // Padrão ideal 9:6 ou 10:5 (Frame:Center)
    if (analysis.frame === 9 || analysis.frame === 10) alignment += 30;
    else if (analysis.frame === 8 || analysis.frame === 11) alignment += 15;
    
    // Soma ideal (170-220 para 15 dezenas)
    if (analysis.sum >= 180 && analysis.sum <= 210) alignment += 20;
    else if (analysis.sum >= 160 && analysis.sum <= 230) alignment += 10;
    
    // Paridade ideal (7:8 ou 8:7)
    const [o, e] = analysis.parity.split(':').map(Number);
    if (Math.abs(o - e) <= 1) alignment += 20;

    // Repetição do anterior (Ideal 8-10)
    const repeats = game.filter(n => lastDraw.includes(n)).length;
    if (repeats >= 8 && repeats <= 10) alignment += 30;
    else if (repeats === 7 || repeats === 11) alignment += 15;
    
    return Math.min(100, alignment);
  }

  static validateIntegrity(game: number[]): boolean {
    if (game.length < 15 || game.length > 20) return false;
    const sum = game.reduce((a, b) => a + b, 0);
    // Filtros de integridade absoluta para Lotofácil (15-20 dezenas)
    if (sum < 120 || sum > 350) return false;
    
    const evens = game.filter(n => n % 2 === 0).length;
    const minEvens = Math.floor(game.length * 0.3);
    const maxEvens = Math.ceil(game.length * 0.7);
    if (evens < minEvens || evens > maxEvens) return false;
    
    return true;
  }
}
