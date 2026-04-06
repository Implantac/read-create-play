import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
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
  RankingEntry,
  StrategyGames,
} from "@/engine/strategy-evolution";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, Trophy, TrendingUp, TrendingDown, Minus,
  Zap, BarChart3, Lightbulb, Target, Shield,
  Play, ChevronDown, ChevronUp, Sparkles, Crown,
  Gauge, Layers, Award, Crosshair, RotateCcw,
  ArrowRight, Star, Percent, Hash, Copy, Save, Dices,
  Check,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";

const PROFILE_INFO: Record<EvolutionProfile, { label: string; desc: string; icon: any }> = {
  economico: { label: "Econômico", desc: "Menos jogos, menor custo", icon: Shield },
  equilibrado: { label: "Equilibrado", desc: "Melhor custo-benefício", icon: Target },
  agressivo: { label: "Agressivo", desc: "Máxima performance", icon: Zap },
  profissional: { label: "Profissional", desc: "Análise completa", icon: Award },
  cobertura_extrema: { label: "Cobertura Extrema", desc: "Máxima cobertura numérica", icon: Layers },
};

const RANK_COLORS = [
  "hsl(var(--primary))",
  "hsl(45 93% 47%)",
  "hsl(24 75% 50%)",
  "hsl(var(--muted-foreground))",
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function StrategyLabPage() {
  const { config, draws, selectedLottery } = useLotteryContext();

  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [gamesPerStrategy, setGamesPerStrategy] = useState(10);
  const [profile, setProfile] = useState<EvolutionProfile>("equilibrado");
  const [result, setResult] = useState<LabResult | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("ranking");
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [labHistory, setLabHistory] = useState<{ timestamp: number; winner: string; score: number }[]>([]);

  const available = useMemo(() => getStrategiesForLottery(config.id), [config.id]);

  // Reset when lottery changes
  const prevLotteryRef = useRef(selectedLottery);
  useEffect(() => {
    if (prevLotteryRef.current !== selectedLottery) {
      setResult(null);
      setSelectedStrategies([]);
      prevLotteryRef.current = selectedLottery;
    }
  }, [selectedLottery]);

  // Auto-select all on first load
  useEffect(() => {
    if (selectedStrategies.length === 0 && available.length > 0) {
      setSelectedStrategies(available.map(s => s.id));
    }
  }, [available]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const clearAll = useCallback(() => {
    setSelectedStrategies([]);
    setResult(null);
  }, []);

  const runLab = useCallback(() => {
    if (!draws || draws.length === 0) {
      toast.error("Sem sorteios disponíveis");
      return;
    }
    setRunning(true);
    setResult(null);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 90));
    }, 100);

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
        setProgress(100);

        if (res.bestStrategy) {
          setLabHistory(prev => [{
            timestamp: Date.now(),
            winner: res.bestStrategy!.strategyName,
            score: res.bestStrategy!.metrics.globalScore,
          }, ...prev].slice(0, 10));
        }

        toast.success(`${res.rankings.length} estratégias testadas em ${res.elapsedMs}ms`);
        setActiveTab("ranking");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao executar laboratório");
      }
      clearInterval(progressInterval);
      setRunning(false);
    }, 200);
  }, [draws, config, selectedStrategies, gamesPerStrategy, drawRange, profile]);

  const trendIcon = (t: string) => {
    if (t === "up") return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
    if (t === "down") return <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  // Chart data
  const radarData = useMemo(() => {
    if (!result || result.rankings.length === 0) return [];
    const top = result.rankings.slice(0, 5);
    return [
      { metric: "Score", fullMark: 100, ...Object.fromEntries(top.map(r => [r.strategyName, r.metrics.globalScore])) },
      { metric: "Média", fullMark: config.pick, ...Object.fromEntries(top.map(r => [r.strategyName, r.metrics.avgHits])) },
      { metric: "Consistência", fullMark: 100, ...Object.fromEntries(top.map(r => [r.strategyName, r.metrics.consistency * 100])) },
      { metric: "Diversidade", fullMark: 100, ...Object.fromEntries(top.map(r => [r.strategyName, r.metrics.diversityScore])) },
      { metric: "Cobertura", fullMark: 100, ...Object.fromEntries(top.map(r => [r.strategyName, r.metrics.coverageScore])) },
    ];
  }, [result, config.pick]);

  const barData = useMemo(() => {
    if (!result) return [];
    return result.rankings.map(r => ({
      name: r.strategyName.length > 12 ? r.strategyName.slice(0, 12) + "…" : r.strategyName,
      fullName: r.strategyName,
      score: Number(r.metrics.globalScore.toFixed(1)),
      avgHits: Number(r.metrics.avgHits.toFixed(2)),
      rank: r.rank,
    }));
  }, [result]);

  const topNames = useMemo(() => {
    if (!result) return [];
    return result.rankings.slice(0, 5).map(r => r.strategyName);
  }, [result]);

  const radarColors = ["hsl(var(--primary))", "#eab308", "#f97316", "#06b6d4", "#a855f7"];

  return (
    <PlanGate feature="estrategias_ml">
      <div className="space-y-6">
        <PageHeader
          title="Laboratório de Estratégias"
          description={`Motor autoevolutivo — ${config.name}: teste, compare e descubra as melhores estratégias`}
          icon={FlaskConical}
          badge={result ? `${result.rankings.length} testadas` : undefined}
        />
        <LotteryContextBanner />

        {/* Summary Cards */}
        {result && result.bestStrategy && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <motion.div variants={item}>
              <SummaryCard
                icon={Crown}
                label="Melhor Estratégia"
                value={result.bestStrategy.strategyName}
                sub={`Score ${result.bestStrategy.metrics.globalScore.toFixed(1)}`}
                accent
              />
            </motion.div>
            <motion.div variants={item}>
              <SummaryCard
                icon={Crosshair}
                label="Melhor Acerto"
                value={`${result.bestStrategy.metrics.bestHits}`}
                sub={`de ${config.pick} possíveis`}
              />
            </motion.div>
            <motion.div variants={item}>
              <SummaryCard
                icon={Gauge}
                label="Consistência Top"
                value={`${(result.bestStrategy.metrics.consistency * 100).toFixed(0)}%`}
                sub="da melhor estratégia"
              />
            </motion.div>
            <motion.div variants={item}>
              <SummaryCard
                icon={Zap}
                label="Tempo de Análise"
                value={`${result.elapsedMs}ms`}
                sub={`${result.rankings.length} estratégias`}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Config Panel */}
        <Card className="bg-card/80 backdrop-blur border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <FlaskConical className="w-4 h-4 text-primary" />
              Configuração do Laboratório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Strategy selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Estratégias ({selectedStrategies.length}/{available.length})
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
                    Todas
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-7 text-muted-foreground">
                    Limpar
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                {available.map(s => {
                  const isSelected = selectedStrategies.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                        isSelected
                          ? "border-primary/40 bg-primary/5"
                          : "border-border hover:bg-muted/20"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleStrategy(s.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{s.description}</div>
                      </div>
                      <Badge variant="outline" className={`text-[9px] shrink-0 ${
                        s.category === "ai" ? "border-primary/30 text-primary" :
                        s.category === "math" ? "border-accent/30 text-accent" :
                        s.category === "hybrid" ? "border-amber-500/30 text-amber-500" :
                        ""
                      }`}>
                        {s.category}
                      </Badge>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Hash className="w-3 h-3" />
                  Jogos por Estratégia
                </label>
                <Slider
                  value={[gamesPerStrategy]}
                  onValueChange={([v]) => { setGamesPerStrategy(v); setResult(null); }}
                  min={3}
                  max={30}
                  step={1}
                />
                <span className="text-xs font-mono font-bold text-primary">{gamesPerStrategy} jogos</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Target className="w-3 h-3" />
                  Perfil de Análise
                </label>
                <Select value={profile} onValueChange={(v) => { setProfile(v as EvolutionProfile); setResult(null); }}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROFILE_INFO).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">
                        <div className="flex items-center gap-2">
                          <v.icon className="w-3 h-3" />
                          <span>{v.label}</span>
                          <span className="text-muted-foreground">— {v.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3" />
                  Base de Dados
                </label>
                <div className="p-2.5 rounded-lg bg-muted/20 border border-border">
                  <div className="text-xs font-mono font-bold text-foreground">
                    {draws?.length.toLocaleString() || 0} sorteios
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    #{drawRange[0]} → #{drawRange[1]}
                  </div>
                </div>
              </div>
            </div>

            {/* Run button with progress */}
            <div className="space-y-2">
              <Button
                onClick={runLab}
                disabled={running || selectedStrategies.length === 0}
                className="w-full gap-2 h-12 text-sm font-bold"
                size="lg"
              >
                {running ? (
                  <>
                    <Zap className="w-4 h-4 animate-pulse" />
                    Processando {selectedStrategies.length} estratégias...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Executar Laboratório
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      {selectedStrategies.length} × {gamesPerStrategy} jogos
                    </Badge>
                  </>
                )}
              </Button>
              {running && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Progress value={progress} className="h-2" />
                  <p className="text-[10px] text-muted-foreground text-center mt-1">
                    Gerando jogos, backtestando contra {draws?.length} sorteios e calculando métricas...
                  </p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Insights */}
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    Insights da Análise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {result.insights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-background/50">
                        <ArrowRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-foreground">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

               <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-5">
                  <TabsTrigger value="ranking" className="text-xs gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Ranking
                  </TabsTrigger>
                  <TabsTrigger value="games" className="text-xs gap-1">
                    <Dices className="w-3.5 h-3.5" /> Jogos
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="text-xs gap-1">
                    <BarChart3 className="w-3.5 h-3.5" /> Gráficos
                  </TabsTrigger>
                  <TabsTrigger value="suggestions" className="text-xs gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Evolução
                  </TabsTrigger>
                  <TabsTrigger value="comparison" className="text-xs gap-1">
                    <Layers className="w-3.5 h-3.5" /> Tabela
                  </TabsTrigger>
                </TabsList>

                {/* Ranking Tab */}
                <TabsContent value="ranking" className="space-y-2 mt-4">
                  {result.rankings.map((r) => (
                    <RankingCard
                      key={r.strategyId}
                      entry={r}
                      pick={config.pick}
                      isExpanded={showDetails === r.strategyId}
                      onToggle={() => setShowDetails(showDetails === r.strategyId ? null : r.strategyId)}
                      trendIcon={trendIcon}
                    />
                  ))}
                </TabsContent>

                {/* Generated Games Tab */}
                <TabsContent value="games" className="space-y-4 mt-4">
                  <GeneratedGamesPanel
                    generatedGames={result.generatedGames}
                    lotteryId={config.id}
                    pick={config.pick}
                  />
                </TabsContent>

                {/* Charts Tab */}
                <TabsContent value="charts" className="mt-4 space-y-4">
                  <div className="grid lg:grid-cols-2 gap-4">
                    {/* Radar Chart */}
                    <Card className="bg-card/80 backdrop-blur border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold flex items-center gap-2">
                          <Target className="w-3.5 h-3.5 text-primary" />
                          Radar — Top 5 Estratégias
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis
                              dataKey="metric"
                              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                            />
                            <PolarRadiusAxis
                              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 8 }}
                              domain={[0, "auto"]}
                            />
                            {topNames.map((name, i) => (
                              <Radar
                                key={name}
                                name={name}
                                dataKey={name}
                                stroke={radarColors[i]}
                                fill={radarColors[i]}
                                fillOpacity={0.1}
                                strokeWidth={2}
                              />
                            ))}
                            <Legend
                              wrapperStyle={{ fontSize: 10 }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Bar Chart */}
                    <Card className="bg-card/80 backdrop-blur border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold flex items-center gap-2">
                          <BarChart3 className="w-3.5 h-3.5 text-primary" />
                          Score Global por Estratégia
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <XAxis type="number" domain={[0, 100]}
                              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                            />
                            <YAxis type="category" dataKey="name" width={100}
                              tick={{ fill: "hsl(var(--foreground))", fontSize: 10 }}
                            />
                            <RechartsTooltip
                              content={({ payload }) => {
                                if (!payload || payload.length === 0) return null;
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-popover border border-border rounded-lg p-2 text-xs shadow-lg">
                                    <p className="font-semibold text-foreground">{d.fullName}</p>
                                    <p className="text-muted-foreground">Score: <span className="font-mono text-primary font-bold">{d.score}</span></p>
                                    <p className="text-muted-foreground">Média acertos: <span className="font-mono">{d.avgHits}</span></p>
                                  </div>
                                );
                              }}
                            />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                              {barData.map((entry, i) => (
                                <Cell
                                  key={i}
                                  fill={RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)]}
                                  fillOpacity={0.8}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Hit distribution of winner */}
                  {result.bestStrategy && (
                    <Card className="bg-card/80 backdrop-blur border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold flex items-center gap-2">
                          <Crown className="w-3.5 h-3.5 text-primary" />
                          Distribuição de Acertos — {result.bestStrategy.strategyName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart
                            data={Object.entries(result.bestStrategy.metrics.hitDistribution)
                              .sort(([a], [b]) => Number(a) - Number(b))
                              .map(([hits, count]) => ({
                                hits: `${hits} acertos`,
                                count,
                                isPrize: Number(hits) >= Math.max(config.pick - 4, Math.floor(config.pick * 0.7)),
                              }))}
                          >
                            <XAxis dataKey="hits" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                            <RechartsTooltip
                              content={({ payload }) => {
                                if (!payload || payload.length === 0) return null;
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-popover border border-border rounded-lg p-2 text-xs shadow-lg">
                                    <p className="font-semibold text-foreground">{d.hits}</p>
                                    <p className="text-muted-foreground">{d.count.toLocaleString()} ocorrências</p>
                                    {d.isPrize && <p className="text-primary font-bold">🎯 Faixa premiada</p>}
                                  </div>
                                );
                              }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {Object.entries(result.bestStrategy.metrics.hitDistribution)
                                .sort(([a], [b]) => Number(a) - Number(b))
                                .map(([hits], i) => (
                                  <Cell
                                    key={i}
                                    fill={Number(hits) >= Math.max(config.pick - 4, Math.floor(config.pick * 0.7))
                                      ? "hsl(var(--primary))"
                                      : "hsl(var(--muted-foreground))"}
                                    fillOpacity={0.7}
                                  />
                                ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Evolution Suggestions Tab */}
                <TabsContent value="suggestions" className="space-y-2 mt-4">
                  {result.suggestions.length === 0 ? (
                    <div className="text-center py-12">
                      <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Sem sugestões de evolução no momento.</p>
                      <p className="text-xs text-muted-foreground mt-1">Execute o laboratório com mais estratégias para gerar recomendações.</p>
                    </div>
                  ) : (
                    result.suggestions.map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className={`bg-card/80 backdrop-blur border-border ${
                          s.type === "promote" ? "border-l-2 border-l-green-500" :
                          s.type === "discard" ? "border-l-2 border-l-destructive" :
                          s.type === "combine" ? "border-l-2 border-l-primary" :
                          "border-l-2 border-l-amber-500"
                        }`}>
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                s.type === "promote" ? "bg-green-500/10 text-green-500" :
                                s.type === "discard" ? "bg-destructive/10 text-destructive" :
                                s.type === "combine" ? "bg-primary/10 text-primary" :
                                "bg-amber-500/10 text-amber-500"
                              }`}>
                                {s.type === "promote" ? <TrendingUp className="w-4 h-4" /> :
                                 s.type === "discard" ? <TrendingDown className="w-4 h-4" /> :
                                 s.type === "combine" ? <Sparkles className="w-4 h-4" /> :
                                 <RotateCcw className="w-4 h-4" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className={`text-[9px] ${
                                    s.type === "promote" ? "border-green-500/30 text-green-500" :
                                    s.type === "discard" ? "border-destructive/30 text-destructive" :
                                    s.type === "combine" ? "border-primary/30 text-primary" :
                                    "border-amber-500/30 text-amber-500"
                                  }`}>
                                    {s.type === "promote" ? "Promover" :
                                     s.type === "discard" ? "Descartar" :
                                     s.type === "combine" ? "Combinar" : "Ajustar"}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Percent className="w-3 h-3" />
                                    Confiança: {(s.confidence * 100).toFixed(0)}%
                                  </span>
                                  {s.expectedImprovement > 0 && (
                                    <span className="text-[10px] text-green-500 font-semibold">
                                      +{s.expectedImprovement}% estimado
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-foreground mt-1.5">{s.reason}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </TabsContent>

                {/* Comparison Table Tab */}
                <TabsContent value="comparison" className="mt-4">
                  <Card className="bg-card/80 backdrop-blur border-border overflow-x-auto">
                    <CardContent className="p-0">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left p-3 text-muted-foreground font-semibold">#</th>
                            <th className="text-left p-3 text-muted-foreground font-semibold">Estratégia</th>
                            <th className="text-right p-3 text-muted-foreground font-semibold">Score</th>
                            <th className="text-right p-3 text-muted-foreground font-semibold">Média</th>
                            <th className="text-right p-3 text-muted-foreground font-semibold">Melhor</th>
                            <th className="text-right p-3 text-muted-foreground font-semibold">Consist.</th>
                            <th className="text-right p-3 text-muted-foreground font-semibold">Divers.</th>
                            <th className="text-right p-3 text-muted-foreground font-semibold">Cobert.</th>
                            <th className="text-right p-3 text-muted-foreground font-semibold">Prêmios</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.rankings.map(r => (
                            <tr key={r.strategyId} className={`border-b border-border/30 hover:bg-muted/10 transition-colors ${
                              r.rank === 1 ? "bg-primary/5" : ""
                            }`}>
                              <td className="p-3">
                                <span className={`font-mono font-bold ${
                                  r.rank === 1 ? "text-primary" :
                                  r.rank === 2 ? "text-yellow-500" :
                                  r.rank === 3 ? "text-orange-500" :
                                  "text-muted-foreground"
                                }`}>
                                  {r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-foreground">{r.strategyName}</td>
                              <td className="p-3 text-right font-mono font-bold text-primary">{r.metrics.globalScore.toFixed(1)}</td>
                              <td className="p-3 text-right font-mono text-foreground">{r.metrics.avgHits.toFixed(2)}</td>
                              <td className="p-3 text-right font-mono text-foreground">{r.metrics.bestHits}</td>
                              <td className="p-3 text-right font-mono text-foreground">{(r.metrics.consistency * 100).toFixed(0)}%</td>
                              <td className="p-3 text-right font-mono text-foreground">{r.metrics.diversityScore.toFixed(0)}%</td>
                              <td className="p-3 text-right font-mono text-foreground">{r.metrics.coverageScore.toFixed(0)}%</td>
                              <td className="p-3 text-right font-mono text-foreground">{r.metrics.totalPrizes}</td>
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

        {/* Lab History */}
        {labHistory.length > 0 && (
          <Card className="bg-card/80 backdrop-blur border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground">
                <Star className="w-3.5 h-3.5 text-primary" />
                Histórico de Testes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {labHistory.map((h, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] gap-1">
                    <Crown className="w-2.5 h-2.5 text-primary" />
                    {h.winner} — {h.score.toFixed(1)}
                    <span className="text-muted-foreground ml-1">
                      {new Date(h.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PlanGate>
  );
}

// ═══════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════

function SummaryCard({ icon: Icon, label, value, sub, accent }: {
  icon: any; label: string; value: string; sub: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${
      accent
        ? "bg-gradient-to-br from-primary/10 to-accent/5 border-primary/30"
        : "bg-card/80 border-border"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          accent ? "bg-primary/15" : "bg-muted/30"
        }`}>
          <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className={`text-sm font-bold truncate ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

function RankingCard({ entry: r, pick, isExpanded, onToggle, trendIcon }: {
  entry: RankingEntry; pick: number; isExpanded: boolean;
  onToggle: () => void; trendIcon: (t: string) => JSX.Element;
}) {
  const scorePercent = Math.min(100, r.metrics.globalScore);

  return (
    <Card className={`bg-card/80 backdrop-blur border-border transition-all ${
      r.rank === 1 ? "ring-1 ring-primary/30 bg-primary/[0.03]" : ""
    }`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
            r.rank === 1 ? "bg-primary/15 text-primary ring-2 ring-primary/20" :
            r.rank === 2 ? "bg-yellow-500/15 text-yellow-500" :
            r.rank === 3 ? "bg-orange-500/15 text-orange-500" :
            "bg-muted/20 text-muted-foreground"
          }`}>
            {r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">{r.strategyName}</span>
              {trendIcon(r.trend)}
              {r.rank === 1 && (
                <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20">
                  MELHOR
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden max-w-[120px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${scorePercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
              <span className="text-xs font-mono font-bold text-primary ml-1">
                {r.metrics.globalScore.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <MetricPill label="Média" value={r.metrics.avgHits.toFixed(2)} />
              <MetricPill label="Melhor" value={`${r.metrics.bestHits}/${pick}`} />
              <MetricPill label="Consist." value={`${(r.metrics.consistency * 100).toFixed(0)}%`} />
              <MetricPill label="Prêmios" value={r.metrics.totalPrizes.toString()} highlight={r.metrics.totalPrizes > 0} />
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={onToggle}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pt-3 border-t border-border space-y-3 overflow-hidden"
            >
              <p className="text-xs text-muted-foreground">{r.explanation}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <MiniMetric label="Diversidade" value={`${r.metrics.diversityScore.toFixed(0)}%`} />
                <MiniMetric label="Cobertura" value={`${r.metrics.coverageScore.toFixed(0)}%`} />
                <MiniMetric label="Redundância" value={`${(r.metrics.redundancyIndex * 100).toFixed(0)}%`} />
                <MiniMetric label="Premiações" value={r.metrics.totalPrizes.toString()} />
              </div>
              <div className="text-[10px] text-muted-foreground bg-muted/10 p-2 rounded-lg">
                <span className="font-semibold">Distribuição de acertos: </span>
                {Object.entries(r.metrics.hitDistribution)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .slice(0, 8)
                  .map(([hits, count]) => (
                    <span key={hits} className="inline-flex items-center gap-0.5 mr-2">
                      <span className="font-mono text-foreground">{hits}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-mono text-primary">{count}×</span>
                    </span>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function MetricPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <span className="text-[10px] text-muted-foreground">
      {label}: <span className={`font-mono ${highlight ? "text-primary font-bold" : "text-foreground"}`}>{value}</span>
    </span>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/10 border border-border text-center">
      <div className="text-sm font-mono font-bold text-foreground">{value}</div>
      <div className="text-[9px] text-muted-foreground">{label}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// GENERATED GAMES PANEL
// ═══════════════════════════════════════════════════════

function GeneratedGamesPanel({ generatedGames, lotteryId, pick }: {
  generatedGames: StrategyGames[];
  lotteryId: string;
  pick: number;
}) {
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(
    generatedGames[0]?.strategyId || null
  );
  const [savingGame, setSavingGame] = useState<string | null>(null);
  const [copiedGame, setCopiedGame] = useState<string | null>(null);

  const handleCopy = useCallback((game: number[], gameKey: string) => {
    navigator.clipboard.writeText(game.join(", "));
    setCopiedGame(gameKey);
    toast.success("Jogo copiado!");
    setTimeout(() => setCopiedGame(null), 2000);
  }, []);

  const handleSave = useCallback(async (game: number[], strategyName: string, gameKey: string) => {
    setSavingGame(gameKey);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para salvar jogos");
        return;
      }
      const { error } = await supabase.from("saved_bets").insert({
        user_id: user.id,
        lottery_id: lotteryId,
        numbers: game,
        strategy: `Lab: ${strategyName}`,
        label: `Lab ${strategyName}`,
      });
      if (error) throw error;
      toast.success("Jogo salvo com sucesso!");
    } catch {
      toast.error("Erro ao salvar jogo");
    } finally {
      setSavingGame(null);
    }
  }, [lotteryId]);

  const handleSaveAll = useCallback(async (sg: StrategyGames) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para salvar jogos");
        return;
      }
      const inserts = sg.games.map((game, i) => ({
        user_id: user.id,
        lottery_id: lotteryId,
        numbers: game,
        strategy: `Lab: ${sg.strategyName}`,
        label: `Lab ${sg.strategyName} #${i + 1}`,
      }));
      const { error } = await supabase.from("saved_bets").insert(inserts);
      if (error) throw error;
      toast.success(`${sg.games.length} jogos salvos!`);
    } catch {
      toast.error("Erro ao salvar jogos");
    }
  }, [lotteryId]);

  if (generatedGames.length === 0) {
    return (
      <div className="text-center py-12">
        <Dices className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Nenhum jogo gerado ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {generatedGames.reduce((t, sg) => t + sg.games.length, 0)} jogos gerados em {generatedGames.length} estratégias — ordenados por ranking
        </p>
      </div>

      {generatedGames.map((sg, sIdx) => {
        const isExpanded = expandedStrategy === sg.strategyId;
        return (
          <Card key={sg.strategyId} className={`bg-card/80 backdrop-blur border-border transition-all ${
            sIdx === 0 ? "ring-1 ring-primary/30" : ""
          }`}>
            <CardContent className="p-0">
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/10 transition-colors"
                onClick={() => setExpandedStrategy(isExpanded ? null : sg.strategyId)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  sIdx === 0 ? "bg-primary/15 text-primary" :
                  sIdx === 1 ? "bg-yellow-500/15 text-yellow-500" :
                  sIdx === 2 ? "bg-orange-500/15 text-orange-500" :
                  "bg-muted/20 text-muted-foreground"
                }`}>
                  {sIdx <= 2 ? ["🥇", "🥈", "🥉"][sIdx] : sIdx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{sg.strategyName}</span>
                    <Badge variant="outline" className="text-[9px]">
                      {sg.games.length} jogos
                    </Badge>
                    <Badge variant="secondary" className="text-[9px]">
                      Score {sg.metrics.globalScore.toFixed(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      Média: <span className="font-mono text-foreground">{sg.metrics.avgHits.toFixed(2)}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Melhor: <span className="font-mono text-foreground">{sg.metrics.bestHits}/{pick}</span>
                    </span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5 h-7"
                          onClick={() => handleSaveAll(sg)}
                        >
                          <Save className="w-3 h-3" />
                          Salvar todos ({sg.games.length})
                        </Button>
                      </div>

                      <div className="grid gap-2">
                        {sg.games.map((game, gIdx) => {
                          const gameKey = `${sg.strategyId}-${gIdx}`;
                          return (
                            <div
                              key={gIdx}
                              className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border group hover:border-primary/20 transition-colors"
                            >
                              <span className="text-[10px] font-mono text-muted-foreground w-6 text-right shrink-0">
                                #{gIdx + 1}
                              </span>
                              <div className="flex flex-wrap gap-1.5 flex-1">
                                {game.map((num) => (
                                  <span
                                    key={num}
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20"
                                  >
                                    {num.toString().padStart(2, "0")}
                                  </span>
                                ))}
                              </div>
                              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleCopy(game, gameKey)}
                                >
                                  {copiedGame === gameKey ? (
                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  disabled={savingGame === gameKey}
                                  onClick={() => handleSave(game, sg.strategyName, gameKey)}
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
