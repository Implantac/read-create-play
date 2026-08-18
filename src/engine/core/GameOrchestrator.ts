import { DrawResult, LotteryConfig, LOTTERIES } from "@/data/lotteries";
import { NumberStats } from "@/engine/stats/statistics";
import { generateGames } from "@/ai/generators/universalGameGenerator";
import { scoreGame } from "@/ai/engines/rankingEngine";
import { evaluateBetQuality, BetQualityReport } from "@/engine/stats/bet-quality";
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
    return orchestrated
      .filter(g => g.titanScore >= minScore)
      .sort((a, b) => b.titanScore - a.titanScore)
      .slice(0, config.count);
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

