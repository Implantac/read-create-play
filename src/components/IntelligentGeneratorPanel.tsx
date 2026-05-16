import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, Sparkles, TrendingUp, Target, BarChart3, Save, Zap, Trophy, Info, Lightbulb } from "lucide-react";
import { NumberStats } from "@/features/statistics/engine";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import {
  generateIntelligentBets,
  computeGenerationSummary,
  IntelligentBet,
  GenerationSummary,
  GenerationConfig,
} from "@/engine/intelligent-generator";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell,
} from "recharts";
import { toast } from "sonner";
import { GameAnalysisBlock } from "@/components/GameAnalysisBlock";
import {
  ANTI_POPULARITY_PROFILES,
  AntiPopularityLevel,
  getAntiPopularityLevel,
  setAntiPopularityLevel,
} from "@/ai/knowledge/jackpotMasterStrategies";
import { Shield } from "lucide-react";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws: DrawResult[];
  onSaveBet?: (numbers: number[], strategy?: string, score?: number, grade?: string) => void;
}

const GRADE_COLORS: Record<string, string> = {
  S: "text-yellow-400",
  A: "text-green-400",
  B: "text-blue-400",
  C: "text-muted-foreground",
  D: "text-orange-400",
  F: "text-red-400",
};

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#10b981", "#f97316", "#ec4899"];

