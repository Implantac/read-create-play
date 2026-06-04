import { useState, useMemo } from "react";
import { NumberStats } from "@/engine/stats/statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { IntelligentBet, GenerationSummary, generateIntelligentBets, computeGenerationSummary } from "@/engine/intelligent-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Brain, Sparkles, Trophy, Target, Lightbulb, BarChart3, Zap } from "lucide-react";
import { toast } from "sonner";
import { BetCard } from "@/components/lottery/BetCard";
import { useLotteryContext } from "@/contexts/LotteryContext";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws: DrawResult[];
  onSaveBet?: (numbers: number[], strategy?: string, score?: number, grade?: string) => void;
}

export function IntelligentGeneratorPanel({ stats, config, draws, onSaveBet }: Props) {
  const { hotNumbers, coldNumbers } = useLotteryContext();
  const [bets, setBets] = useState<IntelligentBet[]>([]);
  const [summary, setSummary] = useState<GenerationSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [totalBets, setTotalBets] = useState(300);
  const [topResults, setTopResults] = useState(20);
  const [simulateHistory, setSimulateHistory] = useState(true);
  const [selectedBet, setSelectedBet] = useState<IntelligentBet | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const results = generateIntelligentBets(stats, config, draws, {
        totalBets,
        topResults,
        strategies: ["hot", "lowDelay", "trend", "cycle", "balanced", "smart", "hybrid", "ml", "sectors", "pattern"],
        simulateHistory,
        minScore: 30,
      });
      setBets(results);
      setSummary(computeGenerationSummary(results, config));
      setSelectedBet(results[0] || null);
      setIsGenerating(false);
      toast.success(`${results.length} apostas otimizadas geradas!`);
    }, 100);
  };

  return (
    <Card className="border-primary/30 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Brain className="h-6 w-6" />
          Gerador Inteligente
          <Badge variant="outline" className="ml-2 font-mono">v5.2</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid sm:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Candidatos: {totalBets}</Label>
            <Slider value={[totalBets]} onValueChange={v => setTotalBets(v[0])} min={50} max={1000} step={50} />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Top resultados: {topResults}</Label>
            <Slider value={[topResults]} onValueChange={v => setTopResults(v[0])} min={5} max={50} step={5} />
          </div>
          <div className="flex items-center gap-2 pt-4">
            <Switch checked={simulateHistory} onCheckedChange={setSimulateHistory} />
            <Label className="text-xs">Simular histórico</Label>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating || draws.length === 0} className="w-full" size="lg">
          {isGenerating ? <><Zap className="h-4 w-4 animate-spin mr-2" /> Gerando...</> : <><Sparkles className="h-4 w-4 mr-2" /> Gerar Apostas Inteligentes</>}
        </Button>

        {bets.length > 0 && (
          <div className="grid gap-4">
            {bets.map((bet) => (
              <BetCard
                key={bet.rank}
                rank={bet.rank}
                numbers={bet.numbers}
                score={bet.score}
                grade={bet.quality.grade}
                strategyLabel={bet.strategyLabel}
                insights={bet.analysis.insights}
                hotNumbers={hotNumbers}
                coldNumbers={coldNumbers}
                onSave={onSaveBet ? () => onSaveBet(bet.numbers, `IA-${bet.strategyLabel}`, bet.score, bet.quality.grade) : undefined}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
