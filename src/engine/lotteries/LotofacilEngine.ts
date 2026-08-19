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
    if (frameCount === 10 || frameCount === 9) score += 30; // Reforçado para alinhar com StructureAnalyzer
    else if (frameCount === 11 || frameCount === 8) score += 15;
    
    // 2. Repetição do Anterior (Ideal 8-10)
    const repeats = game.filter(n => lastDraw.includes(n)).length;
    if (repeats >= 8 && repeats <= 10) score += 30; // Reforçado
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
   * Implementação rigorosa da Fase 1 do Plano Mestre.
   */
  static validateIntegrity(game: number[]): boolean {
    // 1. Limite de dezenas permitido pela Caixa (15 a 20)
    if (game.length < 15 || game.length > 20) return false;
    
    // 2. Filtro de Soma (120-350 para 15-20 dezenas)
    const sum = game.reduce((a, b) => a + b, 0);
    if (sum < 120 || sum > 350) return false;
    
    // 3. Filtro de Paridade (mínimo 30% e máximo 70% de pares)
    const evens = game.filter(n => n % 2 === 0).length;
    const minEvens = Math.floor(game.length * 0.3);
    const maxEvens = Math.ceil(game.length * 0.7);
    if (evens < minEvens || evens > maxEvens) return false;
    
    // 4. Verificação de Duplicatas (Set implícita na geração, mas checagem de segurança)
    if (new Set(game).size !== game.length) return false;

    return true;
  }
}
