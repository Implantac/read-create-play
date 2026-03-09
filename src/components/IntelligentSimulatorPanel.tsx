import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Brain, Play, Plus, Trash2, Trophy, BarChart3, Sparkles, Loader2, Target, TrendingUp, Bookmark, BookmarkCheck } from "lucide-react";
import { useSavedBets } from "@/hooks/useSavedBets";
import { toast } from "sonner";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";
import {
  SimulationBet, SimulationOutput, BetSimulationResult,
  runSimulation, parseBetsFromText, generateRandomBets, getMinPrizeHits,
} from "@/engine/intelligent-simulator";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

interface Props {
  config: LotteryConfig;
  draws: DrawResult[];
  stats: NumberStats[];
}

const DRAW_OPTIONS = [
  { label: "Últimos 10", value: 10 },
  { label: "Últimos 25", value: 25 },
  { label: "Últimos 50", value: 50 },
  { label: "Últimos 100", value: 100 },
  { label: "Últimos 200", value: 200 },
  { label: "Últimos 500", value: 500 },
  { label: "Todo histórico", value: 99999 },
];

const CHART_COLORS = [
  "hsl(145, 72%, 42%)", "hsl(195, 95%, 48%)", "hsl(48, 100%, 52%)",
  "hsl(265, 75%, 58%)", "hsl(0, 72%, 55%)", "hsl(180, 85%, 48%)",
  "hsl(30, 90%, 55%)", "hsl(320, 70%, 55%)",
];

