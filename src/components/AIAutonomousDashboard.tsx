import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";
import { runAutonomousAnalysis, AutonomousAIReport } from "@/engine/autonomous-ai";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Brain, TrendingUp, TrendingDown, Zap, Target, BarChart3,
  RefreshCw, Sparkles, AlertTriangle, CheckCircle, ArrowUp, ArrowDown, Minus,
  Loader2, Activity, Layers, Trophy
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, LineChart, Line, Legend, ScatterChart, Scatter
} from "recharts";

interface Props {
  config: LotteryConfig;
  draws: DrawResult[];
  stats: NumberStats[];
}

export function AIAutonomousDashboard({ config, draws, stats }: Props) {
  const [report, setReport] = useState<AutonomousAIReport | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();

  // Auto-run analysis when data changes
  useEffect(() => {
    if (draws.length > 0 && stats.length > 0) {
      const result = runAutonomousAnalysis(draws, stats, config);
      setReport(result);
      setAiAnalysis(null);
    }
  }, [draws, stats, config]);

  const runAIAnalysis = async () => {
    if (!report) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-autonomous-learning", {
        body: {
          report,
          lotteryName: config.name,
          pick: config.pick,
          totalNumbers: config.numbers,
        },
      });
      if (error) throw error;
      setAiAnalysis(data.analysis);
      toast({ title: "IA Autônoma", description: "Análise concluída com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const refreshAnalysis = () => {
    if (draws.length > 0 && stats.length > 0) {
      setLoading(true);
      setTimeout(() => {
        const result = runAutonomousAnalysis(draws, stats, config);
        setReport(result);
        setAiAnalysis(null);
        setLoading(false);
        toast({ title: "Atualizado", description: "Análise recalculada com sucesso." });
      }, 500);
    }
  };

  if (!report) {
    return (
      <Card className="border-primary/20">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Brain className="mx-auto h-12 w-12 mb-4 opacity-30" />
          <p>Carregando análise autônoma...</p>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(142, 76%, 36%)", "hsl(45, 93%, 47%)", "hsl(0, 84%, 60%)"];

  const topRankings = report.rankings.slice(0, 20);
  const rankingChartData = topRankings.map(r => ({
    name: `${r.number}`,
    score: r.compositeScore,
    freq: r.frequencyScore,
    trend: r.trendScore,
    cycle: r.cycleScore,
  }));

  const parityData = [
    { name: "Pares", value: report.parityProfile.even },
    { name: "Ímpares", value: report.parityProfile.odd },
  ];

  const radarData = report.spatialDistribution.map(z => ({
    zone: z.zone,
    real: z.actual,
    esperado: z.expected,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-background to-accent/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">IA Autônoma — {config.name}</CardTitle>
                <CardDescription>
                  Aprendizado contínuo · {report.drawsAnalyzed} concursos analisados · Atualizado: {new Date(report.lastUpdated).toLocaleString("pt-BR")}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refreshAnalysis} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Recalcular
              </Button>
              <Button size="sm" onClick={runAIAnalysis} disabled={aiLoading} className="gap-2">
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Análise IA Profunda
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/15">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Dezenas Fortes</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {report.rankings.filter(r => r.classification === "forte").length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-accent/15">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Em Tendência</span>
            </div>
            <p className="text-2xl font-bold text-accent">
              {report.rankings.filter(r => r.trend === "subindo").length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-destructive/15">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Mudanças Detectadas</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{report.shifts.length}</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/15">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Padrões</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{report.patterns.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Suggested Numbers */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Jogo Sugerido pela IA ({config.pick} dezenas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            {report.suggestedNumbers.map(n => (
              <span key={n} className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/15 text-primary font-bold text-sm border border-primary/30">
                {String(n).padStart(2, "0")}
              </span>
            ))}
          </div>
          {report.avoidNumbers.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Dezenas para evitar:
              </p>
              <div className="flex flex-wrap gap-2">
                {report.avoidNumbers.map(n => (
                  <span key={n} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10 text-destructive font-mono text-xs border border-destructive/20">
                    {String(n).padStart(2, "0")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="patterns">Padrões</TabsTrigger>
          <TabsTrigger value="strategies">Estratégias</TabsTrigger>
          <TabsTrigger value="shifts">Mudanças</TabsTrigger>
          <TabsTrigger value="ai">Análise IA</TabsTrigger>
        </TabsList>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ranking Probabilístico — Top 20</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={rankingChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Legend />
                  <Bar dataKey="score" name="Score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="freq" name="Frequência" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="trend" name="Tendência" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Full ranking table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ranking Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2">#</th>
                      <th className="text-left py-2 px-2">Nº</th>
                      <th className="text-center py-2 px-2">Score</th>
                      <th className="text-center py-2 px-2">Freq</th>
                      <th className="text-center py-2 px-2">Recência</th>
                      <th className="text-center py-2 px-2">Tendência</th>
                      <th className="text-center py-2 px-2">Class.</th>
                      <th className="text-center py-2 px-2">Dir.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rankings.slice(0, 40).map(r => (
                      <tr key={r.number} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-1.5 px-2 font-mono text-muted-foreground">{r.rank}</td>
                        <td className="py-1.5 px-2 font-bold">{String(r.number).padStart(2, "0")}</td>
                        <td className="py-1.5 px-2 text-center">
                          <div className="flex items-center gap-1">
                            <Progress value={r.compositeScore} className="h-1.5 flex-1" />
                            <span className="font-mono w-8 text-right">{r.compositeScore}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono">{r.frequencyScore}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{r.recencyScore}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{r.trendScore}</td>
                        <td className="py-1.5 px-2 text-center">
                          <Badge variant={r.classification === "forte" ? "default" : r.classification === "moderado" ? "secondary" : "outline"} className="text-[10px] px-1.5">
                            {r.classification}
                          </Badge>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          {r.trend === "subindo" ? <ArrowUp className="h-3 w-3 text-green-500 mx-auto" /> :
                           r.trend === "descendo" ? <ArrowDown className="h-3 w-3 text-destructive mx-auto" /> :
                           <Minus className="h-3 w-3 text-muted-foreground mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {report.patterns.map((p, i) => (
              <Card key={i} className="border-primary/10">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{p.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm capitalize">{p.type}</span>
                        <Badge variant={p.impact === "alto" ? "default" : p.impact === "médio" ? "secondary" : "outline"} className="text-[10px]">
                          {p.impact}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{p.description}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={p.confidence} className="h-1.5 flex-1" />
                        <span className="text-[10px] font-mono text-muted-foreground">{p.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Parity Chart */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Perfil de Paridade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={parityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                      {parityData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Spatial Radar */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Distribuição Espacial</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="zone" fontSize={10} stroke="hsl(var(--muted-foreground))" />
                    <PolarRadiusAxis fontSize={9} stroke="hsl(var(--muted-foreground))" />
                    <Radar name="Real" dataKey="real" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Radar name="Esperado" dataKey="esperado" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.1} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Sum & Consecutive Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Soma Média</p>
                <p className="text-xl font-bold">{report.sumProfile.avg}</p>
                <p className="text-[10px] text-muted-foreground">Desvio: ±{report.sumProfile.stdDev} | Faixa: {report.sumProfile.min}–{report.sumProfile.max}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Pares Consecutivos</p>
                <p className="text-xl font-bold">{report.consecutiveProfile.avgConsecutive}</p>
                <p className="text-[10px] text-muted-foreground">{report.consecutiveProfile.pctWithConsecutive}% dos sorteios têm consecutivos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Último Sorteio (Soma)</p>
                <p className="text-xl font-bold">{report.sumProfile.recent}</p>
                <p className="text-[10px] text-muted-foreground">
                  {report.sumProfile.recent > report.sumProfile.avg ? "Acima" : "Abaixo"} da média
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Strategies Tab */}
        <TabsContent value="strategies" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {report.strategies.map((s, i) => (
              <Card key={i} className={i === 0 ? "border-primary/30" : "border-border"}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {i === 0 && <Trophy className="h-4 w-4 text-primary" />}
                      <span className="font-semibold text-sm">{s.name}</span>
                    </div>
                    <Badge variant={s.trend === "melhorando" ? "default" : s.trend === "piorando" ? "destructive" : "secondary"} className="text-[10px]">
                      {s.trend}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-primary">{s.winRate.toFixed(1)}%</p>
                      <p className="text-[10px] text-muted-foreground">Taxa Acerto</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{s.avgHits.toFixed(1)}</p>
                      <p className="text-[10px] text-muted-foreground">Média Hits</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-accent">{s.bestResult}</p>
                      <p className="text-[10px] text-muted-foreground">Melhor</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">{s.totalTests} testes realizados</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Shifts Tab */}
        <TabsContent value="shifts" className="space-y-4">
          {report.shifts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle className="mx-auto h-8 w-8 mb-2 text-green-500" />
                <p>Nenhuma mudança estatística significativa detectada.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {report.shifts.map((s, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm ${
                        s.type === "entrando_tendencia" ? "bg-green-500/15 text-green-500 border border-green-500/30" : "bg-destructive/15 text-destructive border border-destructive/30"
                      }`}>
                        {String(s.number).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm">{s.description}</p>
                        <p className="text-[10px] text-muted-foreground">Magnitude: {s.magnitude}%</p>
                      </div>
                      {s.type === "entrando_tendencia" ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* AI Analysis Tab */}
        <TabsContent value="ai" className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Análise da IA Autônoma
              </CardTitle>
              <CardDescription>
                A IA analisa todos os dados estatísticos e gera recomendações inteligentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiAnalysis ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {aiAnalysis}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Clique no botão abaixo para a IA analisar todos os dados e gerar recomendações.
                  </p>
                  <Button onClick={runAIAnalysis} disabled={aiLoading} className="gap-2">
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Executar Análise IA Profunda
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
