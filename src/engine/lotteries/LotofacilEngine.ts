import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "@/engine/stats/statistics";

/**
 * Especialista Quantitativo para Lotofácil.
 * Implementa lógica de Frame/Center, Ciclos e Alinhamento de Soma.
 */
export class LotofacilEngine {
  private static readonly FRAME_NUMBERS = new Set([
    1, 2, 3, 4, 5, 
    6, 10, 
    11, 15, 
    16, 20, 
    21, 22, 23, 24, 25
  ]);
  
  private static readonly CENTER_NUMBERS = new Set([
    7, 8, 9, 
    12, 13, 14, 
    17, 18, 19
  ]);

  /**
   * Calcula o "Jackpot Alignment Score" para um jogo da Lotofácil.
   * Pontuação de 0-100 baseada em padrões profissionais.
   */
  static calculateJackpotScore(game: number[], stats: NumberStats[], lastDraw: number[]): number {
    let score = 0;
    const gameSet = new Set(game);
    
    // 1. Frame vs Center (Ideal 10:5 ou 9:6)
    const frameCount = game.filter(n => this.FRAME_NUMBERS.has(n)).length;
    if (frameCount === 10 || frameCount === 9) score += 25;
    else if (frameCount === 11 || frameCount === 8) score += 15;
    
    // 2. Repetição do Anterior (Ideal 8-10)
    const repeats = game.filter(n => lastDraw.includes(n)).length;
    if (repeats >= 8 && repeats <= 10) score += 25;
    else if (repeats === 7 || repeats === 11) score += 15;
    
    // 3. Paridade (Ideal 7:8 ou 8:7)
    const evens = game.filter(n => n % 2 === 0).length;
    if (evens === 7 || evens === 8) score += 20;
    
    // 4. Soma (Ideal 160-220)
    const sum = game.reduce((a, b) => a + b, 0);
    if (sum >= 160 && sum <= 220) score += 20;
    else if (sum >= 150 && sum <= 230) score += 10;
    
    // 5. Ciclo (Bônus se incluir números com cicloScore alto)
    const highCycleNumbers = stats.filter(s => s.cycleScore > 1.2).map(s => s.number);
    const cycleHits = game.filter(n => highCycleNumbers.includes(n)).length;
    if (cycleHits > 0) score += 10;

    return Math.min(100, score);
  }

  /**
   * Verifica se o jogo atende aos critérios mínimos de "Integridade Matemática".
   */
  static validateIntegrity(game: number[]): boolean {
    if (game.length !== 15) return false;
    
    const sum = game.reduce((a, b) => a + b, 0);
    if (sum < 120 || sum > 270) return false; // Filtro extremo de soma
    
    const evens = game.filter(n => n % 2 === 0).length;
    if (evens < 4 || evens > 11) return false; // Filtro extremo de paridade
    
    return true;
  }
}
