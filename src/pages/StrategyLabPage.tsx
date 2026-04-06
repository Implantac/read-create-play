import { useState, useMemo, useCallback } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { useLotteryDraws } from "@/hooks/useLotteryDraws";
import { PageHeader } from "@/components/PageHeader";
import { PlanGate } from "@/components/PlanGate";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  runStrategyLab,
  getStrategiesForLottery,
  LabConfig,
  LabResult,
  EvolutionProfile,
} from "@/engine/strategy-evolution";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, Trophy, TrendingUp, TrendingDown, Minus,
  Zap, BarChart3, Lightbulb, Target, Shield, Coins,
  Play, Info, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";

const PROFILE_INFO: Record<EvolutionProfile, { label: string; desc: string }> = {
  economico: { label: "Econômico", desc: "Foco em menor custo" },
  equilibrado: { label: "Equilibrado", desc: "Melhor custo-benefício" },
  agressivo: { label: "Agressivo", desc: "Máxima performance" },
  profissional: { label: "Profissional", desc: "Análise completa" },
  cobertura_extrema: { label: "Cobertura Extrema", desc: "Máxima cobertura" },
};

export default function StrategyLabPage() {
  const { config } = useLotteryContext();
  const { draws } = useLotteryDraws(config.id);

  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [gamesPerStrategy, setGamesPerStrategy] = useState(5);
  const [profile, setProfile] = useState<EvolutionProfile>("equilibrado");
  const [result, setResult] = useState<LabResult | null>(null);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("ranking");
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const available = useMemo(() => getStrategiesForLottery(config.id), [config.id]);

  const drawRange = useMemo((): [number, number] => {
    if (!draws || draws.length === 0) return [1, 1];
    const sorted = [...draws].sort((a, b) => a.concurso - b.concurso);
    return [sorted[0].concurso, sorted[sorted.length - 1].concurso];
  }, [draws]);

  const toggleStrategy = useCallback((id: string) => {
    setSelectedStrategies(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
    setResult(null);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedStrategies(available.map(s => s.id));
    setResult(null);
  }, [available]);

  const runLab = useCallback(() => {
    if (!draws || draws.length === 0) {
      toast.error("Sem sorteios disponíveis");
      return;
    }
    setRunning(true);
    setResult(null);

    setTimeout(() => {
      try {
        const labConfig: LabConfig = {
          lotteryId: config.id,
          strategies: selectedStrategies,
          gamesPerStrategy,
          drawRange,
          profile,
        };
        const res = runStrategyLab(labConfig, draws, config);
        setResult(res);
        toast.success(`${res.rankings.length} estratégias testadas em ${res.elapsedMs}ms`);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao executar laboratório");
      }
      setRunning(false);
    }, 50);
  }, [draws, config, selectedStrategies, gamesPerStrategy, drawRange, profile]);

  const trendIcon = (t: string) => {
    if (t === "up") return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
    if (t === "down") return <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  return (
    <PlanGate feature="estrategias_ml">
      <div className="space-y-6">
        <PageHeader
          title="Laboratório de Estratégias"
          description="Motor autoevolutivo: teste, compare e descubra as melhores estratégias por loteria"
          icon={FlaskConical}
        />
        <LotteryContextBanner />

        {/* Config */}
        <Card className="bg-card/80 backdrop-blur border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <FlaskConical className="w-4 h-4 text-primary" />
              Configuração do Laboratório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Strategy selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Estratégias ({selectedStrategies.length}/{available.length})
                </span>
                <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
                  Selecionar Todas
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto pr-1">
                {available.map(s => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/20 cursor-pointer text-xs"
                  >
                    <Checkbox
                      checked={selectedStrategies.includes(s.id)}
                      onCheckedChange={() => toggleStrategy(s.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{s.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{s.description}</div>
                    </div>
                    <Badge variant="outline" className="text-[9px] shrink-0">
                      {s.category}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Jogos por Estratégia</label>
                <Slider
                  value={[gamesPerStrategy]}
                  onValueChange={([v]) => { setGamesPerStrategy(v); setResult(null); }}
                  min={3}
                  max={20}
                  step={1}
                />
                <span className="text-xs font-mono text-foreground">{gamesPerStrategy}</span>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Perfil</label>
                <Select value={profile} onValueChange={(v) => { setProfile(v as EvolutionProfile); setResult(null); }}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROFILE_INFO).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Concursos</label>
                <div className="text-xs font-mono text-foreground">
                  {drawRange[0]} → {drawRange[1]} ({draws?.length || 0} sorteios)
                </div>
              </div>
            </div>

            <Button
              onClick={runLab}
              disabled={running || selectedStrategies.length === 0}
              className="w-full gap-2 h-11"
            >
              {running ? (
                <>
                  <Zap className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Executar Laboratório ({selectedStrategies.length} estratégias)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Insights */}
              <Card className="bg-card/80 backdrop-blur border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    Insights
                    <Badge className="text-[10px]">{result.elapsedMs}ms</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {result.insights.map((insight, i) => (
                      <p key={i} className="text-xs text-foreground">{insight}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="ranking" className="text-xs gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Ranking
                  </TabsTrigger>
                  <TabsTrigger value="suggestions" className="text-xs gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Evolução
                  </TabsTrigger>
                  <TabsTrigger value="comparison" className="text-xs gap-1">
                    <BarChart3 className="w-3.5 h-3.5" /> Comparação
                  </TabsTrigger>
                </TabsList>

                {/* Ranking Tab */}
                <TabsContent value="ranking" className="space-y-2 mt-4">
                  {result.rankings.map((r) => (
                    <Card key={r.strategyId} className="bg-card/80 backdrop-blur border-border">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                            r.rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
                            r.rank === 2 ? "bg-gray-400/20 text-gray-300" :
                            r.rank === 3 ? "bg-orange-500/20 text-orange-400" :
                            "bg-muted/20 text-muted-foreground"
                          }`}>
                            {r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{r.strategyName}</span>
                              {trendIcon(r.trend)}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">
                                Score: <span className="font-mono font-bold text-primary">{r.metrics.globalScore.toFixed(1)}</span>
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Média: <span className="font-mono">{r.metrics.avgHits.toFixed(2)}</span>
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Melhor: <span className="font-mono">{r.metrics.bestHits}</span>
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Consist.: <span className="font-mono">{(r.metrics.consistency * 100).toFixed(0)}%</span>
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setShowDetails(showDetails === r.strategyId ? null : r.strategyId)}
                          >
                            {showDetails === r.strategyId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>

                        <AnimatePresence>
                          {showDetails === r.strategyId && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-3 pt-3 border-t border-border space-y-2 overflow-hidden"
                            >
                              <p className="text-xs text-muted-foreground">{r.explanation}</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <MiniMetric label="Diversidade" value={`${r.metrics.diversityScore.toFixed(0)}%`} />
                                <MiniMetric label="Cobertura" value={`${r.metrics.coverageScore.toFixed(0)}%`} />
                                <MiniMetric label="Redundância" value={`${(r.metrics.redundancyIndex * 100).toFixed(0)}%`} />
                                <MiniMetric label="Premiações" value={r.metrics.totalPrizes.toString()} />
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                Distribuição de acertos:{" "}
                                {Object.entries(r.metrics.hitDistribution)
                                  .sort(([a], [b]) => Number(b) - Number(a))
                                  .slice(0, 6)
                                  .map(([hits, count]) => `${hits}→${count}x`)
                                  .join(" | ")}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {/* Evolution Suggestions Tab */}
                <TabsContent value="suggestions" className="space-y-2 mt-4">
                  {result.suggestions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">Sem sugestões de evolução no momento.</p>
                  ) : (
                    result.suggestions.map((s, i) => (
                      <Card key={i} className="bg-card/80 backdrop-blur border-border">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              s.type === "promote" ? "bg-green-500/20 text-green-400" :
                              s.type === "discard" ? "bg-destructive/20 text-destructive" :
                              s.type === "combine" ? "bg-primary/20 text-primary" :
                              "bg-amber-500/20 text-amber-400"
                            }`}>
                              {s.type === "promote" ? <TrendingUp className="w-4 h-4" /> :
                               s.type === "discard" ? <TrendingDown className="w-4 h-4" /> :
                               s.type === "combine" ? <Sparkles className="w-4 h-4" /> :
                               <Target className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px]">{s.type}</Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  Confiança: {(s.confidence * 100).toFixed(0)}%
                                </span>
                                {s.expectedImprovement > 0 && (
                                  <span className="text-[10px] text-green-400">
                                    +{s.expectedImprovement}% estimado
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-foreground mt-1">{s.reason}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                {/* Comparison Tab */}
                <TabsContent value="comparison" className="mt-4">
                  <Card className="bg-card/80 backdrop-blur border-border overflow-x-auto">
                    <CardContent className="p-0">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-2 text-muted-foreground font-medium">#</th>
                            <th className="text-left p-2 text-muted-foreground font-medium">Estratégia</th>
                            <th className="text-right p-2 text-muted-foreground font-medium">Score</th>
                            <th className="text-right p-2 text-muted-foreground font-medium">Média</th>
                            <th className="text-right p-2 text-muted-foreground font-medium">Melhor</th>
                            <th className="text-right p-2 text-muted-foreground font-medium">Consist.</th>
                            <th className="text-right p-2 text-muted-foreground font-medium">Divers.</th>
                            <th className="text-right p-2 text-muted-foreground font-medium">Prêmios</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.rankings.map(r => (
                            <tr key={r.strategyId} className="border-b border-border/50 hover:bg-muted/10">
                              <td className="p-2 font-mono font-bold text-primary">{r.rank}</td>
                              <td className="p-2 font-medium text-foreground">{r.strategyName}</td>
                              <td className="p-2 text-right font-mono font-bold text-primary">{r.metrics.globalScore.toFixed(1)}</td>
                              <td className="p-2 text-right font-mono text-foreground">{r.metrics.avgHits.toFixed(2)}</td>
                              <td className="p-2 text-right font-mono text-foreground">{r.metrics.bestHits}</td>
                              <td className="p-2 text-right font-mono text-foreground">{(r.metrics.consistency * 100).toFixed(0)}%</td>
                              <td className="p-2 text-right font-mono text-foreground">{r.metrics.diversityScore.toFixed(0)}%</td>
                              <td className="p-2 text-right font-mono text-foreground">{r.metrics.totalPrizes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PlanGate>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-muted/10 border border-border text-center">
      <div className="text-sm font-mono font-bold text-foreground">{value}</div>
      <div className="text-[9px] text-muted-foreground">{label}</div>
    </div>
  );
}
