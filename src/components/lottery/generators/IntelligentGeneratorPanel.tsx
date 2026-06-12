import { useState, useMemo } from "react";
import { NumberStats, computeFrequencyStats } from "@/engine/stats/statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { IntelligentBet, GenerationSummary, generateIntelligentBets, computeGenerationSummary } from "@/engine/intelligent-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Brain, Sparkles, Trophy, Target, Lightbulb, BarChart3, Zap, ChevronDown, ChevronUp, History } from "lucide-react";
import { toast } from "sonner";
import { BetCard } from "@/components/lottery/BetCard";
import { AIAnalystBriefing } from "@/components/lottery/AIAnalystBriefing";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { m, AnimatePresence } from "framer-motion";

type HistoryWindow = "all" | "10" | "20" | "50";

const WINDOW_OPTIONS: { value: HistoryWindow; label: string; hint: string }[] = [
  { value: "10", label: "Últimos 10", hint: "Tendência imediata" },
  { value: "20", label: "Últimos 20", hint: "Curto prazo" },
  { value: "50", label: "Últimos 50", hint: "Médio prazo" },
  { value: "all", label: "Histórico Total", hint: "Probabilidade real" },
];


interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws: DrawResult[];
  onSaveBet?: (numbers: number[], strategy?: string, score?: number, grade?: string) => void;
}

export function IntelligentGeneratorPanel({ stats, config, draws, onSaveBet }: Props) {
  const { hotNumbers, coldNumbers } = useLotteryContext();
  const [bets, setBets] = useState<IntelligentBet[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [totalBets, setTotalBets] = useState(300);
  const [topResults, setTopResults] = useState(20);
  const [simulateHistory, setSimulateHistory] = useState(true);
  const [expandedBet, setExpandedBet] = useState<number | null>(null);


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
      setIsGenerating(false);
      toast.success(`${results.length} apostas otimizadas geradas!`);
    }, 100);
  };

  return (
    <Card className="border-primary/30 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Brain className="h-6 w-6" />
          Gerador Titan (FAROL)
          <Badge variant="outline" className="ml-2 font-mono">v7.0 PRO</Badge>
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

        <Button onClick={handleGenerate} disabled={isGenerating || draws.length === 0} className="w-full gradient-brand h-12 uppercase font-black tracking-widest text-xs" size="lg">
          {isGenerating ? <><Zap className="h-4 w-4 animate-spin mr-2" /> Calculando Matrizes...</> : <><Sparkles className="h-4 w-4 mr-2" /> Gerar Apostas Titan (FAROL)</>}
        </Button>

        {bets.length > 0 && (
          <div className="grid gap-4">
            {bets.map((bet) => (
              <div key={bet.rank} className="space-y-2">
                <div onClick={() => setExpandedBet(expandedBet === bet.rank ? null : (bet.rank ?? null))} className="cursor-pointer relative">
                  <BetCard
                    rank={bet.rank}
                    numbers={bet.numbers}
                    score={bet.score}
                    grade={bet.quality.grade}
                    strategyLabel={bet.strategyLabel}
                    insights={bet.analysis.insights.slice(0, 2)}
                    hotNumbers={hotNumbers}
                    coldNumbers={coldNumbers}
                    onSave={onSaveBet ? () => onSaveBet(bet.numbers, `IA-${bet.strategyLabel}`, bet.score, bet.quality.grade) : undefined}
                  />
                  <div className="absolute top-4 right-4 text-muted-foreground opacity-40">
                    {expandedBet === bet.rank ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
                
                <AnimatePresence>
                  {expandedBet === bet.rank && (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <AIAnalystBriefing 
                        confidence={Math.round(bet.score * 0.95 + 5)} 
                        reasons={bet.analysis.insights} 
                      />
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

          </div>
        )}
      </CardContent>
    </Card>
  );
}
