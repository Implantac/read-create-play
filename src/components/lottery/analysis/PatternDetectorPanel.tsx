import { useState, useMemo, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Search, Brain, Loader2, TrendingUp, TrendingDown, BarChart3, Zap, Target,
  GitBranch, Layers, RefreshCw, AlertTriangle, Sparkles, ArrowRight, Clock, Hash,
} from "lucide-react";
import { toast } from "sonner";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "@/engine/stats/statistics";
import { detectPatterns, PatternReport } from "@/engine/ai/pattern-detector";
import { generatePatternAnalysis } from "@/engine/ai/native-analysis";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, LineChart, Line,
} from "recharts";

interface Props {
  config: LotteryConfig;
  draws: DrawResult[];
  stats: NumberStats[];
}

const DRAW_OPTIONS = [
  { label: "Últimos 50", value: 50 },
  { label: "Últimos 100", value: 100 },
  { label: "Últimos 200", value: 200 },
  { label: "Últimos 500", value: 500 },
  { label: "Todo histórico", value: 99999 },
];

const PIE_COLORS = ["hsl(145, 72%, 42%)", "hsl(195, 95%, 48%)", "hsl(48, 100%, 52%)", "hsl(265, 75%, 58%)", "hsl(0, 72%, 55%)", "hsl(180, 85%, 48%)", "hsl(30, 90%, 55%)", "hsl(320, 70%, 55%)"];

