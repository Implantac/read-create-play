import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";
import { runAutonomousAnalysis, AutonomousAIReport } from "@/engine/autonomous-ai";
import { generateAutonomousAnalysis } from "@/engine/native-analysis";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Brain, TrendingUp, TrendingDown, Zap, Target, RefreshCw, Sparkles,
  AlertTriangle, CheckCircle, ArrowUp, ArrowDown, Minus, Loader2,
  Activity, Trophy, GitBranch, Link2, Timer, Gauge, Dice1, TriangleAlert, FlaskConical,
  Save, Network, Bookmark, Copy, Star
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis, LineChart, Line
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
  const [savingGame, setSavingGame] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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
      await new Promise(r => setTimeout(r, 300));
      const analysis = generateAutonomousAnalysis(report, config);
      setAiAnalysis(analysis);
      toast({ title: "IA Nativa", description: "Análise concluída com sucesso!" });
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
        toast({ title: "Atualizado", description: "Análise recalculada." });
      }, 500);
    }
  };

  const saveGame = async (numbers: number[], strategy: string) => {
    if (!user) {
      toast({ title: "Login necessário", description: "Faça login para salvar jogos.", variant: "destructive" });
      return;
    }
    const key = numbers.join(',');
    setSavingGame(key);
    try {
      const { error } = await supabase.from("saved_bets").insert({
        user_id: user.id,
        lottery_id: config.id,
        numbers,
        strategy,
        label: `IA Autônoma — ${strategy}`,
      });
      if (error) throw error;
      toast({ title: "Salvo!", description: `Jogo salvo com sucesso.` });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSavingGame(null);
    }
  };

  const copyGame = (numbers: number[]) => {
    navigator.clipboard.writeText(numbers.map(n => String(n).padStart(2, "0")).join(", "));
    toast({ title: "Copiado!", description: "Dezenas copiadas para a área de transferência." });
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
    markov: r.markovScore,
    entropy: r.entropyScore,
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

  const markovScatterData = report.markovTransitions.slice(0, 30).map(t => ({
    x: t.from, y: t.to, z: t.probability * 100, label: `${t.from}→${t.to}`,
  }));

  const gapChartData = report.gapAnalysis
    .filter(g => g.predictedReturn <= 5)
    .slice(0, 15)
    .map(g => ({
      name: String(g.number).padStart(2, "0"),
      gapAtual: g.currentGap,
      gapMedio: g.avgGap,
      retorno: g.predictedReturn,
    }));

  const momentumChartData = report.momentumTimeline.slice(0, 15).map(m => ({
    name: String(m.number).padStart(2, "0"),
    aceleracao: m.acceleration,
    fill: m.acceleration > 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)",
  }));

  const entropyZoneData = report.entropyAnalysis.entropyByZone.map(z => ({
    name: z.zone,
    entropia: z.entropy,
    normalizada: Math.round(z.normalized * 100),
  }));

  const chiDeviationData = report.chiSquareResult.topDeviations.slice(0, 12).map(d => ({
    name: String(d.number).padStart(2, "0"),
    residual: d.residual,
    fill: d.residual > 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)",
  }));

  // Bayesian data
  const bayesianChartData = report.bayesianNodes
    .sort((a, b) => b.posterior - a.posterior)
    .slice(0, 20)
    .map(n => ({
      name: String(n.number).padStart(2, "0"),
      posterior: Math.round(n.posterior * 100),
      prior: Math.round(n.prior * 100),
      centrality: Math.round(n.centrality * 10) / 10,
    }));

  const altStrategyNames = ["Momentum", "Overdue", "Bayesiana", "Markov", "Contrária"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-background to-accent/5">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">IA Autônoma — {config.name}</CardTitle>
                <CardDescription>
                  {report.drawsAnalyzed} concursos · Confiança: {report.confidenceScore}/100 · Bayesian + Markov + Entropia + χ²
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
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        <Card className="border-primary/15">
          <CardContent className="pt-3 pb-2 px-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground">Fortes</span>
            </div>
            <p className="text-xl font-bold text-primary">{report.rankings.filter(r => r.classification === "forte").length}</p>
          </CardContent>
        </Card>
        <Card className="border-accent/15">
          <CardContent className="pt-3 pb-2 px-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
              <span className="text-[10px] text-muted-foreground">Subindo</span>
            </div>
            <p className="text-xl font-bold text-accent">{report.rankings.filter(r => r.trend === "subindo").length}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/15">
          <CardContent className="pt-3 pb-2 px-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[10px] text-muted-foreground">Mudanças</span>
            </div>
            <p className="text-xl font-bold text-destructive">{report.shifts.length}</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/15">
          <CardContent className="pt-3 pb-2 px-3">
            <div className="flex items-center gap-2 mb-1">
              <Dice1 className="h-3.5 w-3.5 text-green-500" />
              <span className="text-[10px] text-muted-foreground">Entropia</span>
            </div>
            <p className="text-xl font-bold text-green-500">{report.entropyAnalysis.normalizedEntropy.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/15">
          <CardContent className="pt-3 pb-2 px-3">
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical className="h-3.5 w-3.5 text-yellow-500" />
              <span className="text-[10px] text-muted-foreground">χ² p-valor</span>
            </div>
            <p className="text-xl font-bold text-yellow-500">{report.chiSquareResult.pValue.toFixed(3)}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/15">
          <CardContent className="pt-3 pb-2 px-3">
            <div className="flex items-center gap-2 mb-1">
              <Network className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[10px] text-muted-foreground">Bayes Nodes</span>
            </div>
            <p className="text-xl font-bold text-blue-500">{report.bayesianNodes.filter(n => n.posterior > 0.6).length}</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/15">
          <CardContent className="pt-3 pb-2 px-3">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-[10px] text-muted-foreground">Confiança</span>
            </div>
            <p className="text-xl font-bold text-purple-500">{report.confidenceScore}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Suggested Numbers + Save */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Jogo Principal ({config.pick} dezenas)
            <Badge variant="secondary" className="text-[10px]">Bayesian + Markov + Entropia + χ²</Badge>
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
          {report.bayesianGameScores[0] && (
            <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">Bayes: {report.bayesianGameScores[0].totalScore}/100</Badge>
              <Badge variant="outline" className="text-[10px]">Posterior: {report.bayesianGameScores[0].avgPosterior.toFixed(2)}</Badge>
              <Badge variant="outline" className="text-[10px]">Centralidade: {report.bayesianGameScores[0].networkCentrality.toFixed(2)}</Badge>
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => saveGame(report.suggestedNumbers, "IA Principal")}
              disabled={savingGame === report.suggestedNumbers.join(',') || !user}
              className="gap-2"
            >
              {savingGame === report.suggestedNumbers.join(',') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar Jogo
            </Button>
            <Button size="sm" variant="ghost" onClick={() => copyGame(report.suggestedNumbers)} className="gap-2">
              <Copy className="h-3.5 w-3.5" /> Copiar
            </Button>
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

      {/* Alternative Games */}
      {report.alternativeGames.length > 0 && (
        <Card className="border-accent/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" />
              Jogos Alternativos ({report.alternativeGames.length} estratégias)
            </CardTitle>
            <CardDescription>Jogos gerados por estratégias diversas para maximizar cobertura</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {report.alternativeGames.map((game, idx) => {
                const bayesScore = report.bayesianGameScores[idx + 1];
                return (
                  <Card key={idx} className="border-border">
                    <CardContent className="pt-3 pb-3 px-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{altStrategyNames[idx] || `Alt ${idx + 1}`}</span>
                        {bayesScore && <Badge variant="outline" className="text-[10px] font-mono">B:{bayesScore.totalScore}</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {game.map(n => (
                          <span key={n} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-xs border border-accent/20">
                            {String(n).padStart(2, "0")}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] gap-1 px-2"
                          onClick={() => saveGame(game, altStrategyNames[idx] || `Alt ${idx + 1}`)}
                          disabled={savingGame === game.join(',') || !user}
                        >
                          <Save className="h-3 w-3" /> Salvar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 px-2" onClick={() => copyGame(game)}>
                          <Copy className="h-3 w-3" /> Copiar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="bayesian">Bayesian</TabsTrigger>
          <TabsTrigger value="entropy">Entropia</TabsTrigger>
          <TabsTrigger value="chisquare">χ² Test</TabsTrigger>
          <TabsTrigger value="markov">Markov</TabsTrigger>
          <TabsTrigger value="triplets">Trios</TabsTrigger>
          <TabsTrigger value="gaps">Gaps</TabsTrigger>
          <TabsTrigger value="patterns">Padrões</TabsTrigger>
          <TabsTrigger value="strategies">Estratégias</TabsTrigger>
          <TabsTrigger value="shifts">Mudanças</TabsTrigger>
          <TabsTrigger value="ai">Análise IA</TabsTrigger>
        </TabsList>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ranking Probabilístico — Top 20 (Bayesian + Entropia + Markov)</CardTitle>
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
                  <Bar dataKey="markov" name="Markov" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="entropy" name="Entropia" fill="hsl(280, 70%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ranking Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-1">#</th>
                      <th className="text-left py-2 px-1">Nº</th>
                      <th className="text-center py-2 px-1">Score</th>
                      <th className="text-center py-2 px-1">Freq</th>
                      <th className="text-center py-2 px-1">Markov</th>
                      <th className="text-center py-2 px-1">Entropia</th>
                      <th className="text-center py-2 px-1">Cooc.</th>
                      <th className="text-center py-2 px-1">Class.</th>
                      <th className="text-center py-2 px-1">Dir.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rankings.slice(0, 40).map(r => (
                      <tr key={r.number} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-1.5 px-1 font-mono text-muted-foreground">{r.rank}</td>
                        <td className="py-1.5 px-1 font-bold">{String(r.number).padStart(2, "0")}</td>
                        <td className="py-1.5 px-1 text-center">
                          <div className="flex items-center gap-1">
                            <Progress value={r.compositeScore} className="h-1.5 flex-1" />
                            <span className="font-mono w-7 text-right">{r.compositeScore}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-1 text-center font-mono">{r.frequencyScore}</td>
                        <td className="py-1.5 px-1 text-center font-mono">{r.markovScore}</td>
                        <td className="py-1.5 px-1 text-center font-mono">{r.entropyScore}</td>
                        <td className="py-1.5 px-1 text-center font-mono">{r.cooccurrenceScore}</td>
                        <td className="py-1.5 px-1 text-center">
                          <Badge variant={r.classification === "forte" ? "default" : r.classification === "moderado" ? "secondary" : "outline"} className="text-[10px] px-1">
                            {r.classification}
                          </Badge>
                        </td>
                        <td className="py-1.5 px-1 text-center">
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

        {/* Bayesian Tab - NEW */}
        <TabsContent value="bayesian" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Nós com Alto Posterior</p>
                <p className="text-2xl font-bold text-blue-500">{report.bayesianNodes.filter(n => n.posterior > 0.6).length}</p>
                <p className="text-[10px] text-muted-foreground">Posterior &gt; 0.60</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Centralidade Máxima</p>
                <p className="text-2xl font-bold">{report.bayesianNodes.length > 0 ? Math.max(...report.bayesianNodes.map(n => n.centrality)).toFixed(1) : "—"}</p>
                <p className="text-[10px] text-muted-foreground">Nó mais influente na rede</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Score Bayes do Jogo</p>
                <p className="text-2xl font-bold text-primary">{report.bayesianGameScores[0]?.totalScore || "—"}/100</p>
                <p className="text-[10px] text-muted-foreground">Jogo principal</p>
              </CardContent>
            </Card>
          </div>

          {bayesianChartData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Network className="h-4 w-4 text-blue-500" />
                  Probabilidade Posterior vs Prior — Top 20
                </CardTitle>
                <CardDescription>Prior = frequência base | Posterior = ajustado por dependências condicionais</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={bayesianChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <Legend />
                    <Bar dataKey="posterior" name="Posterior (%)" fill="hsl(220, 70%, 55%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="prior" name="Prior (%)" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.4} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {report.bayesianNodes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top Influenciadores (Maior Centralidade)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                  {report.bayesianNodes
                    .sort((a, b) => b.centrality - a.centrality)
                    .slice(0, 15)
                    .map((node, i) => (
                      <div key={node.number} className="flex items-center gap-3 py-1.5 px-2 rounded bg-muted/30">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/15 text-blue-500 font-bold text-xs border border-blue-500/30">
                          {String(node.number).padStart(2, "0")}
                        </span>
                        <div className="flex-1">
                          <Progress value={node.posterior * 100} className="h-1.5" />
                        </div>
                        <div className="text-right text-[10px] space-x-2">
                          <span className="font-mono text-muted-foreground">P={node.posterior.toFixed(2)}</span>
                          <span className="font-mono text-muted-foreground">C={node.centrality.toFixed(1)}</span>
                          <span className="font-mono text-muted-foreground">Conds={node.conditionals.length}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {report.mutualInformation.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informação Mútua — Auto-correlação Temporal</CardTitle>
                <CardDescription>Dezenas com alta MI têm padrões temporais mais previsíveis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {report.mutualInformation.slice(0, 20).map((mi, i) => (
                    <div key={i} className={`text-center p-2 rounded-lg border ${mi.mi > 0.05 ? "border-blue-500/30 bg-blue-500/5" : "border-border bg-muted/20"}`}>
                      <span className="font-bold text-sm block">{String(mi.a).padStart(2, "0")}</span>
                      <span className={`text-[10px] ${mi.mi > 0.05 ? "text-blue-500" : "text-muted-foreground"}`}>MI={mi.mi.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Entropy Tab */}
        <TabsContent value="entropy" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Entropia Global</p>
                <p className="text-2xl font-bold">{report.entropyAnalysis.globalEntropy.toFixed(3)}</p>
                <p className="text-[10px] text-muted-foreground">de {report.entropyAnalysis.maxEntropy.toFixed(3)} bits (max)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Entropia Normalizada</p>
                <p className="text-2xl font-bold">{report.entropyAnalysis.normalizedEntropy.toFixed(4)}</p>
                <Progress value={report.entropyAnalysis.normalizedEntropy * 100} className="h-2 mt-2" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {report.entropyAnalysis.normalizedEntropy > 0.95 ? "🎲 Quase uniforme" : report.entropyAnalysis.normalizedEntropy > 0.85 ? "⚠️ Levemente enviesada" : "🔥 Significativamente enviesada"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Dezenas Anômalas</p>
                <p className="text-2xl font-bold text-destructive">{report.entropyAnalysis.numberEntropy.filter(e => e.isAnomaly).length}</p>
                <p className="text-[10px] text-muted-foreground">Alta variabilidade entre janelas</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Dice1 className="h-4 w-4 text-primary" />
                Entropia por Zona
              </CardTitle>
              <CardDescription>Distribuição de incerteza por faixa numérica</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={entropyZoneData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Legend />
                  <Bar dataKey="entropia" name="Entropia (bits)" fill="hsl(280, 70%, 50%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="normalizada" name="Normalizada (%)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dezenas com Maior Variabilidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[250px] overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {report.entropyAnalysis.numberEntropy.slice(0, 20).map(e => (
                    <div key={e.number} className={`text-center p-2 rounded-lg border ${e.isAnomaly ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/20"}`}>
                      <span className="font-bold text-sm block">{String(e.number).padStart(2, "0")}</span>
                      <span className={`text-[10px] ${e.isAnomaly ? "text-destructive" : "text-muted-foreground"}`}>cv={e.entropy}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chi-Square Tab */}
        <TabsContent value="chisquare" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Estatística χ²</p>
                <p className="text-2xl font-bold">{report.chiSquareResult.chiSquare.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">GL = {report.chiSquareResult.degreesOfFreedom}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">p-valor</p>
                <p className={`text-2xl font-bold ${report.chiSquareResult.isUniform ? "text-green-500" : "text-destructive"}`}>
                  {report.chiSquareResult.pValue.toFixed(4)}
                </p>
                <p className="text-[10px] text-muted-foreground">{report.chiSquareResult.significanceLevel}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Distribuição</p>
                <div className="flex items-center gap-2">
                  {report.chiSquareResult.isUniform ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-semibold text-green-500">Uniforme</span>
                    </>
                  ) : (
                    <>
                      <TriangleAlert className="h-5 w-5 text-destructive" />
                      <span className="text-sm font-semibold text-destructive">Não uniforme</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {report.chiSquareResult.isUniform ? "Sem viés estatístico significativo" : "Viés detectado — explorável para apostas"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                Resíduos Padronizados (Top Desvios)
              </CardTitle>
              <CardDescription>Positivo = acima do esperado | Negativo = abaixo do esperado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chiDeviationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="residual" name="Resíduo">
                    {chiDeviationData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tabela de Desvios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2">Nº</th>
                      <th className="text-center py-2 px-2">Observado</th>
                      <th className="text-center py-2 px-2">Esperado</th>
                      <th className="text-center py-2 px-2">Resíduo</th>
                      <th className="text-center py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.chiSquareResult.topDeviations.map(d => (
                      <tr key={d.number} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-1.5 px-2 font-bold">{String(d.number).padStart(2, "0")}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{d.observed}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{d.expected}</td>
                        <td className={`py-1.5 px-2 text-center font-mono font-bold ${d.residual > 0 ? "text-green-500" : "text-destructive"}`}>
                          {d.residual > 0 ? "+" : ""}{d.residual}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <Badge variant={Math.abs(d.residual) > 2 ? "destructive" : Math.abs(d.residual) > 1 ? "secondary" : "outline"} className="text-[10px] px-1">
                            {Math.abs(d.residual) > 2 ? "⚠️ Anormal" : Math.abs(d.residual) > 1 ? "Desvio" : "Normal"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Markov Tab */}
        <TabsContent value="markov" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-primary" />
                  Transições de Markov
                </CardTitle>
                <CardDescription>Probabilidade de uma dezena seguir outra</CardDescription>
              </CardHeader>
              <CardContent>
                {markovScatterData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="x" name="De" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis dataKey="y" name="Para" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <ZAxis dataKey="z" range={[30, 300]} name="Prob%" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                      <Scatter data={markovScatterData} fill="hsl(var(--primary))" fillOpacity={0.7} />
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Dados insuficientes</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-accent" />
                  Top Pares Coocorrentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                  {report.topCooccurrences.slice(0, 15).map((c, i) => (
                    <div key={i} className="flex items-center gap-2 py-1 px-2 rounded bg-muted/30">
                      <span className="font-mono text-xs font-bold text-primary w-14">
                        ({String(c.a).padStart(2, "0")},{String(c.b).padStart(2, "0")})
                      </span>
                      <Progress value={Math.min(100, c.lift * 30)} className="h-1.5 flex-1" />
                      <span className="text-[10px] font-mono text-muted-foreground w-16 text-right">
                        {c.count}x lift={c.lift}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Momentum (Aceleração/Desaceleração)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={momentumChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="aceleracao" name="Aceleração">
                    {momentumChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Triplets Tab */}
        <TabsContent value="triplets" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                🔺 Trios Recorrentes
              </CardTitle>
              <CardDescription>Combinações de 3 números que aparecem juntos com frequência significativa (Lift)</CardDescription>
            </CardHeader>
            <CardContent>
              {report.topTriplets.length > 0 ? (
                <div className="space-y-2">
                  {report.topTriplets.map((t, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${i < 3 ? "border-primary/20 bg-primary/5" : "border-border bg-muted/20"}`}>
                      <span className="text-xs text-muted-foreground font-mono w-6">#{i + 1}</span>
                      <div className="flex gap-1.5">
                        {t.numbers.map(n => (
                          <span key={n} className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/15 text-primary font-bold text-sm border border-primary/30">
                            {String(n).padStart(2, "0")}
                          </span>
                        ))}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={t.lift > 3 ? "default" : "secondary"} className="text-[10px]">
                            lift={t.lift}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{t.count}x aparições</span>
                          <span className="text-[10px] text-muted-foreground">· visto há {t.lastSeen} conc.</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum trio significativo detectado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gaps Tab */}
        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" />
                Análise de Gap — Retorno Iminente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gapChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={gapChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <Legend />
                    <Bar dataKey="gapAtual" name="Gap Atual" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gapMedio" name="Gap Médio" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.5} />
                    <Bar dataKey="retorno" name="Retorno Previsto" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma dezena com retorno iminente</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tabela de Gaps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2">Nº</th>
                      <th className="text-center py-2 px-2">Gap Atual</th>
                      <th className="text-center py-2 px-2">Gap Médio</th>
                      <th className="text-center py-2 px-2">Retorno Prev.</th>
                      <th className="text-center py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.gapAnalysis.slice(0, 30).map(g => (
                      <tr key={g.number} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-1.5 px-2 font-bold">{String(g.number).padStart(2, "0")}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{g.currentGap}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{g.avgGap}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{g.predictedReturn}</td>
                        <td className="py-1.5 px-2 text-center">
                          <Badge variant={g.predictedReturn <= 0 ? "default" : g.predictedReturn <= 3 ? "secondary" : "outline"} className="text-[10px] px-1">
                            {g.predictedReturn <= 0 ? "🔥 IMINENTE" : g.predictedReturn <= 3 ? "⏰ Próximo" : "⏳ Aguardando"}
                          </Badge>
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
              <Card key={i} className={`border-primary/10 ${p.actionable ? "ring-1 ring-primary/20" : ""}`}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{p.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm capitalize">{p.type}</span>
                        <Badge variant={p.impact === "alto" ? "default" : p.impact === "médio" ? "secondary" : "outline"} className="text-[10px]">
                          {p.impact}
                        </Badge>
                        {p.actionable && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Acionável</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{p.description}</p>
                      {p.suggestion && <p className="text-xs text-primary font-medium">💡 {p.suggestion}</p>}
                      <div className="flex items-center gap-2 mt-2">
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

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Soma Média</p>
                <p className="text-xl font-bold">{report.sumProfile.avg}</p>
                <p className="text-[10px] text-muted-foreground">σ={report.sumProfile.stdDev} | [{report.sumProfile.min}–{report.sumProfile.max}] | {report.sumProfile.trend}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Pares Consecutivos</p>
                <p className="text-xl font-bold">{report.consecutiveProfile.avgConsecutive}</p>
                <p className="text-[10px] text-muted-foreground">{report.consecutiveProfile.pctWithConsecutive}% dos sorteios</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Último Sorteio (Soma)</p>
                <p className="text-xl font-bold">{report.sumProfile.recent}</p>
                <p className="text-[10px] text-muted-foreground">
                  {report.sumProfile.recent > report.sumProfile.avg ? "↑ Acima" : "↓ Abaixo"} da média
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Strategies Tab */}
        <TabsContent value="strategies" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {report.strategies.map((s, i) => (
              <Card key={i} className={i === 0 ? "border-primary/30 ring-1 ring-primary/10" : "border-border"}>
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
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-primary">{s.winRate.toFixed(1)}%</p>
                      <p className="text-[10px] text-muted-foreground">WinRate</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{s.avgHits.toFixed(1)}</p>
                      <p className="text-[10px] text-muted-foreground">Média</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-accent">{s.bestResult}</p>
                      <p className="text-[10px] text-muted-foreground">Melhor</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{s.consistency || "—"}%</p>
                      <p className="text-[10px] text-muted-foreground">Consist.</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">{s.totalTests} testes</p>
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
                        <p className="text-[10px] text-muted-foreground">Magnitude: {s.magnitude}% {s.since ? `· Janela: ${s.since} concursos` : ""}</p>
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
                Análise profunda com Bayesian + Entropia + χ² + Markov + Trios + Coocorrência + Gaps + 10 Jogos Otimizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiAnalysis ? (
                <div className="space-y-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {aiAnalysis}
                    </div>
                  </div>
                  {(() => {
                    const extractGames = (text: string) => {
                      const games: { numbers: number[]; confidence: number; strategy: string }[] = [];
                      const lines = text.split("\n");
                      
                      let inGameBlock = false;
                      let blockLines: string[] = [];
                      for (const line of lines) {
                        if (line.trim() === "GAME_START") {
                          inGameBlock = true;
                          blockLines = [];
                          continue;
                        }
                        if (line.trim() === "GAME_END") {
                          inGameBlock = false;
                          let strategy = "", confidence = 0, numbers: number[] = [];
                          for (const bl of blockLines) {
                            const jogoMatch = bl.match(/Jogo\s+\d+\s*[-—–:]\s*(.+?)(?:\(|$)/i);
                            if (jogoMatch) strategy = jogoMatch[1].replace(/\*+/g, "").trim();
                            const confM = bl.match(/Confiança:\s*(\d+)/i) || bl.match(/(\d+)\s*\/\s*100/);
                            if (confM) confidence = parseInt(confM[1]);
                            const dezM = bl.match(/Dezenas?:\s*([\d,\s]+)/i);
                            if (dezM) {
                              numbers = dezM[1].split(/[,\s]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n > 0 && n <= 100);
                            }
                          }
                          if (numbers.length >= 5) games.push({ numbers, confidence, strategy });
                          continue;
                        }
                        if (inGameBlock) blockLines.push(line);
                      }
                      
                      if (games.length >= 3) return games;
                      
                      for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        const isGameHeader = /(?:\*\*\s*)?Jogo\s+\d+/i.test(line) || /^\d+[.)]\s*(?:\*\*)?(?:Jogo|Aposta)/i.test(line);
                        if (!isGameHeader) continue;
                        
                        const stratMatch = line.match(/(?:Jogo\s+\d+\s*[—–\-:]\s*\*?\*?)([^(*\n]+)/i);
                        const strategy = stratMatch ? stratMatch[1].replace(/\*+/g, "").trim() : "";
                        const confMatch = line.match(/Confiança:\s*(\d+)/i) || line.match(/(\d+)\s*\/\s*100/);
                        const confidence = confMatch ? parseInt(confMatch[1]) : 0;
                        
                        let numbers: number[] = [];
                        for (let j = i; j < Math.min(i + 6, lines.length); j++) {
                          const dezMatch = lines[j].match(/Dezenas?:\s*([\d,\s]+)/i);
                          if (dezMatch) {
                            numbers = dezMatch[1].split(/[,\s]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n > 0 && n <= 100);
                            break;
                          }
                          if (j > i) {
                            const numsInLine = lines[j].match(/\b(\d{1,3})\b/g);
                            if (numsInLine && numsInLine.length >= 5) {
                              numbers = numsInLine.map(n => parseInt(n)).filter(n => n > 0 && n <= 100);
                              if (numbers.length >= 5) break;
                              numbers = [];
                            }
                          }
                        }
                        
                        if (numbers.length >= 5) {
                          games.push({ numbers, confidence, strategy });
                        }
                      }
                      return games;
                    };
                    
                    const games = extractGames(aiAnalysis);
                    if (games.length < 1) return null;
                    
                    return (
                      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 mt-6">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            🎯 {games.length} Jogos Otimizados — Resumo Visual
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 gap-3">
                            {games.slice(0, 10).map((game, idx) => {
                              const borderColor = idx < 3 ? "border-green-500/30" : idx < 6 ? "border-primary/30" : idx < 8 ? "border-orange-500/30" : "border-purple-500/30";
                              const badgeVariant: "default" | "secondary" | "outline" = idx < 3 ? "default" : idx < 6 ? "secondary" : "outline";
                              return (
                                <Card key={idx} className={`${borderColor} border`}>
                                  <CardContent className="pt-3 pb-3 px-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-semibold text-sm">Jogo {idx + 1}</span>
                                      <div className="flex items-center gap-2">
                                        {game.strategy && <Badge variant={badgeVariant} className="text-[10px]">{game.strategy}</Badge>}
                                        {game.confidence > 0 && (
                                          <Badge variant="outline" className="text-[10px] font-mono">{game.confidence}/100</Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                      {game.numbers.map((n, ni) => (
                                        <span key={ni} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-xs border border-primary/30">
                                          {String(n).padStart(2, "0")}
                                        </span>
                                      ))}
                                    </div>
                                    <div className="flex gap-1.5">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-[10px] gap-1 px-2"
                                        onClick={() => saveGame(game.numbers, game.strategy || `Jogo ${idx + 1}`)}
                                        disabled={!user}
                                      >
                                        <Save className="h-3 w-3" /> Salvar
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 px-2" onClick={() => copyGame(game.numbers)}>
                                        <Copy className="h-3 w-3" /> Copiar
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Clique abaixo para a IA analisar todos os dados e gerar 10 jogos otimizados para o prêmio principal.
                  </p>
                  <Button onClick={runAIAnalysis} disabled={aiLoading} className="gap-2">
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Executar Análise IA + 10 Jogos
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
