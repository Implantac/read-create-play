import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Brain, Loader2, TrendingUp, TrendingDown, BarChart3, Zap, Target } from "lucide-react";
import { toast } from "sonner";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";
import { detectPatterns, PatternReport } from "@/engine/pattern-detector";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
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
      setAiAnalysis(data.analysis || "Análise indisponível.");
    } catch (e: any) {
      toast.error(e.message || "Erro na análise de IA");
    } finally {
      setLoadingAi(false);
    }
  };

  const parityChartData = useMemo(() => {
    if (!report) return [];
    return report.parityPatterns.slice(0, 6).map(p => ({
      name: `${p.evens}P/${p.odds}I`,
      value: p.count,
      percentage: p.percentage,
    }));
  }, [report]);

  const sumChartData = useMemo(() => {
    if (!report) return [];
    return report.sumPatterns.map(s => ({
      faixa: s.rangeLabel,
      concursos: s.count,
      percentual: s.percentage,
    }));
  }, [report]);

  const spatialRadarData = useMemo(() => {
    if (!report) return [];
    return report.spatialDistribution.sectors.map(s => ({
      setor: s.label,
      media: s.avgCount,
      fullMark: Math.ceil(config.pick / report.spatialDistribution.sectors.length * 2),
    }));
  }, [report, config.pick]);

  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl text-foreground">Detector de Padrões Estatísticos</CardTitle>
            <CardDescription>
              IA analisa o histórico de {config.name} e identifica padrões relevantes
            </CardDescription>
          </div>
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
              <TabsTrigger value="overview"><Zap className="h-3.5 w-3.5 mr-1.5" />Resumo</TabsTrigger>
              <TabsTrigger value="charts"><BarChart3 className="h-3.5 w-3.5 mr-1.5" />Gráficos</TabsTrigger>
              <TabsTrigger value="trends"><TrendingUp className="h-3.5 w-3.5 mr-1.5" />Tendências</TabsTrigger>
              <TabsTrigger value="ai"><Brain className="h-3.5 w-3.5 mr-1.5" />Análise IA</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Paridade dominante</p>
                  <p className="text-lg font-bold text-foreground">{report.summary.mostCommonParity}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Soma média</p>
                  <p className="text-lg font-bold text-foreground">{report.summary.avgSum}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Consecutivos médios</p>
                  <p className="text-lg font-bold text-foreground">{report.summary.avgConsecutives}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Equilíbrio espacial</p>
                  <p className="text-lg font-bold text-primary">{report.spatialDistribution.balance}%</p>
                </div>
              </div>

              {/* Trending numbers */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-400" /> Em Alta
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {report.summary.trendingUp.map(n => (
                      <span key={n} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-green-500/15 text-green-400 text-xs font-bold">
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-red-400" /> Em Queda
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {report.summary.trendingDown.map(n => (
                      <span key={n} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-500/15 text-red-400 text-xs font-bold">
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" /> Mais Consistentes
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {report.summary.mostConsistent.map(n => (
                      <span key={n} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary/15 text-primary text-xs font-bold">
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-muted/20 rounded-lg p-3 border border-border/30">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-yellow-400" /> Atrasadas (Overdue)
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {report.summary.overdueNumbers.map(n => (
                      <span key={n} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-yellow-500/15 text-yellow-400 text-xs font-bold">
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hot streaks */}
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
                {/* Parity pie */}
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

                {/* Sum distribution */}
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

              {/* Spatial radar */}
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

              {/* Consecutive patterns */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Padrão de Consecutivos</h4>
                <div className="flex flex-wrap gap-3">
                  {report.consecutivePatterns.map(c => (
                    <div key={c.consecutiveCount} className="bg-muted/30 rounded-lg p-3 text-center min-w-[100px]">
                      <p className="text-xs text-muted-foreground">{c.consecutiveCount} consecutivos</p>
                      <p className="text-lg font-bold text-foreground">{c.occurrences}x</p>
                      <p className="text-xs text-muted-foreground">{c.percentage}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Trends */}
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
                    </tr>
                  </thead>
                  <tbody>
                    {report.frequencyTrends.slice(0, 20).map(f => (
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
                        <td className={`p-2 text-center font-mono font-bold ${
                          f.momentum > 0 ? "text-green-400" : f.momentum < 0 ? "text-red-400" : "text-muted-foreground"
                        }`}>
                          {f.momentum > 0 ? "+" : ""}{f.momentum}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* AI Analysis */}
            <TabsContent value="ai" className="space-y-3">
              {!aiAnalysis && (
                <div className="text-center py-8 space-y-3">
                  <Brain className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    A IA interpretará os padrões detectados e sugerirá estratégias
                  </p>
                  <Button onClick={handleAiAnalysis} disabled={loadingAi} className="bg-primary text-primary-foreground">
                    {loadingAi ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando padrões...</>
                    ) : (
                      <><Brain className="h-4 w-4 mr-2" /> Gerar Análise Inteligente</>
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
