import { useState, useMemo } from "react";
import { NumberStats } from "@/engine/stats/statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { ProfessionalBet, generateProfessionalBets, getClosurePresetsForLottery, selectBaseNumbersForClosure, generateClosure } from "@/engine/professional-generator";
import { BetCard } from "@/components/lottery/BetCard";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Sparkles, Shield, Zap, Loader2, Copy, Download } from "lucide-react";
import { toast } from "sonner";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws: DrawResult[];
  onSaveBet?: (numbers: number[], strategy?: string, score?: number, grade?: string) => void;
}

export function ProfessionalGeneratorPanel({ stats, config, draws, onSaveBet }: Props) {
  const { hotNumbers, coldNumbers } = useLotteryContext();
  const [bets, setBets] = useState<ProfessionalBet[]>([]);
  const [generating, setGenerating] = useState(false);
  const [betsPerStrategy, setBetsPerStrategy] = useState(2);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const result = generateProfessionalBets(stats, config, draws, betsPerStrategy);
      setBets(result);
      setGenerating(false);
      toast.success(`${result.length} apostas profissionais geradas!`);
    }, 100);
  };

  return (
    <Card className="bg-card border border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Gerador Profissional
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase font-medium">Jogos/estratégia:</span>
            {[1, 2, 3, 5].map(n => (
              <Button
                key={n}
                variant={betsPerStrategy === n ? "default" : "outline"}
                size="sm"
                onClick={() => setBetsPerStrategy(n)}
                className="h-8 w-8 p-0 text-xs"
              >
                {n}
              </Button>
            ))}
          </div>
          <Button onClick={handleGenerate} disabled={generating} className="flex-1 gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Gerar Apostas
          </Button>
        </div>

        {bets.length > 0 && (
          <div className="grid gap-4">
            {bets.map((bet) => (
              <BetCard
                key={bet.rank}
                rank={bet.rank}
                numbers={bet.numbers}
                score={bet.statisticalScore}
                grade={bet.quality.grade}
                strategyLabel={bet.strategyLabel}
                hotNumbers={hotNumbers}
                coldNumbers={coldNumbers}
                onSave={onSaveBet ? () => onSaveBet(bet.numbers, bet.strategyLabel, bet.statisticalScore, bet.quality.grade) : undefined}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
