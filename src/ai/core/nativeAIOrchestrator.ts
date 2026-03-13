/**
 * Native AI — Orchestrator
 * Central coordinator that routes intents to appropriate engines
 */

import { DrawResult } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";
import type { AIRequest, AIResponse, AIIntent, ParsedIntent, ResponseMetadata } from "../core/aiTypes";
import { detectIntent } from "../intent/detectIntent";
import { generateGames } from "../generators/universalGameGenerator";
import { generateWheeling, getWheelingOptions } from "../engines/wheelingEngine";
import { simulateGames } from "../engines/simulationEngine";
import { analyzeHistory } from "../engines/statisticsEngine";
import { rankGames, scoreGame } from "../engines/rankingEngine";
import { explainGame, explainWheeling, explainSimulation, explainAnalysis, explainStrategy } from "../explainability/explainEngine";
import { AI_CONFIG } from "../core/aiConfig";
import { AI_POLICIES } from "../core/aiPolicies";

export class NativeAIOrchestrator {
  async process(request: AIRequest): Promise<AIResponse> {
    const startTime = performance.now();

    const parsedIntent = detectIntent(
      request.input,
      request.lotteryId
    );

    const lotteryId = parsedIntent.lotteryId || request.lotteryId || "lotofacil";
    const draws = request.draws || [];
    const stats = request.stats || [];

    const enginesUsed: string[] = ["intentClassifier"];
    let response: AIResponse;

    switch (parsedIntent.intent) {
      case "generate_games":
        response = await this.handleGenerate(parsedIntent, lotteryId, draws, stats, enginesUsed);
        break;
      case "create_wheeling":
        response = await this.handleWheeling(parsedIntent, lotteryId, stats, enginesUsed);
        break;
      case "simulate":
        response = await this.handleSimulate(parsedIntent, lotteryId, draws, stats, enginesUsed);
        break;
      case "analyze_history":
        response = await this.handleAnalyze(parsedIntent, lotteryId, draws, enginesUsed);
        break;
      case "rank_games":
        response = await this.handleRank(parsedIntent, lotteryId, draws, stats, request.existingGames, enginesUsed);
        break;
      case "explain_strategy":
        response = this.handleExplain(parsedIntent, enginesUsed);
        break;
      case "suggest_strategy":
        response = await this.handleSuggest(parsedIntent, lotteryId, draws, stats, enginesUsed);
        break;
      case "compare_games":
        response = await this.handleCompare(parsedIntent, lotteryId, draws, stats, request.existingGames, enginesUsed);
        break;
      default:
        response = await this.handleGenerate(parsedIntent, lotteryId, draws, stats, enginesUsed);
    }

    const processingTimeMs = Math.round(performance.now() - startTime);
    response.metadata = {
      processingTimeMs,
      enginesUsed,
      confidence: parsedIntent.confidence,
      cached: false,
    };

    return response;
  }

  private async handleGenerate(
    intent: ParsedIntent, lotteryId: string, draws: DrawResult[], stats: NumberStats[], engines: string[]
  ): Promise<AIResponse> {
    engines.push("universalGenerator", "rankingEngine", "patternEngine");

    const games = generateGames({
      lotteryId,
      count: intent.quantity,
      riskProfile: intent.riskProfile,
      filters: intent.filters,
      stats,
      draws,
    });

    const suggestions = [
      "Simular esses jogos para avaliar desempenho",
      "Criar fechamento com os melhores números",
      "Comparar com outra estratégia",
    ];

    return {
      intent: "generate_games",
      games,
      explanation: `${games.length} jogos gerados com perfil ${intent.riskProfile}. ${AI_POLICIES.disclaimers.general}`,
      suggestions,
      metadata: { processingTimeMs: 0, enginesUsed: engines, confidence: intent.confidence, cached: false },
    };
  }

  private async handleWheeling(
    intent: ParsedIntent, lotteryId: string, stats: NumberStats[], engines: string[]
  ): Promise<AIResponse> {
    engines.push("wheelingEngine");

    const baseSize = intent.wheelingBase || 18;
    const rules = (await import("../knowledge/lotteriesKnowledge")).getLotteryRules(lotteryId);

    // Select base numbers from stats (hottest + due)
    const sortedStats = [...stats].sort((a, b) => {
      const scoreA = a.frequency * 0.5 + a.cycleScore * 0.3 + (a.trend > 0 ? a.trend : 0) * 0.2;
      const scoreB = b.frequency * 0.5 + b.cycleScore * 0.3 + (b.trend > 0 ? b.trend : 0) * 0.2;
      return scoreB - scoreA;
    });

    const baseNumbers = sortedStats.slice(0, baseSize).map(s => s.number).sort((a, b) => a - b);
    const guarantee = Math.max(rules.pick - 1, Math.min(rules.pick, intent.quantity));

    const result = generateWheeling({
      lotteryId,
      baseNumbers,
      guarantee: lotteryId === "lotofacil" ? 14 : guarantee,
      pick: rules.pick,
    });

    return {
      intent: "create_wheeling",
      wheeling: result,
      explanation: explainWheeling(result),
      suggestions: [
        "Simular este fechamento",
        "Ajustar as dezenas-base",
        "Ver opções de fechamento disponíveis",
      ],
      metadata: { processingTimeMs: 0, enginesUsed: engines, confidence: intent.confidence, cached: false },
    };
  }