export function IntelligentGeneratorPanel({ stats, config, draws, onSaveBet }: Props) {
  const [bets, setBets] = useState<IntelligentBet[]>([]);
  const [summary, setSummary] = useState<GenerationSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [totalBets, setTotalBets] = useState(300);
  const [topResults, setTopResults] = useState(20);
  const [simulateHistory, setSimulateHistory] = useState(true);
  const [selectedBet, setSelectedBet] = useState<IntelligentBet | null>(null);
  const [antiPopLevel, setAntiPopLevelState] = useState<AntiPopularityLevel>(() => getAntiPopularityLevel());

  const handleAntiPopChange = (level: AntiPopularityLevel) => {
    setAntiPopularityLevel(level);
    setAntiPopLevelState(level);
    toast.success(`Anti-popularidade: ${ANTI_POPULARITY_PROFILES[level].label}`, {
      description: ANTI_POPULARITY_PROFILES[level].description,
    });
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const genConfig: GenerationConfig = {
        totalBets,
        topResults,
        strategies: ["hot", "lowDelay", "trend", "cycle", "balanced", "smart", "hybrid", "ml", "sectors", "pattern", "markov", "poisson", "cluster"],
        simulateHistory,
        minScore: 30,
      };
      const results = generateIntelligentBets(stats, config, draws, genConfig);
      setBets(results);
      setSummary(computeGenerationSummary(results, config));
      setSelectedBet(results[0] || null);
      setIsGenerating(false);
      toast.success(`${results.length} apostas otimizadas geradas!`);
    }, 100);
  };

  const radarData = useMemo(() => {
    if (!selectedBet) return [];
    return selectedBet.quality.dimensions.map(d => ({
      dimension: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name,
      score: d.score,
      fullMark: 100,
    }));
  }, [selectedBet]);

  const strategyPieData = useMemo(() => {
    if (!summary) return [];
    return summary.strategyDistribution.map(s => ({
      name: s.strategy,
      value: s.count,
      avgScore: s.avgScore,
    }));
  }, [summary]);

  const frequencyBarData = useMemo(() => {
    if (!summary) return [];
    return summary.commonNumbers.map(n => ({
      number: n.number.toString().padStart(2, "0"),
      frequência: n.frequency,
    }));
  }, [summary]);

  return (
    <Card className="border-primary/30 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Brain className="h-6 w-6" />
          Gerador Inteligente de Apostas
          <Badge variant="outline" className="ml-2">v2.0</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Combina estatísticas, padrões, simulações e tendências para gerar apostas otimizadas.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Config */}
        <div className="grid sm:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="space-y-2">
            <Label className="text-xs">Candidatos: {totalBets}</Label>
            <Slider value={[totalBets]} onValueChange={v => setTotalBets(v[0])} min={50} max={1000} step={50} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Top resultados: {topResults}</Label>
            <Slider value={[topResults]} onValueChange={v => setTopResults(v[0])} min={5} max={50} step={5} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={simulateHistory} onCheckedChange={setSimulateHistory} />
            <Label className="text-xs">Simular histórico</Label>
          </div>
        </div>

        {/* Anti-Popularidade */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <div>
                <Label className="text-xs font-semibold">Nível de Anti-Popularidade</Label>
                <p className="text-[10px] text-muted-foreground">
                  Penaliza datas (1–31) e múltiplos de 5 para reduzir rateio em caso de prêmio.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Datas ×{ANTI_POPULARITY_PROFILES[antiPopLevel].datesMultiplier.toFixed(2)} · Mult5 ×
              {ANTI_POPULARITY_PROFILES[antiPopLevel].multiplesOfFiveMultiplier.toFixed(2)}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(ANTI_POPULARITY_PROFILES) as AntiPopularityLevel[]).map((lvl) => {
              const profile = ANTI_POPULARITY_PROFILES[lvl];
              const active = antiPopLevel === lvl;
              return (
                <Button
                  key={lvl}
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAntiPopChange(lvl)}
                  className="h-auto py-2 flex flex-col items-start gap-0.5 text-left"
                >
                  <span className="text-xs font-semibold">{profile.label}</span>
                  <span className="text-[10px] opacity-80 font-normal whitespace-normal leading-tight">
                    {profile.description}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || draws.length === 0}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <><Zap className="h-4 w-4 animate-spin mr-2" /> Gerando...</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Gerar Apostas Inteligentes</>
          )}
        </Button>

        {bets.length > 0 && summary && (
          <Tabs defaultValue="ranking">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="ranking"><Trophy className="h-3 w-3 mr-1" />Ranking</TabsTrigger>
              <TabsTrigger value="detail"><Target className="h-3 w-3 mr-1" />Detalhes</TabsTrigger>
              <TabsTrigger value="insights"><Lightbulb className="h-3 w-3 mr-1" />Insights</TabsTrigger>
              <TabsTrigger value="charts"><BarChart3 className="h-3 w-3 mr-1" />Gráficos</TabsTrigger>
            </TabsList>

            {/* RANKING TAB */}
            <TabsContent value="ranking" className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Score médio: <strong className="text-foreground">{summary.avgScore}</strong></span>
                <span>Melhor: <strong className="text-primary">{summary.bestScore}</strong></span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {bets.map(bet => (
                  <div
                    key={bet.rank}
                    onClick={() => setSelectedBet(bet)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50 ${
                      selectedBet?.rank === bet.rank ? "border-primary bg-primary/5" : "border-border/50 bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">#{bet.rank}</span>
                        <Badge variant="outline" className={GRADE_COLORS[bet.quality.grade]}>
                          {bet.quality.grade}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{bet.strategyLabel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{bet.score}/100</span>
                        {onSaveBet && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={e => {
                              e.stopPropagation();
                              onSaveBet(bet.numbers, `IA-${bet.strategyLabel}`, bet.score, bet.quality.grade);
                              toast.success("Aposta salva!");
                            }}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {bet.numbers.map(n => (
                        <span
                          key={n}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold"
                        >
                          {n.toString().padStart(2, "0")}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Progress value={bet.score} className="h-1" />
                    </div>
                    <GameAnalysisBlock numbers={bet.numbers} stats={stats} config={config} draws={draws} strategyId={bet.strategy} />
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* DETAIL TAB */}
            <TabsContent value="detail" className="space-y-4">
              {selectedBet ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={GRADE_COLORS[selectedBet.quality.grade]}>
                      Nota {selectedBet.quality.grade}
                    </Badge>
                    <span className="text-lg font-bold text-primary">{selectedBet.score}/100</span>
                    <span className="text-sm text-muted-foreground">— {selectedBet.strategyLabel}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {selectedBet.numbers.map(n => (
                      <span
                        key={n}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/20 text-primary font-bold"
                      >
                        {n.toString().padStart(2, "0")}
                      </span>
                    ))}
                  </div>

                  {/* Quality Dimensions */}
                  <div className="grid grid-cols-2 gap-2">
                    {selectedBet.quality.dimensions.map(dim => (
                      <div key={dim.name} className="p-2 rounded bg-muted/30 border border-border/30">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{dim.name}</span>
                          <span className="font-bold">{dim.score}</span>
                        </div>
                        <Progress value={dim.score} className="h-1" />
                        <p className="text-[10px] text-muted-foreground mt-1">{dim.detail}</p>
                      </div>
                    ))}
                  </div>

                  {/* Analysis */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Par/Ímpar:</span>{" "}
                      <span className="font-medium">{selectedBet.analysis.parityBalance}</span>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Soma:</span>{" "}
                      <span className="font-medium">{selectedBet.analysis.sumRange}</span>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Distribuição:</span>{" "}
                      <span className="font-medium">{selectedBet.analysis.distributionQuality}</span>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Tendência:</span>{" "}
                      <span className="font-medium">{selectedBet.analysis.trendAlignment}</span>
                    </div>
                  </div>

                  {/* Simulation Results */}
                  {simulateHistory && selectedBet.simulationHits.totalDraws > 0 && (
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Simulação Histórica
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Média acertos:</span>{" "}
                          <span className="font-bold text-primary">{selectedBet.simulationHits.avgHits.toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Máx acertos:</span>{" "}
                          <span className="font-bold text-green-400">{selectedBet.simulationHits.maxHits}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Premiações:</span>{" "}
                          <span className="font-bold text-yellow-400">{selectedBet.simulationHits.prizeCount}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Radar Chart */}
                  {radarData.length > 0 && (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                          <PolarRadiusAxis domain={[0, 100]} tick={false} />
                          <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Selecione uma aposta no Ranking.</p>
              )}
            </TabsContent>

            {/* INSIGHTS TAB */}
            <TabsContent value="insights" className="space-y-4">
              {selectedBet && selectedBet.analysis.insights.length > 0 ? (
                <div className="space-y-2">
                  {selectedBet.analysis.insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/30">
                      <Lightbulb className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Selecione uma aposta para ver insights.</p>
              )}

              {selectedBet && (
                <>
                  {selectedBet.quality.strengths.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-green-400 mb-2">Pontos Fortes</h4>
                      {selectedBet.quality.strengths.map((s, i) => (
                        <p key={i} className="text-xs text-muted-foreground mb-1">✓ {s}</p>
                      ))}
                    </div>
                  )}
                  {selectedBet.quality.warnings.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-orange-400 mb-2">Alertas</h4>
                      {selectedBet.quality.warnings.map((w, i) => (
                        <p key={i} className="text-xs text-muted-foreground mb-1">⚠ {w}</p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* CHARTS TAB */}
            <TabsContent value="charts" className="space-y-4">
              {/* Common Numbers Bar Chart */}
              <div>
                <h4 className="text-xs font-semibold mb-2">Dezenas Mais Frequentes nos Top Jogos</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={frequencyBarData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Bar dataKey="frequência" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Strategy Pie Chart */}
              <div>
                <h4 className="text-xs font-semibold mb-2">Distribuição por Estratégia</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={strategyPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {strategyPieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
