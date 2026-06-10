import { useState, useMemo, useCallback } from "react";
import { DrawResult } from "@/data/lotteries";
import { MatchResult } from "@/services/api/lottery";;
import { DrawResultWithPrizes } from "@/hooks/useLotteryDraws";
import { toast } from "sonner";
import { computeFrequencyStats } from "@/engine/stats/statistics";
import { generateNativeImprovements } from "@/engine/ai/native-analysis";
import { useSavedBets, SavedBet } from "@/hooks/useSavedBets";
import { 
  matchBetAgainstDraw, 
  getEstimatedPrize, 
  getRealPrizeLabel, 
  formatCurrency,
  getMaxPossibleHits
} from "@/utils/lottery-utils";

interface UseBetCheckerProps {
  draws: DrawResult[];
  drawsWithPrizes?: DrawResultWithPrizes[];
  lotteryId: string;
  maxNumbers: number;
  pick: number;
}

export function useBetChecker({ draws, drawsWithPrizes, lotteryId, maxNumbers, pick }: UseBetCheckerProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [performances, setPerformances] = useState<any[]>([]);
  const [aiImprovements, setAiImprovements] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [drawRange, setDrawRange] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<"check" | "performance" | "improve">("check");
  const [hasRunPerformance, setHasRunPerformance] = useState(false);

  const { savedBets } = useSavedBets(lotteryId);
  const selectedDraws = useMemo(() => draws.slice(0, drawRange), [draws, drawRange]);

  const prizeDataMap = useMemo(() => {
    const map = new Map<number, any>();
    if (drawsWithPrizes) {
      drawsWithPrizes.forEach(d => map.set(d.concurso, d.prizeTiers || null));
    }
    return map;
  }, [drawsWithPrizes]);

  const toggleNumber = useCallback((n: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(n)) return prev.filter(x => x !== n);
      if (prev.length >= pick) {
        toast.error(`Máximo de ${pick} números`);
        return prev;
      }
      return [...prev, n].sort((a, b) => a - b);
    });
    setResults(null);
  }, [pick]);

  const check = useCallback(() => {
    if (selectedNumbers.length < 1) {
      toast.error("Adicione pelo menos 1 número");
      return;
    }
    const matches = draws.map(draw => {
      const { hits, matched } = matchBetAgainstDraw(selectedNumbers, draw.numbers, lotteryId);
      return { 
        concurso: draw.concurso, 
        date: draw.date, 
        drawnNumbers: draw.numbers, 
        matchedNumbers: matched, 
        matchCount: hits 
      };
    }).filter(r => r.matchCount > 0).sort((a, b) => b.matchCount - a.matchCount);
    
    setResults(matches);
    toast.success(`${matches.length} concursos com acertos encontrados`);
  }, [selectedNumbers, draws, lotteryId]);

  const runPerformanceCheck = useCallback(() => {
    const allBets: { numbers: number[]; label: string }[] = [];
    if (selectedNumbers.length > 0) {
      allBets.push({ numbers: [...selectedNumbers], label: `Seleção atual (${selectedNumbers.length} nº)` });
    }
    savedBets.forEach((bet, i) => {
      allBets.push({ 
        numbers: [...bet.numbers], 
        label: bet.label || bet.strategy || `Aposta salva #${i + 1}` 
      });
    });

    if (allBets.length === 0 || selectedDraws.length === 0) return;

    const maxHits = getMaxPossibleHits(lotteryId, pick);
    const perfs = allBets.map(bet => {
      let totalPrizeValue = 0;
      const betResults = selectedDraws.map(draw => {
        const { hits, matched } = matchBetAgainstDraw(bet.numbers, draw.numbers, lotteryId);
        const prizeInfo = getEstimatedPrize(lotteryId, hits);
        if (prizeInfo) totalPrizeValue += prizeInfo.value;
        const realPrize = getRealPrizeLabel(prizeDataMap.get(draw.concurso), hits);
        return { 
          concurso: draw.concurso, 
          date: draw.date, 
          hits, 
          matched, 
          prize: prizeInfo?.label || "", 
          prizeValue: prizeInfo?.value || 0, 
          realPrize 
        };
      });

      const drawCount = selectedDraws.length;
      const totalHits = betResults.reduce((s, r) => s + r.hits, 0);
      const avgHits = drawCount > 0 ? totalHits / drawCount : 0;
      const bestHit = Math.max(...betResults.map(r => r.hits), 0);
      const prizeHits = betResults.filter(r => r.prizeValue > 0).length;
      
      const score = Math.min(100, Math.round((avgHits / pick) * 40 + (bestHit / pick) * 30 + (prizeHits / drawCount) * 30));

      return {
        numbers: bet.numbers,
        label: bet.label,
        results: betResults,
        avgHits,
        bestHit,
        prizeHits,
        totalPrizeValue,
        totalPrize: formatCurrency(totalPrizeValue),
        score
      };
    });

    setPerformances(perfs.sort((a, b) => b.score - a.score));
    setHasRunPerformance(true);
  }, [selectedNumbers, savedBets, selectedDraws, lotteryId, pick, prizeDataMap]);

  return {
    selectedNumbers,
    setSelectedNumbers,
    toggleNumber,
    results,
    check,
    performances,
    runPerformanceCheck,
    aiImprovements,
    loadingAI,
    drawRange,
    setDrawRange,
    activeTab,
    setActiveTab,
    hasRunPerformance
  };
}
