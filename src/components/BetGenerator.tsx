import { useState } from "react";
import { NumberStats } from "@/engine/stats/statistics";
import { LotteryConfig } from "@/data/lotteries";
import { BetCard } from "@/components/lottery/BetCard";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { evaluateBetQuality } from "@/engine/stats/bet-quality";
import { generateSmartBet } from "@/engine/stats/statistics";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  onSaveBet?: (numbers: number[], strategy?: string, score?: number, grade?: string) => void;
}

export function BetGenerator({ stats, config, onSaveBet }: Props) {
  const { draws, hotNumbers, coldNumbers } = useLotteryContext();
  const [bets, setBets] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  const generate = (count: number) => {
    setGenerating(true);
    setTimeout(() => {
      const newBets = [];
      for (let i = 0; i < count; i++) {
        const numbers = generateSmartBet(stats, config.pick);
        const quality = evaluateBetQuality(numbers, stats, config, draws);
        newBets.push({ numbers, quality });
      }
      setBets(newBets);
      setGenerating(false);
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[1, 3, 5, 10].map(n => (
          <Button key={n} variant="outline" size="sm" onClick={() => generate(n)} disabled={generating} className="text-xs">
            <RefreshCw className={`w-3 h-3 mr-1.5 ${generating ? "animate-spin" : ""}`} />
            {n} jogo{n > 1 ? "s" : ""} inteligente{n > 1 ? "s" : ""}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {bets.map((bet, i) => (
          <BetCard
            key={i}
            rank={i + 1}
            numbers={bet.numbers}
            score={bet.quality.overall}
            grade={bet.quality.grade}
            strategyLabel="Gerador Inteligente"
            hotNumbers={hotNumbers}
            coldNumbers={coldNumbers}
            onSave={onSaveBet ? () => onSaveBet(bet.numbers, "Gerador Inteligente", bet.quality.overall, bet.quality.grade) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