export function IntelligentSimulatorPanel({ config, draws, stats }: Props) {
  const [bets, setBets] = useState<SimulationBet[]>([]);
  const [textInput, setTextInput] = useState("");
  const [drawCount, setDrawCount] = useState("100");
  const [autoCount, setAutoCount] = useState("3");
  const [simulation, setSimulation] = useState<SimulationOutput | null>(null);
  const [running, setRunning] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const { saveBet } = useSavedBets(config.id);

  // Reset all state when lottery changes
  const prevLotteryId = useRef(config.id);
  useEffect(() => {
    if (prevLotteryId.current !== config.id) {
      prevLotteryId.current = config.id;
      setBets([]);
      setTextInput("");
      setSimulation(null);
      setAiAnalysis("");
    }
  }, [config.id]);

  const minPrize = getMinPrizeHits(config.id);

  const handleParseText = () => {
    if (!textInput.trim()) return;
    const parsed = parseBetsFromText(textInput, config);
    if (parsed.length === 0) {
      toast.error(`Nenhum jogo válido encontrado. Cada linha deve ter exatamente ${config.pick} números de 1 a ${config.numbers}.`);
      return;
    }
    const newBets = [...bets, ...parsed.map((b, i) => ({ ...b, id: bets.length + i + 1 }))];
    setBets(newBets);
    setTextInput("");
    toast.success(`${parsed.length} jogo(s) adicionado(s)`);
  };

  const handleAutoGenerate = () => {
    const count = parseInt(autoCount) || 3;
    const generated = generateRandomBets(count, config);
    const newBets = [...bets, ...generated.map((b, i) => ({ ...b, id: bets.length + i + 1 }))];
    setBets(newBets);
    toast.success(`${count} jogo(s) gerado(s) automaticamente`);
  };

  const removeBet = (id: number) => {
    setBets(prev => prev.filter(b => b.id !== id));
  };

  const clearAll = () => {
    setBets([]);
    setSimulation(null);
    setAiAnalysis("");
  };

  const handleRunSimulation = () => {
    if (bets.length === 0) {
      toast.error("Adicione pelo menos 1 jogo para simular.");
      return;
    }
    if (draws.length === 0) {
      toast.error("Sincronize os sorteios primeiro no Dashboard.");
      return;
    }
    setRunning(true);
    setAiAnalysis("");

    setTimeout(() => {
      try {
        const result = runSimulation(bets, draws, parseInt(drawCount), config.id);
        setSimulation(result);
        toast.success(`Simulação concluída: ${bets.length} jogos × ${result.totalDraws} concursos`);
      } catch (e) {
        toast.error("Erro na simulação");
        console.error(e);
      } finally {
        setRunning(false);
      }
    }, 50);
  };

  const handleAiAnalysis = async () => {
    if (!simulation) return;
    setLoadingAi(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-simulation-analysis", {
        body: {
          simulationData: {
            bets: simulation.bets.map(b => ({
              bet: b.bet,
              bestHit: b.bestHit,
              avgHits: b.avgHits,
              hitDistribution: b.hitDistribution,
              prizeCount: b.prizeCount,
              stability: b.stability,
            })),
            totalDraws: simulation.totalDraws,
            ranking: simulation.ranking,
          },
          lotteryName: config.name,
          lotteryPick: config.pick,
          lotteryNumbers: config.numbers,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiAnalysis(data.analysis || "Análise indisponível.");
    } catch (e: any) {
      toast.error(e.message || "Erro na análise de IA");
    } finally {
      setLoadingAi(false);
    }
  };

  // Chart data for hit distribution
  const chartData = useMemo(() => {
    if (!simulation) return [];
    const allHits = new Set<number>();
    simulation.bets.forEach(b => {
      Object.keys(b.hitDistribution).forEach(k => allHits.add(Number(k)));
    });
    const sorted = [...allHits].sort((a, b) => b - a);
    return sorted.map(hit => {
      const row: any = { acertos: `${hit}` };
      simulation.bets.forEach((b) => {
        row[`Jogo ${b.bet.id}`] = b.hitDistribution[hit] || 0;
      });
      return row;
    });
  }, [simulation]);

  // Timeline data for performance over time
  const timelineData = useMemo(() => {
    if (!simulation || simulation.bets.length === 0) return [];
    const firstBet = simulation.bets[0];
    if (!firstBet.timeline || firstBet.timeline.length === 0) return [];

    return firstBet.timeline.map((pt, idx) => {
      const row: any = { concurso: pt.concurso };
      simulation.bets.forEach(b => {
        row[`Jogo ${b.bet.id}`] = b.timeline[idx]?.hits ?? 0;
      });
      return row;
    });
  }, [simulation]);

  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl text-foreground">Simulador Inteligente de Estratégias</CardTitle>
            <CardDescription>
              Teste jogos contra o histórico de {config.name} e receba análises e sugestões da IA
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Adicionar Jogos
            </h3>
            <Textarea
              placeholder={`Cole seus jogos (um por linha, ${config.pick} números de 1 a ${config.numbers}):\nEx: 01 02 03 04 05 06${config.pick > 6 ? " 07 08 09 10 11 12 13 14 15" : ""}`}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              className="h-28 font-mono text-xs bg-muted/50 border-border"
            />
            <Button onClick={handleParseText} variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Adicionar da lista
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" /> Geração Automática
            </h3>
            <div className="flex gap-2">
              <Input
                type="number" min={1} max={20}
                value={autoCount}
                onChange={e => setAutoCount(e.target.value)}
                className="w-20 bg-muted/50"
              />
              <Button onClick={handleAutoGenerate} variant="outline" size="sm" className="flex-1">
                <Sparkles className="h-4 w-4 mr-2" /> Gerar jogos aleatórios
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Concursos para análise</label>
              <Select value={drawCount} onValueChange={setDrawCount}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DRAW_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label} {opt.value <= draws.length ? "" : `(${draws.length} disponíveis)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRunSimulation}
                disabled={bets.length === 0 || running}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                {running ? "Simulando..." : "Executar Simulação"}
              </Button>
              <Button onClick={clearAll} variant="destructive" size="icon" title="Limpar tudo">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Current bets list */}
        {bets.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Jogos Adicionados ({bets.length})
            </h3>
            <div className="grid gap-2 max-h-40 overflow-y-auto">
              {bets.map(bet => (
                <div key={bet.id} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                  <Badge variant="outline" className="text-xs shrink-0">#{bet.id}</Badge>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {bet.numbers.map(n => (
                      <span key={n} className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary/15 text-primary text-xs font-bold">
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                  <Button onClick={() => removeBet(bet.id)} variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {simulation && (
          <Tabs defaultValue="ranking" className="space-y-4">
            <TabsList className="bg-muted/50 flex-wrap h-auto gap-1">
              <TabsTrigger value="ranking"><Trophy className="h-3.5 w-3.5 mr-1.5" />Ranking</TabsTrigger>
              <TabsTrigger value="chart"><BarChart3 className="h-3.5 w-3.5 mr-1.5" />Gráficos</TabsTrigger>
              <TabsTrigger value="ai"><Brain className="h-3.5 w-3.5 mr-1.5" />Análise IA</TabsTrigger>
            </TabsList>

            {/* Ranking Tab - Clean and Professional */}
            <TabsContent value="ranking" className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {simulation.totalDraws} concursos analisados • Premiação: ≥{minPrize} acertos
                </p>
              </div>

              <div className="space-y-2">
                {simulation.ranking.map((betIdx, rank) => {
                  const b = simulation.bets[betIdx];
                  const medal = rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : null;
                  const prizeRate = simulation.totalDraws > 0 
                    ? ((b.prizeCount / simulation.totalDraws) * 100).toFixed(1) 
                    : "0";

                  return (
                    <div
                      key={b.bet.id}
                      className={`rounded-xl border p-4 transition-all ${
                        rank < 3
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-card/50"
                      }`}
                    >
                      {/* Header: Position + Stats */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold min-w-[2rem] text-center">
                            {medal || <span className="text-muted-foreground text-sm">{rank + 1}º</span>}
                          </span>
                          <div>
                            <span className="text-sm font-semibold text-foreground">Jogo {b.bet.id}</span>
                            {rank === 0 && (
                              <Badge className="ml-2 text-[10px] bg-primary/20 text-primary border-0">
                                Melhor desempenho
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Numbers as lottery balls */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {b.bet.numbers.map(n => (
                          <span
                            key={n}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold border border-primary/20"
                          >
                            {String(n).padStart(2, "0")}
                          </span>
                        ))}
                      </div>

                      {/* Key metrics in a clean grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-muted/40 rounded-lg px-3 py-2 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Melhor Acerto</p>
                          <p className="text-xl font-bold text-primary">{b.bestHit}</p>
                          <p className="text-[10px] text-muted-foreground">de {config.pick}</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg px-3 py-2 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Média</p>
                          <p className="text-xl font-bold text-foreground">{b.avgHits}</p>
                          <p className="text-[10px] text-muted-foreground">acertos/jogo</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg px-3 py-2 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Premiações</p>
                          <p className="text-xl font-bold text-accent">{b.prizeCount}</p>
                          <p className="text-[10px] text-muted-foreground">{prizeRate}% dos sorteios</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg px-3 py-2 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Estabilidade</p>
                          <p className="text-xl font-bold text-foreground">σ {b.stability}</p>
                          <p className="text-[10px] text-muted-foreground">{b.stability < 1.5 ? "Consistente" : b.stability < 2.5 ? "Moderado" : "Variável"}</p>
                        </div>
                      </div>

                      {/* Hit distribution as a compact bar */}
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Distribuição de Acertos</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(b.hitDistribution)
                            .sort((a, b) => Number(b[0]) - Number(a[0]))
                            .map(([hits, count]) => {
                              const isPrize = Number(hits) >= minPrize;
                              return (
                                <div
                                  key={hits}
                                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-mono ${
                                    isPrize
                                      ? "bg-primary/20 text-primary font-bold border border-primary/30"
                                      : "bg-muted/50 text-muted-foreground"
                                  }`}
                                >
                                  <span>{hits} ac</span>
                                  <span className="text-[10px] opacity-70">×{count as number}</span>
                                  {isPrize && <Trophy className="h-2.5 w-2.5" />}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Charts Tab */}
            <TabsContent value="chart" className="space-y-6">
              {chartData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Distribuição de Acertos</h4>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="acertos" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} label={{ value: "Acertos", position: "insideBottom", offset: -5, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                        <Legend />
                        {simulation!.bets.map((b, i) => (
                          <Bar key={b.bet.id} dataKey={`Jogo ${b.bet.id}`} fill={CHART_COLORS[i % CHART_COLORS.length]} opacity={0.8} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {timelineData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Desempenho ao Longo do Tempo</h4>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="concurso" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} label={{ value: "Acertos", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                        <Legend />
                        {simulation!.bets.map((b, i) => (
                          <Line key={b.bet.id} type="monotone" dataKey={`Jogo ${b.bet.id}`} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* AI Tab */}
            <TabsContent value="ai" className="space-y-3">
              {!aiAnalysis && (
                <div className="text-center py-8 space-y-3">
                  <Brain className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    A IA analisará seus resultados e sugerirá melhorias nos jogos
                  </p>
                  <Button onClick={handleAiAnalysis} disabled={loadingAi} className="bg-primary text-primary-foreground">
                    {loadingAi ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando...</>
                    ) : (
                      <><Brain className="h-4 w-4 mr-2" /> Gerar Análise com IA</>
                    )}
                  </Button>
                </div>
              )}
              {aiAnalysis && (
                <div className="prose prose-sm prose-invert max-w-none">
                  <div className="bg-muted/30 rounded-lg p-4 border border-primary/10 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {aiAnalysis.split("\n").map((line, i) => {
                      if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-bold text-primary mt-4 mb-2">{line.replace("## ", "")}</h2>;
                      if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold text-accent mt-3 mb-1">{line.replace("### ", "")}</h3>;
                      if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-bold text-foreground">{line.replace(/\*\*/g, "")}</p>;
                      if (line.startsWith("- ") || line.startsWith("* ")) return <p key={i} className="ml-3 text-muted-foreground">• {line.slice(2)}</p>;
                      if (line.trim() === "") return <br key={i} />;
                      return <p key={i} className="text-muted-foreground">{line}</p>;
                    })}
                  </div>
                  <Button onClick={handleAiAnalysis} variant="outline" size="sm" className="mt-3" disabled={loadingAi}>
                    {loadingAi ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Brain className="h-3 w-3 mr-1" />}
                    Regenerar análise
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