export function PatternDetectorPanel({ config, draws, stats }: Props) {
  const [drawCount, setDrawCount] = useState("200");
  const [report, setReport] = useState<PatternReport | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const prevId = useRef(config.id);
  useEffect(() => {
    if (prevId.current !== config.id) {
      prevId.current = config.id;
      setReport(null);
      setAiAnalysis("");
    }
  }, [config.id]);

  const handleDetect = () => {
    setDetecting(true);
    setAiAnalysis("");
    setTimeout(() => {
      try {
        const result = detectPatterns(draws, stats, config, parseInt(drawCount));
        setReport(result);
        toast.success("Padrões detectados com sucesso!");
      } catch (e) {
        toast.error("Erro na detecção de padrões");
        console.error(e);
      } finally {
        setDetecting(false);
      }
    }, 50);
  };

  const handleAiAnalysis = async () => {
    if (!report) return;
    setLoadingAi(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("ai-pattern-analysis", {
        body: {
          patternReport: report,
          lotteryName: config.name,
          lotteryPick: config.pick,
          lotteryNumbers: config.numbers,
          drawCount: parseInt(drawCount),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const analysis = (data?.analysis ?? data?.text) as string | undefined;
      if (!analysis) throw new Error("Resposta vazia da IA");
      setAiAnalysis(analysis);
      toast.success(data?.fromCache ? "IA (cache)" : "Análise real concluída");
    } catch (e: any) {
      const analysis = generatePatternAnalysis(report as any, config, parseInt(drawCount));
      setAiAnalysis(analysis);
      toast.error(`IA indisponível: ${e?.message || "fallback local"}`);
    } finally {
      setLoadingAi(false);
    }
  };

  const parityChartData = useMemo(() => {
    if (!report) return [];
    return report.parityPatterns.slice(0, 6).map(p => ({
      name: `${p.evens}P/${p.odds}I`, value: p.count, percentage: p.percentage,
    }));
  }, [report]);

  const sumChartData = useMemo(() => {
    if (!report) return [];
    return report.sumPatterns.map(s => ({ faixa: s.rangeLabel, concursos: s.count, percentual: s.percentage }));
  }, [report]);

  const spatialRadarData = useMemo(() => {
    if (!report) return [];
    return report.spatialDistribution.sectors.map(s => ({
      setor: s.label, media: s.avgCount,
      fullMark: Math.ceil(config.pick / report.spatialDistribution.sectors.length * 2),
    }));
  }, [report, config.pick]);

  const transitionChartData = useMemo(() => {
    if (!report) return [];
    return report.transitionAnalysis.repeatDistribution.map(r => ({
      repeats: `${r.repeats} repet.`, count: r.count, percentage: r.percentage,
    }));
  }, [report]);

  const momentumChartData = useMemo(() => {
    if (!report) return [];
    return report.frequencyTrends.slice(0, 20).map(f => ({
      name: String(f.number).padStart(2, "0"),
      momentum: f.momentum,
      score: f.score,
      fill: f.momentum > 0 ? "hsl(145, 72%, 42%)" : "hsl(0, 72%, 55%)",
    }));
  }, [report]);

  const cycleScatterData = useMemo(() => {
    if (!report) return [];
    return report.cycleDetection.slice(0, 25).map(c => ({
      name: String(c.number).padStart(2, "0"),
      x: c.avgCycleLength,
      y: c.currentDelay,
      z: c.confidence * 100,
      status: c.status,
    }));
  }, [report]);

  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl text-foreground">Detector de Padrões v2.1</CardTitle>
            <CardDescription>
              Ciclos, transições, coocorrência, primos, Fibonacci e clusterização
            </CardDescription>
          </div>
          {report && (
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-muted-foreground">Score Geral</p>
                <p className="text-lg font-bold text-primary">{report.summary.overallScore}%</p>
              </div>
            </div>
          )}
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary hidden sm:inline-flex">
            DEEP ANALYSIS
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Controls */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Concursos para análise</label>
            <Select value={drawCount} onValueChange={setDrawCount}>
              <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DRAW_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleDetect} disabled={detecting || draws.length === 0} className="bg-primary text-primary-foreground">
            {detecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Detectar Padrões
          </Button>
        </div>

        {report && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-muted/50 flex-wrap h-auto gap-1">
              <TabsTrigger value="overview" className="text-xs"><Zap className="h-3 w-3 mr-1" />Resumo</TabsTrigger>
              <TabsTrigger value="charts" className="text-xs"><BarChart3 className="h-3 w-3 mr-1" />Gráficos</TabsTrigger>
              <TabsTrigger value="trends" className="text-xs"><TrendingUp className="h-3 w-3 mr-1" />Tendências</TabsTrigger>
              <TabsTrigger value="transitions" className="text-xs"><RefreshCw className="h-3 w-3 mr-1" />Transições</TabsTrigger>
              <TabsTrigger value="clusters" className="text-xs"><Layers className="h-3 w-3 mr-1" />Clusters</TabsTrigger>
              <TabsTrigger value="cycles" className="text-xs"><GitBranch className="h-3 w-3 mr-1" />Ciclos</TabsTrigger>
              <TabsTrigger value="rare" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Raros</TabsTrigger>
              <TabsTrigger value="ai" className="text-xs"><Brain className="h-3 w-3 mr-1" />IA</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-4">
              {/* Score bar */}
              <div className="bg-muted/20 rounded-lg p-4 border border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Qualidade da Análise
                  </span>
                  <span className="text-sm font-bold text-primary">{report.summary.overallScore}/100</span>
                </div>
                <Progress value={report.summary.overallScore} className="h-2" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Baseado na quantidade de dados, regularidade de ciclos, clusters e equilíbrio espacial
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Paridade dominante", value: report.summary.mostCommonParity, sub: `Desvio: ${report.summary.parityDeviation}%` },
                  { label: "Soma média", value: report.summary.avgSum, sub: `Mediana: ${report.summary.medianSum}` },
                  { label: "Consecutivos médios", value: report.summary.avgConsecutives },
                  { label: "Equilíbrio espacial", value: `${report.spatialDistribution.balance}%`, primary: true },
                ].map((item, i) => (
                  <div key={i} className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className={`text-lg font-bold ${item.primary ? "text-primary" : "text-foreground"}`}>{item.value}</p>
                    {item.sub && <p className="text-[10px] text-muted-foreground">{item.sub}</p>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Repetições médias</p>
                  <p className="text-lg font-bold text-primary">{report.summary.avgRepeatsBetweenDraws}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Clusters</p>
                  <p className="text-lg font-bold text-foreground">{report.numberClusters.length}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Padrões raros</p>
                  <p className="text-lg font-bold text-foreground">{report.rarePatterns.length}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Coocorrências</p>
                  <p className="text-lg font-bold text-foreground">{report.cooccurrenceMatrix.length}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">% Primos</p>
                  <p className="text-lg font-bold text-foreground">{report.summary.primeRatio}%</p>
                </div>
              </div>

              {/* Trending numbers */}
              <div className="grid sm:grid-cols-2 gap-4">
                <NumberBadgeGrid title="Em Alta" icon={<TrendingUp className="h-4 w-4 text-green-400" />} numbers={report.summary.trendingUp} colorClass="bg-green-500/15 text-green-400" />
                <NumberBadgeGrid title="Em Queda" icon={<TrendingDown className="h-4 w-4 text-red-400" />} numbers={report.summary.trendingDown} colorClass="bg-red-500/15 text-red-400" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <NumberBadgeGrid title="Mais Consistentes" icon={<Target className="h-4 w-4 text-primary" />} numbers={report.summary.mostConsistent} colorClass="bg-primary/15 text-primary" />
                <NumberBadgeGrid title="Atrasadas (Overdue)" icon={<Clock className="h-4 w-4 text-yellow-400" />} numbers={report.summary.overdueNumbers} colorClass="bg-yellow-500/15 text-yellow-400" />
              </div>

              {report.hotStreaks.length > 0 && (
                <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                  <h4 className="text-sm font-semibold text-foreground mb-2">🔥 Maiores Sequências Quentes</h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {report.hotStreaks.slice(0, 8).map((h, i) => (
                      <Badge key={i} variant="outline" className="border-orange-400/30 text-orange-400">
                        Nº {String(h.number).padStart(2, "0")}: {h.streakLength}x seguidos
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Charts */}
            <TabsContent value="charts" className="space-y-5">
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Distribuição Par/Ímpar</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={parityChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} label={({ name, percentage }) => `${name} ${percentage}%`}>
                          {parityChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Distribuição de Soma</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sumChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="faixa" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                        <Bar dataKey="concursos" fill="hsl(195, 95%, 48%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Momentum chart */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Momentum das Top 20 Dezenas
                </h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={momentumChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                        formatter={(value: number, name: string) => [value, name === "momentum" ? "Momentum" : "Score"]}
                      />
                      <Bar dataKey="momentum" radius={[4, 4, 0, 0]}>
                        {momentumChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Distribuição Espacial (Radar)</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={spatialRadarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="setor" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                        <Radar name="Média" dataKey="media" stroke="hsl(145, 72%, 42%)" fill="hsl(145, 72%, 42%)" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Padrão de Consecutivos</h4>
                  <div className="flex flex-wrap gap-3">
                    {report.consecutivePatterns.map(c => (
                      <div key={c.consecutiveCount} className="bg-muted/30 rounded-lg p-3 text-center min-w-[100px]">
                        <p className="text-xs text-muted-foreground">{c.consecutiveCount} consec.</p>
                        <p className="text-lg font-bold text-foreground">{c.occurrences}x</p>
                        <p className="text-xs text-muted-foreground">{c.percentage}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Trends with score */}
            <TabsContent value="trends" className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left p-2">Nº</th>
                      <th className="text-center p-2">Últ. 10</th>
                      <th className="text-center p-2">Últ. 30</th>
                      <th className="text-center p-2">Últ. 100</th>
                      <th className="text-center p-2">Total</th>
                      <th className="text-center p-2">Tendência</th>
                      <th className="text-center p-2">Momentum</th>
                      <th className="text-center p-2">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.frequencyTrends.slice(0, 30).map(f => (
                      <tr key={f.number} className="border-b border-border/30">
                        <td className="p-2 font-bold text-foreground">{String(f.number).padStart(2, "0")}</td>
                        <td className="p-2 text-center font-mono">{f.last10Freq}</td>
                        <td className="p-2 text-center font-mono">{f.last30Freq}</td>
                        <td className="p-2 text-center font-mono">{f.last100Freq}</td>
                        <td className="p-2 text-center font-mono text-muted-foreground">{f.totalFreq}</td>
                        <td className="p-2 text-center">
                          <Badge variant="outline" className={`text-[10px] ${
                            f.trendDirection === "up" ? "text-green-400 border-green-400/30" :
                            f.trendDirection === "down" ? "text-red-400 border-red-400/30" :
                            "text-muted-foreground"
                          }`}>
                            {f.trendDirection === "up" ? "↑ Alta" : f.trendDirection === "down" ? "↓ Queda" : "→ Estável"}
                          </Badge>
                        </td>
                        <td className={`p-2 text-center font-mono font-bold ${f.momentum > 0 ? "text-green-400" : f.momentum < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                          {f.momentum > 0 ? "+" : ""}{f.momentum}
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-10 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${f.score}%`,
                                  backgroundColor: f.score > 70 ? "hsl(145, 72%, 42%)" : f.score > 40 ? "hsl(48, 100%, 52%)" : "hsl(0, 72%, 55%)",
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground w-6">{f.score}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Transitions Tab */}
            <TabsContent value="transitions" className="space-y-4">
              <div className="bg-muted/20 rounded-lg p-4 border border-border/30">
                <h4 className="text-sm font-semibold text-foreground mb-1">Análise de Transição entre Concursos</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Em média, <strong className="text-primary">{report.transitionAnalysis.avgRepeatBetweenDraws}</strong> números se repetem de um concurso para o seguinte.
                </p>
              </div>

              {transitionChartData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Distribuição de Repetições</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={transitionChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="repeats" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {report.transitionAnalysis.mostRepeatedPairs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Dezenas que Mais se Repetem entre Concursos</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.transitionAnalysis.mostRepeatedPairs.map((p, i) => (
                      <Badge key={i} variant="outline" className="border-primary/30 text-primary">
                        {String(p.from).padStart(2, "0")} — {p.count}x
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Transition matrix */}
              {report.transitionAnalysis.transitionMatrix.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-primary" /> Padrões de Substituição (A sai → B entra)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {report.transitionAnalysis.transitionMatrix.slice(0, 12).map((t, i) => (
                      <div key={i} className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2 border border-border/20">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-red-500/15 text-red-400 text-xs font-bold">
                          {String(t.numberA).padStart(2, "0")}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-green-500/15 text-green-400 text-xs font-bold">
                          {String(t.numberB).padStart(2, "0")}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{t.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Clusters Tab */}
            <TabsContent value="clusters" className="space-y-4">
              {report.numberClusters.length > 0 ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Grupos de dezenas que aparecem juntas com frequência acima do esperado (Lift &gt; 1.0)
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {report.numberClusters.map(cl => (
                      <div key={cl.id} className="bg-muted/20 rounded-lg p-3 border border-border/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Layers className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold text-foreground">Cluster #{cl.id + 1}</span>
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary ml-auto">
                            Lift: {cl.avgCooccurrence}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {cl.numbers.map(n => (
                            <span key={n} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary/15 text-primary text-xs font-bold">
                              {String(n).padStart(2, "0")}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2">
                          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${cl.strength * 100}%` }} />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">Força: {(cl.strength * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Top Coocorrências (Lift mais alto)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground">
                            <th className="text-left p-2">Par</th>
                            <th className="text-center p-2">Juntos</th>
                            <th className="text-center p-2">Lift</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.cooccurrenceMatrix.slice(0, 15).map((co, i) => (
                            <tr key={i} className="border-b border-border/30">
                              <td className="p-2 font-bold text-foreground">
                                {String(co.numA).padStart(2, "0")} + {String(co.numB).padStart(2, "0")}
                              </td>
                              <td className="p-2 text-center font-mono">{co.count}x</td>
                              <td className={`p-2 text-center font-mono font-bold ${co.lift > 1.2 ? "text-primary" : co.lift > 1 ? "text-foreground" : "text-muted-foreground"}`}>
                                {co.lift}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum cluster significativo detectado neste período.</p>
              )}
            </TabsContent>

            {/* Cycles Tab with scatter plot */}
            <TabsContent value="cycles" className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Análise de ciclos de aparição — previsão de retorno baseada na regularidade histórica
              </p>

              {/* Cycle scatter visualization */}
              {cycleScatterData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Mapa de Ciclos (Ciclo Médio vs Atraso Atual)</h4>
                  <p className="text-[10px] text-muted-foreground">Acima da diagonal = overdue | Tamanho = confiança</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="x" name="Ciclo Médio" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} label={{ value: "Ciclo Médio", position: "bottom", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis dataKey="y" name="Atraso Atual" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} label={{ value: "Atraso", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <ZAxis dataKey="z" range={[30, 200]} />
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                          formatter={(value: number, name: string) => {
                            if (name === "Ciclo Médio") return [`${value} sorteios`, name];
                            if (name === "Atraso Atual") return [`${value} sorteios`, name];
                            return [value, name];
                          }}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.name ? `Nº ${payload[0].payload.name}` : ""}
                        />
                        <Scatter data={cycleScatterData} fill="hsl(var(--primary))">
                          {cycleScatterData.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={
                                entry.status === "overdue" ? "hsl(0, 72%, 55%)" :
                                entry.status === "due" ? "hsl(48, 100%, 52%)" :
                                "hsl(145, 72%, 42%)"
                              }
                            />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left p-2">Nº</th>
                      <th className="text-center p-2">Ciclo Médio</th>
                      <th className="text-center p-2">Mediana</th>
                      <th className="text-center p-2">Atraso</th>
                      <th className="text-center p-2">Status</th>
                      <th className="text-center p-2">Retorno Prev.</th>
                      <th className="text-center p-2">Regularidade</th>
                      <th className="text-center p-2">Confiança</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.cycleDetection.slice(0, 25).map(c => (
                      <tr key={c.number} className="border-b border-border/30">
                        <td className="p-2 font-bold text-foreground">{String(c.number).padStart(2, "0")}</td>
                        <td className="p-2 text-center font-mono">{c.avgCycleLength}</td>
                        <td className="p-2 text-center font-mono text-muted-foreground">{c.medianCycleLength}</td>
                        <td className={`p-2 text-center font-mono ${c.currentDelay > c.avgCycleLength ? "text-yellow-400" : "text-foreground"}`}>
                          {c.currentDelay}
                        </td>
                        <td className="p-2 text-center">
                          <Badge variant="outline" className={`text-[10px] ${
                            c.status === "overdue" ? "text-red-400 border-red-400/30" :
                            c.status === "due" ? "text-yellow-400 border-yellow-400/30" :
                            c.status === "early" ? "text-muted-foreground" :
                            "text-green-400 border-green-400/30"
                          }`}>
                            {c.status === "overdue" ? "⚠️ Atrasada" :
                             c.status === "due" ? "🔔 Esperada" :
                             c.status === "early" ? "⏳ Cedo" :
                             "✅ No prazo"}
                          </Badge>
                        </td>
                        <td className={`p-2 text-center font-mono font-bold ${c.predictedReturn <= 2 ? "text-primary" : "text-foreground"}`}>
                          {c.predictedReturn === 0 ? "Agora!" : `~${c.predictedReturn}`}
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-12 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${c.cycleRegularity * 100}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{(c.cycleRegularity * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className={`p-2 text-center font-mono ${c.confidence > 0.5 ? "text-primary" : "text-muted-foreground"}`}>
                          {(c.confidence * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Rare Patterns Tab */}
            <TabsContent value="rare" className="space-y-3">
              {report.rarePatterns.length > 0 ? (
                <div className="space-y-3">
                  {report.rarePatterns.map((r, i) => (
                    <div key={i} className="bg-muted/20 rounded-lg p-3 border border-border/30">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={`h-4 w-4 ${r.rarity > 0.99 ? "text-red-400" : r.rarity > 0.95 ? "text-yellow-400" : "text-muted-foreground"}`} />
                        <span className="text-xs font-semibold text-foreground capitalize">
                          {r.type === "extreme_parity" ? "Paridade Extrema" :
                           r.type === "extreme_sum" ? "Soma Extrema" :
                           r.type === "long_consecutive" ? "Consecutivos Longos" :
                           r.type === "decade_concentration" ? "Concentração por Dezena" :
                           r.type === "zero_repeat" ? "Zero Repetição" :
                           r.type === "prime_concentration" ? "Concentração de Primos" :
                           r.type === "fibonacci_concentration" ? "Números Fibonacci" :
                           r.type.replace(/_/g, " ")}
                        </span>
                        <Badge variant="outline" className={`text-[10px] ml-auto ${
                          r.rarity > 0.99 ? "border-red-400/30 text-red-400" :
                          r.rarity > 0.95 ? "border-yellow-400/30 text-yellow-400" :
                          ""
                        }`}>
                          Raridade: {(r.rarity * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{r.description}</p>
                      <div className="flex gap-4 mt-1 text-[10px] text-muted-foreground">
                        <span>Ocorrências: <strong className="text-foreground">{r.occurrences}</strong></span>
                        {r.lastSeen > 0 && <span>Último: <strong className="text-foreground">Concurso {r.lastSeen}</strong></span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum padrão raro detectado.</p>
              )}
            </TabsContent>

            {/* AI Analysis */}
            <TabsContent value="ai" className="space-y-3">
              {!aiAnalysis && (
                <div className="text-center py-8 space-y-3">
                  <Brain className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Envie os padrões para análise profunda com IA</p>
                  <Button onClick={handleAiAnalysis} disabled={loadingAi} className="gap-2">
                    {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                    {loadingAi ? "Analisando..." : "Análise IA dos Padrões"}
                  </Button>
                </div>
              )}
              {aiAnalysis && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleAiAnalysis} disabled={loadingAi} className="text-xs gap-1">
                      {loadingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Reanalisar
                    </Button>
                  </div>
                  <div className="prose prose-sm prose-invert max-w-none p-4 rounded-lg bg-muted/20 border border-border">
                    <div
                      className="text-sm text-foreground whitespace-pre-wrap leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          aiAnalysis
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>')
                            .replace(/#{3}\s(.*)/g, '<h4 class="text-foreground font-semibold mt-3 mb-1 text-sm">$1</h4>')
                            .replace(/#{2}\s(.*)/g, '<h3 class="text-foreground font-bold mt-4 mb-2 text-base">$1</h3>')
                            .replace(/- (.*)/g, '<li class="text-muted-foreground text-xs ml-4">$1</li>'),
                          { ALLOWED_TAGS: ['strong', 'h3', 'h4', 'li', 'ul', 'ol', 'br', 'p', 'em'], ALLOWED_ATTR: ['class'] }
                        ),
                      }}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

function NumberBadgeGrid({ title, icon, numbers, colorClass }: {
  title: string; icon: React.ReactNode; numbers: number[]; colorClass: string;
}) {
  return (
    <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
        {icon} {title}
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {numbers.map(n => (
          <span key={n} className={`inline-flex items-center justify-center w-8 h-8 rounded-md ${colorClass} text-xs font-bold`}>
            {String(n).padStart(2, "0")}
          </span>
        ))}
        {numbers.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma</span>}
      </div>
    </div>
  );
}