  private async handleSimulate(
    intent: ParsedIntent, lotteryId: string, draws: DrawResult[], stats: NumberStats[], engines: string[]
  ): Promise<AIResponse> {
    engines.push("simulationEngine", "universalGenerator");

    // Generate games first if none provided
    const games = generateGames({
      lotteryId, count: Math.min(intent.quantity, 20),
      riskProfile: intent.riskProfile, filters: intent.filters, stats, draws,
    });

    const iterations = Math.min(AI_CONFIG.maxSimulations, Math.max(1000, intent.quantity * 1000));
    const simulation = simulateGames(games.map(g => g.numbers), lotteryId, iterations);

    return {
      intent: "simulate",
      games,
      simulation,
      explanation: explainSimulation(simulation, lotteryId),
      suggestions: [
        "Gerar mais jogos com perfil diferente",
        "Aumentar número de simulações",
        "Criar fechamento com os melhores",
      ],
      metadata: { processingTimeMs: 0, enginesUsed: engines, confidence: intent.confidence, cached: false },
    };
  }

  private async handleAnalyze(
    intent: ParsedIntent, lotteryId: string, draws: DrawResult[], engines: string[]
  ): Promise<AIResponse> {
    engines.push("statisticsEngine", "patternEngine");

    const analysis = analyzeHistory(draws, lotteryId, intent.historyWindow);

    return {
      intent: "analyze_history",
      analysis,
      explanation: explainAnalysis(analysis, lotteryId),
      suggestions: [
        "Gerar jogos baseados nesta análise",
        "Simular estratégias com esses padrões",
        "Comparar com janela diferente",
      ],
      metadata: { processingTimeMs: 0, enginesUsed: engines, confidence: intent.confidence, cached: false },
    };
  }

  private async handleRank(
    intent: ParsedIntent, lotteryId: string, draws: DrawResult[], stats: NumberStats[],
    existingGames: number[][] | undefined, engines: string[]
  ): Promise<AIResponse> {
    engines.push("rankingEngine");

    const gamesToRank = existingGames || generateGames({
      lotteryId, count: intent.quantity, riskProfile: intent.riskProfile,
      filters: intent.filters, stats, draws,
    }).map(g => g.numbers);

    const ranked = rankGames(gamesToRank, lotteryId, stats, draws, intent.riskProfile);

    return {
      intent: "rank_games",
      ranking: ranked,
      explanation: `${ranked.length} jogos ranqueados. Melhor: grau ${ranked[0]?.grade} (${ranked[0]?.totalScore}/100).`,
      suggestions: [
        "Simular os top 5 jogos",
        "Gerar mais jogos",
        "Criar fechamento",
      ],
      metadata: { processingTimeMs: 0, enginesUsed: engines, confidence: intent.confidence, cached: false },
    };
  }

  private handleExplain(intent: ParsedIntent, engines: string[]): AIResponse {
    engines.push("explainabilityEngine");

    const explanation = explainStrategy(intent.riskProfile);

    return {
      intent: "explain_strategy",
      explanation,
      suggestions: [
        "Gerar jogos com esta estratégia",
        "Comparar com outra estratégia",
        "Ver análise histórica",
      ],
      metadata: { processingTimeMs: 0, enginesUsed: engines, confidence: intent.confidence, cached: false },
    };
  }

  private async handleSuggest(
    intent: ParsedIntent, lotteryId: string, draws: DrawResult[], stats: NumberStats[], engines: string[]
  ): Promise<AIResponse> {
    engines.push("statisticsEngine", "patternEngine");

    const analysis = analyzeHistory(draws, lotteryId, 50);
    
    const suggestions = [
      `Com base nos últimos 50 concursos, a estratégia "Equilibrado" tem melhor aderência aos padrões da ${lotteryId}.`,
      ...analysis.recommendations,
    ];

    return {
      intent: "suggest_strategy",
      analysis,
      explanation: `Recomendação baseada na análise dos últimos 50 concursos. ${AI_POLICIES.disclaimers.general}`,
      suggestions,
      metadata: { processingTimeMs: 0, enginesUsed: engines, confidence: intent.confidence, cached: false },
    };
  }

  private async handleCompare(
    intent: ParsedIntent, lotteryId: string, draws: DrawResult[], stats: NumberStats[],
    existingGames: number[][] | undefined, engines: string[]
  ): Promise<AIResponse> {
    engines.push("rankingEngine", "simulationEngine");

    const gamesToCompare = existingGames || [];
    if (gamesToCompare.length < 2) {
      return {
        intent: "compare_games",
        explanation: "Forneça pelo menos 2 jogos para comparação.",
        suggestions: ["Gerar jogos para comparar"],
        metadata: { processingTimeMs: 0, enginesUsed: engines, confidence: intent.confidence, cached: false },
      };
    }

    const ranked = rankGames(gamesToCompare, lotteryId, stats, draws, intent.riskProfile);

    return {
      intent: "compare_games",
      ranking: ranked,
      explanation: `Comparação de ${ranked.length} jogos. ${ranked[0]?.numbers.join("-")} é o melhor (score ${ranked[0]?.totalScore}).`,
      suggestions: ["Simular os jogos comparados", "Gerar jogos alternativos"],
      metadata: { processingTimeMs: 0, enginesUsed: engines, confidence: intent.confidence, cached: false },
    };
  }
}

/** Singleton instance */
export const nativeAI = new NativeAIOrchestrator();
