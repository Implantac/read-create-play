import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NumberStats } from "@/engine/statistics";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import type {
  MassiveSimResult, MassiveSimProgress, GenerationMode,
  SimulatedGame,
} from "@/engine/massive-simulation-engine";
import MassiveSimWorker from "@/workers/massive-sim.worker?worker";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, Play, Trophy, TrendingUp, BarChart3,
  Zap, Brain, Target, ArrowUpRight, ArrowDownRight,
  Minus, Sparkles, AlertCircle, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, CartesianGrid, Cell,
} from "recharts";
import { toast } from "sonner";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws: DrawResult[];
}

const GAME_OPTIONS = [
  { label: "10K", value: 10_000 },
  { label: "50K", value: 50_000 },
  { label: "100K", value: 100_000 },
  { label: "500K", value: 500_000 },
  { label: "1M", value: 1_000_000 },
  { label: "5M", value: 5_000_000 },
];

const MODE_OPTIONS: { id: GenerationMode; label: string; desc: string }[] = [
  { id: "random", label: "Aleatório", desc: "Geração uniforme" },
  { id: "statistical", label: "Estatístico", desc: "Baseado em frequência" },
  { id: "ai_weighted", label: "IA Ponderado", desc: "Tendência + ciclo" },
  { id: "hybrid", label: "Híbrido", desc: "Mix de todas" },
];

const TREND_ICONS = {
  positive: <ArrowUpRight className="w-3.5 h-3.5 text-primary" />,
  negative: <ArrowDownRight className="w-3.5 h-3.5 text-destructive" />,
  neutral: <Minus className="w-3.5 h-3.5 text-muted-foreground" />,
};

