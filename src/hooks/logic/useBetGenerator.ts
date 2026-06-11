import { useState, useCallback } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";
import { runIntelligentPipeline } from "@/ai/knowledge/strategiesLibrary";
import { evaluateBetQuality } from "@/engine/stats/bet-quality";

export function useBetGenerator() {
  const { config, stats, draws, selectedLottery } = useLotteryContext();
  const { saveGeneration } = useGenerationHistory(selectedLottery);
  const [luckyGame, setLuckyGame] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);

  const generateGame = useCallback((profile: "conservative" | "balanced" | "aggressive" | "ia_premium" = "balanced") => {
    if (stats.length === 0 || draws.length === 0) return;
    setGenerating(true);
    
    // Simulate processing time for a "neural" feel
    setTimeout(async () => {
      try {
        const strategyMap = {
          conservative: "Tendência Conservadora",
          balanced: "Equilíbrio Neural",
          aggressive: "Alta Performance Estatística",
          ia_premium: "Titan AI Premium"
        };

        const result = runIntelligentPipeline(stats, draws, selectedLottery, profile === "ia_premium" ? "ml" : "balance", 1);
        if (result.games.length > 0) {
          const bet = result.games[0];
          const quality = evaluateBetQuality(bet, stats, config, draws);
          
          // Adjust score based on profile
          let score = quality.overall;
          if (profile === "ia_premium") score = Math.min(99, score + 10);
          
          const gameData = { 
            numbers: bet, 
            score, 
            strategy: strategyMap[profile],
            description: `Geração ${profile} baseada em modelos ${profile === "ia_premium" ? "de inteligência artificial avançada" : "estatísticos clássicos"}.`,
            reasons: quality.strengths.length > 0 ? quality.strengths : ["Equilíbrio estrutural", "Frequência ideal", "Dispersão técnica"],
            pipeline: { filters: [], score }
          };

          setLuckyGame(gameData);
          await saveGeneration(gameData);
        }
      } catch (error) {
        console.error("Error generating game:", error);
      } finally {
        setGenerating(false);
      }
    }, 1200);
  }, [stats, draws, selectedLottery, saveGeneration, config]);

  return {
    luckyGame,
    generating,
    generateGame,
    setLuckyGame
  };
}
