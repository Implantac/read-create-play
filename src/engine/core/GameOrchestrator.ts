import { DrawResult, LotteryConfig, LOTTERIES } from "@/data/lotteries";
import { NumberStats } from "@/engine/stats/statistics";
import { generateGames } from "@/ai/generators/universalGameGenerator";
import { scoreGame } from "@/ai/engines/rankingEngine";
import { evaluateBetQuality, BetQualityReport } from "@/engine/stats/bet-quality";
import { GameSimilarityEngine } from "@/engine/portfolio/GameSimilarityEngine";
import type { RiskProfile, IntentFilters, ScoredGame } from "@/ai/core/aiTypes";
import { getLotteryRules } from "@/ai/knowledge/lotteriesKnowledge";

export interface OrchestratedGame extends ScoredGame {
  quality: BetQualityReport;
  titanScore: number;
}

export interface OrchestratorConfig {
  lotteryId: string;
  count: number;
  riskProfile: RiskProfile;
  filters: IntentFilters;
  stats: NumberStats[];
  draws: DrawResult[];
  minScore?: number;
}

/**
 * GameOrchestrator — Centraliza a inteligência de geração de apostas.
 * Unifica o UniversalGameGenerator com o RankingEngine e BetQuality.
 * Garante "Verdade Matemática" em todos os pontos de entrada do sistema.
 */
export class GameOrchestrator {
  /**
   * Calcula a Distância de Hamming entre dois jogos (quantidade de números diferentes).
   * Útil para garantir diversidade na carteira.
   */
  static calculateHammingDistance(gameA: number[], gameB: number[]): number {
    return GameSimilarityEngine.calculateHammingDistance(gameA, gameB);
  }

  /**
   * Filtra uma lista de jogos para garantir diversidade mínima (Portfolio Diversification).
   * Refinado para garantir que a sobreposição de núcleos não exceda 55%.
   */
  static diversifyPortfolio(games: OrchestratedGame[], minDistance: number): OrchestratedGame[] {
    if (games.length <= 1) return games;
    
    const diversified: OrchestratedGame[] = [games[0]];
    const maxOverlap = 0.55; // Limite de 55% de sobreposição (Fase 3)
    
    for (let i = 1; i < games.length; i++) {
      const current = games[i];
      const isRedundant = diversified.some(d => {
        const distance = this.calculateHammingDistance(d.numbers, current.numbers);
        const overlap = (d.numbers.length - distance) / d.numbers.length;
        
        // Se a distância for muito pequena OU a sobreposição muito alta, descarta
        return distance < minDistance || overlap > maxOverlap;
      });
      
      if (!isRedundant) {
        diversified.push(current);
      }
    }
    
    return diversified;
  }

  /**
   * Converte LotteryRules (AI) para LotteryConfig (UI/Data) para compatibilidade de tipos.
   */
  private static getLotteryConfig(lotteryId: string): LotteryConfig {
    const config = LOTTERIES.find(l => l.id === lotteryId);
    if (!config) {
      throw new Error(`Lottery config not found for ${lotteryId}`);
    }
    return config;
  }

  /**
   * Gera jogos otimizados combinando sinais estatísticos e filtros estruturais.
   */
  static generate(config: OrchestratorConfig): OrchestratedGame[] {
    const lotteryConfig = this.getLotteryConfig(config.lotteryId);
    
    // 1. Geração base via Universal Generator (Monte Carlo + Sinais Posteriores)
    const baseGames = generateGames({
      lotteryId: config.lotteryId,
      count: config.count * 2, // Gera o dobro para filtrar os melhores
      riskProfile: config.riskProfile,
      filters: config.filters,
      stats: config.stats,
      draws: config.draws
    });

    // 2. Enriquecimento com Ranking e Qualidade
    const orchestrated: OrchestratedGame[] = baseGames.map(game => {
      // Re-score para garantir consistência com o RankingEngine
      const scored = scoreGame(
        game.numbers,
        config.lotteryId,
        config.stats,
        config.draws,
        config.riskProfile
      );

      // Avaliação de Qualidade Profissional
      const quality = evaluateBetQuality(
        game.numbers,
        config.stats,
        lotteryConfig,
        config.draws
      );

      return {
        ...scored,
        quality,
        titanScore: scored.totalScore
      };
    });

    // 3. Filtragem por score mínimo e ordenação
    const minScore = config.minScore ?? 40;
    const sorted = orchestrated
      .filter(g => g.titanScore >= minScore)
      .sort((a, b) => b.titanScore - a.titanScore);

    // 4. Diversificação de Portfolio (evita redundância)
    // Para lotofacil (15), minDistance 4-5 é saudável.
    const minDistance = Math.max(3, Math.floor(lotteryConfig.pick * 0.25));
    return this.diversifyPortfolio(sorted, minDistance).slice(0, config.count);
  }

  /**
   * Valida um jogo manual contra o motor profissional.
   */
  static validate(numbers: number[], lotteryId: string, stats: NumberStats[], draws: DrawResult[]): OrchestratedGame {
    const scored = scoreGame(numbers, lotteryId, stats, draws, "balanced");
    const lotteryConfig = this.getLotteryConfig(lotteryId);
    const quality = evaluateBetQuality(numbers, stats, lotteryConfig, draws);

    return {
      ...scored,
      quality,
      titanScore: scored.totalScore
    };
  }
}