export function MassiveSimulationDashboard({ stats, config, draws }: Props) {
  const [totalGames, setTotalGames] = useState(50_000);
  const [mode, setMode] = useState<GenerationMode>("hybrid");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<MassiveSimProgress | null>(null);
  const [result, setResult] = useState<MassiveSimResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // Reset state when lottery changes
  const prevLotteryId = useRef(config.id);
  useEffect(() => {
    if (prevLotteryId.current !== config.id) {
      prevLotteryId.current = config.id;
      setResult(null);
      setAiAnalysis(null);
      setProgress(null);
    }
  }, [config.id]);

  const handleProgress = useCallback((p: MassiveSimProgress) => {
    setProgress(p);
  }, []);

  const runSimulation = async () => {
    if (draws.length === 0) {
      toast.error("Importe os sorteios primeiro");
      return;
    }
    setRunning(true);
    setResult(null);
    setAiAnalysis(null);
    setProgress(null);

    // Terminate previous worker if still alive
    workerRef.current?.terminate();

    const worker = new MassiveSimWorker();
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const { type, data } = e.data;
      if (type === "progress") {
        setProgress(data as MassiveSimProgress);
      } else if (type === "result") {
        setResult(data as MassiveSimResult);
        setRunning(false);
        toast.success(`${data.totalGenerated.toLocaleString()} jogos simulados em ${(data.elapsedMs / 1000).toFixed(1)}s`);
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.onerror = (err) => {
      console.error("Worker error:", err);
      toast.error("Erro na simulação (worker)");
      setRunning(false);
      worker.terminate();
      workerRef.current = null;
    };

    // Prepare serializable stats
    const serializableStats = stats.map(s => ({
      percentage: s.percentage, recentFreq: s.recentFreq, cycleScore: s.cycleScore,
      trend: s.trend, momentum: s.momentum, lastSeen: s.lastSeen,
    }));

    worker.postMessage({
      type: "run_massive_sim",
      job: {
        config, draws, stats: serializableStats, totalGames, mode,
        batchSize: Math.min(10_000, totalGames),
        topN: 50,
      },
    });
  };

  // Cleanup worker on unmount
  useEffect(() => {
    return () => { workerRef.current?.terminate(); };
  }, []);

  const requestAIAnalysis = async () => {
    if (!result) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-massive-simulation", {
        body: {
          topGames: result.topGames.slice(0, 15),
          patternInsights: result.patternInsights,
          distributionSummary: result.distributionSummary,
          lotteryName: config.name,
          lotteryPick: config.pick,
          lotteryNumbers: config.numbers,
          totalGenerated: result.totalGenerated,
          totalEvaluated: result.totalEvaluated,
        },
      });
      if (error) throw error;
      setAiAnalysis(data.analysis || "Análise não disponível.");
    } catch (e) {
      toast.error("Erro na análise IA");
    } finally {
      setAiLoading(false);
    }
  };

  const progressPercent = progress
    ? Math.round((progress.gamesGenerated / progress.totalGames) * 100)
    : 0;

  // Chart: number frequency in top games
  const numFreqData = result ? (() => {
    const freq = new Map<number, number>();
    for (const g of result.topGames) {
      for (const n of g.numbers) freq.set(n, (freq.get(n) || 0) + 1);
    }
    return [...freq.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([num, count]) => ({ num: num.toString().padStart(2, "0"), count, pct: Math.round(count / result.topGames.length * 100) }));
  })() : [];

  // Radar data
  const radarData = result?.distributionSummary ? [
    { metric: "Soma", value: Math.min(100, result.distributionSummary.avgSum / (config.numbers * config.pick / 2) * 100) },
    { metric: "Equilíbrio", value: (1 - Math.abs(result.distributionSummary.avgEvenRatio - 0.5) * 2) * 100 },
    { metric: "Spread", value: (result.distributionSummary.avgSpread / config.numbers) * 100 },
    { metric: "Prêmios", value: Math.min(100, result.distributionSummary.avgPrizeRate * 2) },
    { metric: "Acertos", value: (result.distributionSummary.bestHitOverall / config.pick) * 100 },
  ] : [];

  // Score vs Avg Hits scatter
  const scatterData = result?.topGames.map(g => ({
    avgHits: g.avgHits,
    score: g.score,
    prizeRate: (g.prizeCount / draws.length * 100).toFixed(1),
  })) || [];

  return (
    <Card className="bg-card/80 backdrop-blur border-border overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Rocket className="w-5 h-5 text-primary" />
          Motor de Simulação Massiva v2.0
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary ml-auto">
            BITSET ENGINE
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Gere milhões de jogos, teste contra todo o histórico e descubra padrões com IA
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Jogos a Gerar</label>
            <div className="flex flex-wrap gap-1.5">
              {GAME_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTotalGames(opt.value)}
                  className={`text-xs font-mono px-3 py-1.5 rounded-md border transition-all ${
                    totalGames === opt.value
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Modo de Geração</label>
            <div className="flex flex-wrap gap-1.5">
              {MODE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setMode(opt.id)}
                  className={`text-xs px-3 py-1.5 rounded-md border transition-all ${
                    mode === opt.id
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                  title={opt.desc}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Run button */}
        <Button onClick={runSimulation} disabled={running} className="w-full gap-2" size="lg">
          {running ? (
            <><Zap className="w-4 h-4 animate-pulse" />Simulando {totalGames.toLocaleString()} jogos...</>
          ) : (
            <><Play className="w-4 h-4" />Executar Simulação Massiva ({totalGames.toLocaleString()} jogos)</>
          )}
        </Button>

        {/* Progress */}
        {running && progress && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.phase === "evaluating" ? "Avaliando jogos..." : progress.phase === "filtering" ? "Filtrando top games..." : "Finalizando..."}</span>
              <span className="font-mono">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{progress.gamesGenerated.toLocaleString()} jogos gerados</span>
              <span>{progress.opsPerSecond.toLocaleString()} ops/s</span>
              <span>{(progress.elapsedMs / 1000).toFixed(1)}s</span>
            </div>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground p-3 rounded-lg bg-muted/30 border border-border">
                <Badge variant="default" className="text-[10px]">Completo</Badge>
                <span className="font-mono">{result.totalGenerated.toLocaleString()} jogos</span>
                <span>•</span>
                <span className="font-mono">{result.totalEvaluated.toLocaleString()} comparações</span>
                <span>•</span>
                <span className="font-mono">{(result.elapsedMs / 1000).toFixed(1)}s</span>
                <span>•</span>
                <span className="font-mono text-primary">{result.opsPerSecond.toLocaleString()} ops/s</span>
              </div>

              <Tabs defaultValue="ranking" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-muted/30">
                  <TabsTrigger value="ranking" className="text-xs gap-1"><Trophy className="w-3 h-3" />Ranking</TabsTrigger>
                  <TabsTrigger value="patterns" className="text-xs gap-1"><Target className="w-3 h-3" />Padrões</TabsTrigger>
                  <TabsTrigger value="charts" className="text-xs gap-1"><BarChart3 className="w-3 h-3" />Gráficos</TabsTrigger>
                  <TabsTrigger value="ai" className="text-xs gap-1"><Brain className="w-3 h-3" />IA</TabsTrigger>
                </TabsList>

                {/* Ranking Tab */}
                <TabsContent value="ranking" className="space-y-3 mt-3">
                  <div className="space-y-2">
                    {result.topGames.slice(0, 20).map((g, idx) => (
                      <GameCard key={idx} game={g} rank={idx + 1} config={config} drawCount={draws.length} />
                    ))}
                  </div>
                </TabsContent>

                {/* Patterns Tab */}
                <TabsContent value="patterns" className="space-y-3 mt-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {result.patternInsights.map((p, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border">
                        <div className="flex items-center gap-2 mb-1">
                          {TREND_ICONS[p.trend]}
                          <span className="text-xs font-semibold text-foreground">{p.label}</span>
                        </div>
                        <p className="text-lg font-mono font-bold text-primary">{p.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{p.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Distribution summary */}
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/15">
                    <h4 className="text-xs font-semibold text-foreground mb-2">Resumo Estatístico</h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-mono font-bold text-primary">{result.distributionSummary.bestHitOverall}</p>
                        <p className="text-[10px] text-muted-foreground">Melhor Acerto</p>
                      </div>
                      <div>
                        <p className="text-lg font-mono font-bold text-foreground">{result.distributionSummary.avgPrizeRate}%</p>
                        <p className="text-[10px] text-muted-foreground">Taxa de Premiação</p>
                      </div>
                      <div>
                        <p className="text-lg font-mono font-bold text-foreground">{result.distributionSummary.avgSum}</p>
                        <p className="text-[10px] text-muted-foreground">Soma Média</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Charts Tab */}
                <TabsContent value="charts" className="space-y-4 mt-3">
                  {/* Number frequency bar chart */}
                  {numFreqData.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-2">Frequência das Dezenas nos Top Games</h4>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={numFreqData}>
                            <XAxis dataKey="num" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 8 }} interval={Math.ceil(numFreqData.length / 20)} />
                            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                            <Tooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))", fontSize: 12 }}
                              formatter={(val: any) => [`${val}x`, "Frequência"]}
                            />
                            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                              {numFreqData.map((_, i) => (
                                <Cell key={i} fill={`hsl(var(--primary) / ${0.4 + (numFreqData[i].pct / 100) * 0.6})`} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Radar chart */}
                  {radarData.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-2">Perfil dos Top Games</h4>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                            <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                            <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Scatter: Score vs Avg Hits */}
                  {scatterData.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-2">Score vs Média de Acertos</h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="avgHits" name="Média" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                            <YAxis dataKey="score" name="Score" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                            <Tooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))", fontSize: 12 }}
                            />
                            <Scatter data={scatterData} fill="hsl(var(--primary))" fillOpacity={0.6} />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* AI Tab */}
                <TabsContent value="ai" className="space-y-3 mt-3">
                  {!aiAnalysis ? (
                    <div className="text-center py-8 space-y-3">
                      <Brain className="w-10 h-10 text-primary mx-auto opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Envie os resultados para análise profunda com IA
                      </p>
                      <Button onClick={requestAIAnalysis} disabled={aiLoading} className="gap-2">
                        {aiLoading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />Analisando com IA...</>
                        ) : (
                          <><Sparkles className="w-4 h-4" />Análise IA Profunda</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none p-4 rounded-lg bg-muted/20 border border-border">
                      <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: aiAnalysis
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>')
                            .replace(/#{3}\s(.*)/g, '<h4 class="text-foreground font-semibold mt-3 mb-1 text-sm">$1</h4>')
                            .replace(/#{2}\s(.*)/g, '<h3 class="text-foreground font-bold mt-4 mb-2 text-base">$1</h3>')
                            .replace(/- (.*)/g, '<li class="text-muted-foreground text-xs ml-4">$1</li>')
                        }}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ─── Game Card Component ────────────────────────────────────────

function GameCard({ game, rank, config, drawCount }: {
  game: SimulatedGame; rank: number; config: LotteryConfig; drawCount: number;
}) {
  const prizeRate = (game.prizeCount / drawCount * 100).toFixed(1);
  const medalColors: Record<number, string> = {
    1: "text-yellow-400",
    2: "text-gray-300",
    3: "text-amber-600",
  };

  return (
    <div className="p-3 rounded-lg bg-muted/20 border border-border hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-3">
        <span className={`text-lg font-bold font-mono w-8 text-right shrink-0 ${medalColors[rank] || "text-muted-foreground"}`}>
          #{rank}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1 mb-2">
            {game.numbers.map((n, i) => (
              <span key={i} className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold border border-primary/20">
                {n.toString().padStart(2, "0")}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span>Score: <strong className="text-primary">{game.score}</strong></span>
            <span>Média: <strong className="text-foreground">{game.avgHits}</strong></span>
            <span>Melhor: <strong className="text-foreground">{game.bestHit}/{config.pick}</strong></span>
            <span>Prêmios: <strong className="text-foreground">{prizeRate}%</strong></span>
            <span>P/I: <strong className="text-foreground">{game.evenCount}/{game.oddCount}</strong></span>
            <span>Soma: <strong className="text-foreground">{game.sum}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
