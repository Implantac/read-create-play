import { GameOrchestrator } from '@/engine/core/GameOrchestrator';

/**
 * Game Similarity Engine
 * 
 * Responsável por calcular a similaridade entre jogos, identificar duplicatas,
 * medir sobreposição e calcular a diversidade de um conjunto de jogos.
 */
export class GameSimilarityEngine {
  /**
   * Calcula a distância de Hamming entre dois jogos.
   * Representa o número de posições onde as dezenas são diferentes.
   */
  static calculateDistance(gameA: number[], gameB: number[]): number {
    return GameOrchestrator.calculateHammingDistance(gameA, gameB);
  }

  /**
   * Calcula a interseção (número de dezenas em comum) entre dois jogos.
   */
  static calculateOverlap(gameA: number[], gameB: number[]): number {
    const setA = new Set(gameA);
    let overlap = 0;
    for (const num of gameB) {
      if (setA.has(num)) overlap++;
    }
    return overlap;
  }

  /**
   * Identifica jogos quase duplicados em um conjunto.
   * @param games Lista de jogos
   * @param maxOverlap Limite máximo de dezenas em comum para considerar "quase duplicado"
   */
  static findNearDuplicates(games: number[][], maxOverlap: number): Array<[number, number]> {
    const duplicates: Array<[number, number]> = [];
    for (let i = 0; i < games.length; i++) {
      for (let j = i + 1; j < games.length; j++) {
        if (this.calculateOverlap(games[i], games[j]) >= maxOverlap) {
          duplicates.push([i, j]);
        }
      }
    }
    return duplicates;
  }

  /**
   * Mede a diversidade de um conjunto de jogos.
   * Baseado na média das distâncias de Hamming entre todos os pares.
   */
  static calculateDiversityScore(games: number[][]): number {
    if (games.length < 2) return 100;

    let totalDistance = 0;
    let pairs = 0;

    for (let i = 0; i < games.length; i++) {
      for (let j = i + 1; j < games.length; j++) {
        totalDistance += this.calculateDistance(games[i], games[j]);
        pairs++;
      }
    }

    const avgDistance = totalDistance / pairs;
    const maxPossibleDistance = games[0].length; // No melhor caso, todos os números são diferentes

    // Normaliza para 0-100
    return Math.min(100, (avgDistance / maxPossibleDistance) * 100);
  }

  /**
   * Calcula a concentração de dezenas em um conjunto de jogos.
   * Indica se poucas dezenas estão sendo muito utilizadas.
   */
  static calculateConcentrationScore(games: number[][]): number {
    if (games.length === 0) return 0;

    const frequencies: Record<number, number> = {};
    games.forEach(game => {
      game.forEach(num => {
        frequencies[num] = (frequencies[num] || 0) + 1;
      });
    });

    const counts = Object.values(frequencies);
    const avgUsage = (games.length * games[0].length) / Object.keys(frequencies).length;
    
    // Desvio padrão simplificado da frequência de uso
    const variance = counts.reduce((acc, val) => acc + Math.pow(val - avgUsage, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);

    // Quanto maior o desvio padrão, maior a concentração. Normalizamos para 0-100 (inverso).
    // Um stdDev alto significa que algumas dezenas aparecem muito mais que outras.
    const concentration = Math.min(100, (stdDev / games.length) * 100);
    return concentration;
  }
}
