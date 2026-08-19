import { GameSimilarityEngine } from './GameSimilarityEngine';

export interface PortfolioInput {
  lotteryId: string;
  candidateGames: number[][];
  budget: number;
  gameCost: number;
  targetGamesCount: number;
  riskProfile: 'CONSERVADOR' | 'EQUILIBRADO' | 'AGRESSIVO';
  minDiversity?: number;
}

export interface PortfolioOutput {
  selectedGames: number[][];
  totalCost: number;
  diversityScore: number;
  similarityScore: number;
  coverageScore: number;
  concentrationScore: number;
  riskScore: number;
}

/**
 * Portfolio Engine
 * 
 * Otimiza a seleção de um conjunto de jogos dentro de um orçamento,
 * priorizando qualidade, diversidade e cobertura.
 */
export class PortfolioEngine {
  static optimize(input: PortfolioInput): PortfolioOutput {
    const { 
      candidateGames, 
      targetGamesCount, 
      gameCost,
      riskProfile 
    } = input;

    // Se tivermos menos candidatos que o alvo, usamos todos
    if (candidateGames.length <= targetGamesCount) {
      return this.formatOutput(candidateGames, gameCost, riskProfile);
    }

    // Algoritmo de seleção ganancioso (Greedy) priorizando diversidade
    const selectedGames: number[][] = [candidateGames[0]];
    const remainingCandidates = [...candidateGames.slice(1)];

    while (selectedGames.length < targetGamesCount && remainingCandidates.length > 0) {
      let bestCandidateIndex = -1;
      let maxMinDistance = -1;

      // Busca o candidato que maximiza a distância mínima para o conjunto já selecionado
      for (let i = 0; i < remainingCandidates.length; i++) {
        let minDistance = Infinity;
        for (const selected of selectedGames) {
          const dist = GameSimilarityEngine.calculateDistance(remainingCandidates[i], selected);
          if (dist < minDistance) minDistance = dist;
        }

        if (minDistance > maxMinDistance) {
          maxMinDistance = minDistance;
          bestCandidateIndex = i;
        }
      }

      if (bestCandidateIndex !== -1) {
        selectedGames.push(remainingCandidates.splice(bestCandidateIndex, 1)[0]);
      } else {
        break;
      }
    }

    return this.formatOutput(selectedGames, gameCost, riskProfile);
  }

  private static formatOutput(
    selectedGames: number[][], 
    gameCost: number, 
    riskProfile: string
  ): PortfolioOutput {
    const diversity = GameSimilarityEngine.calculateDiversityScore(selectedGames);
    const concentration = GameSimilarityEngine.calculateConcentrationScore(selectedGames);
    
    // Métricas simplificadas para o MVP
    const similarity = 100 - diversity;
    const coverage = diversity * 0.8 + (100 - concentration) * 0.2;
    
    let riskScore = 50;
    if (riskProfile === 'CONSERVADOR') riskScore = 30;
    if (riskProfile === 'AGRESSIVO') riskScore = 80;

    return {
      selectedGames,
      totalCost: selectedGames.length * gameCost,
      diversityScore: diversity,
      similarityScore: similarity,
      coverageScore: coverage,
      concentrationScore: concentration,
      riskScore
    };
  }
}
