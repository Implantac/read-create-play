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

  const generateGame = useCallback(() => {
    if (stats.length === 0 || draws.length === 0) return;
    setGenerating(true);
    
    // Simulate processing time for a "neural" feel
    setTimeout(async () => {
      try {
        const result = runIntelligentPipeline(stats, draws, selectedLottery, "balance", 1);
        if (result.games.length > 0) {
          const bet = result.games[0];
          const quality = evaluateBetQuality(bet, stats, config, draws);
          const gameData = { 
            numbers: bet, 
            score: quality.overall, 
            strategy: "Equilíbrio Neural",
            description: "Geração equilibrada baseada em padrões de alta frequência.",
            reasons: quality.strengths.length > 0 ? quality.strengths : ["Equilíbrio estrutural", "Frequência ideal", "Dispersão técnica"],
            pipeline: { filters: [], score: quality.overall }
          };

          setLuckyGame(gameData);
          await saveGeneration(gameData);
        }
      } catch (error) {
        console.error("Error generating game:", error);
      } finally {
        setGenerating(false);
      }
    }, 1000);
  }, [stats, draws, selectedLottery, saveGeneration, config]);

  return {
    luckyGame,
    generating,
    generateGame,
    setLuckyGame
  };
}
