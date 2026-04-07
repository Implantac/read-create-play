import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PlanGate } from "@/components/PlanGate";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  runStrategyLab, getStrategiesForLottery,
  LabConfig, LabResult, EvolutionProfile, RankingEntry, StrategyGames,
} from "@/engine/strategy-evolution";
import { rankAllGames, exportGamesCSV, GameQuality, analyzeCombination, CombinationAnalysis } from "@/engine/strategy-evolution/game-quality";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, Trophy, TrendingUp, TrendingDown, Minus,
  Zap, BarChart3, Lightbulb, Target, Shield,
  Play, ChevronDown, ChevronUp, Sparkles, Crown,
  Gauge, Layers, Award, Crosshair, RotateCcw,
  ArrowRight, Star, Percent, Hash, Copy, Save, Dices,
  Check, Settings2, Eye, Download, ChevronRight,
  Activity, CircleDot, Brain, FileDown, RefreshCw,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

const PROFILE_INFO: Record<EvolutionProfile, { label: string; desc: string; icon: any; color: string }> = {
  economico: { label: "Econômico", desc: "Menos jogos, menor custo", icon: Shield, color: "text-blue-500" },
  equilibrado: { label: "Equilibrado", desc: "Melhor custo-benefício", icon: Target, color: "text-primary" },
  agressivo: { label: "Agressivo", desc: "Máxima performance", icon: Zap, color: "text-amber-500" },
  profissional: { label: "Profissional", desc: "Análise completa", icon: Award, color: "text-purple-500" },
  cobertura_extrema: { label: "Cobertura Extrema", desc: "Máxima cobertura numérica", icon: Layers, color: "text-rose-500" },
};

const RANK_COLORS = [
  "hsl(var(--primary))",
  "hsl(45 93% 47%)",
  "hsl(24 75% 50%)",
  "hsl(var(--muted-foreground))",
];

const GRADE_STYLES: Record<string, string> = {
  S: "bg-primary/15 text-primary border-primary/25 ring-1 ring-primary/10",
  A: "bg-green-500/15 text-green-500 border-green-500/25",
  B: "bg-amber-500/15 text-amber-500 border-amber-500/25",
  C: "bg-orange-500/15 text-orange-500 border-orange-500/25",
  D: "bg-destructive/15 text-destructive border-destructive/25",
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ═══════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════

export default function StrategyLabPage() {
  const { config, draws, selectedLottery, stats } = useLotteryContext();

  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [gamesPerStrategy, setGamesPerStrategy] = useState(10);
  const [profile, setProfile] = useState<EvolutionProfile>("equilibrado");
  const [result, setResult] = useState<LabResult | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("ranking");
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [labHistory, setLabHistory] = useState<{ timestamp: number; winner: string; score: number }[]>([]);
  const [configOpen, setConfigOpen] = useState(true);

  const available = useMemo(() => getStrategiesForLottery(config.id), [config.id]);

  // Ranked quality games across ALL strategies
  const rankedGames = useMemo(() => {
    if (!result) return [];
    return rankAllGames(result.generatedGames, config, stats);
  }, [result, config, stats]);

  const combinationAnalysis = useMemo((): CombinationAnalysis | null => {
    if (!result) return null;
    const allGames = result.generatedGames.flatMap(sg => sg.games);
    if (allGames.length === 0) return null;
    return analyzeCombination(allGames, config.numbers);
  }, [result, config.numbers]);

  const prevLotteryRef = useRef(selectedLottery);
  useEffect(() => {
    if (prevLotteryRef.current !== selectedLottery) {
      setResult(null);
      setSelectedStrategies([]);
      prevLotteryRef.current = selectedLottery;
    }
  }, [selectedLottery]);

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
        setConfigOpen(false);

        if (res.bestStrategy) {
          setLabHistory(prev => [{
            timestamp: Date.now(),
            winner: res.bestStrategy!.strategyName,
            score: res.bestStrategy!.metrics.globalScore,
          }, ...prev].slice(0, 10));
        }

        toast.success(`${res.rankings.length} estratégias testadas em ${res.elapsedMs}ms`);
        setActiveTab("bestgames");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao executar laboratório");
      }
      clearInterval(progressInterval);
      setRunning(false);
    }, 200);
  }, [draws, config, selectedStrategies, gamesPerStrategy, drawRange, profile]);

  const handleExportCSV = useCallback(() => {
    if (rankedGames.length === 0) return;
    const csv = exportGamesCSV(rankedGames, config.name);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lab-${config.id}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  }, [rankedGames, config]);

  const trendIcon = (t: string) => {
    if (t === "up") return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
    if (t === "down") return <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  };

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

  const totalGamesGenerated = useMemo(() =>
    result?.generatedGames.reduce((t, sg) => t + sg.games.length, 0) || 0
  , [result]);

  const bestGamesCount = useMemo(() =>
    rankedGames.filter(g => g.grade === "S" || g.grade === "A").length
  , [rankedGames]);

  return (
    <PlanGate feature="estrategias_ml">
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-background to-accent/5 p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 ring-2 ring-primary/20">
              <FlaskConical className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
                Laboratório de Estratégias
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Motor autoevolutivo para <span className="text-primary font-semibold">{config.name}</span> — teste, compare e receba jogos elaborados com backtesting real
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {result && (
                <>
                  <Badge variant="secondary" className="text-xs gap-1.5 py-1.5 px-3">
                    <Activity className="w-3 h-3" />
                    {result.rankings.length} testadas
                  </Badge>
                  <Badge className="text-xs gap-1.5 py-1.5 px-3 bg-primary/10 text-primary border-primary/20">
                    <Dices className="w-3 h-3" />
                    {totalGamesGenerated} jogos
                  </Badge>
                  {bestGamesCount > 0 && (
                    <Badge className="text-xs gap-1.5 py-1.5 px-3 bg-green-500/10 text-green-500 border-green-500/20">
                      <Star className="w-3 h-3" />
                      {bestGamesCount} nota A+
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <LotteryContextBanner />

        {/* Winner Spotlight */}
        <AnimatePresence>
          {result && result.bestStrategy && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary rounded-l-lg" />
                <CardContent className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center text-3xl ring-2 ring-primary/20">
                        🏆
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Campeã do Lab</p>
                        <h2 className="text-lg font-black text-foreground">{result.bestStrategy.strategyName}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{result.bestStrategy.explanation}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 md:gap-4">
                      <MetricBox label="Score" value={result.bestStrategy.metrics.globalScore.toFixed(1)} accent />
                      <MetricBox label="Média" value={result.bestStrategy.metrics.avgHits.toFixed(2)} />
                      <MetricBox label="Melhor" value={`${result.bestStrategy.metrics.bestHits}/${config.pick}`} />
                      <MetricBox label="Consist." value={`${(result.bestStrategy.metrics.consistency * 100).toFixed(0)}%`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Config Panel */}
        <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
          <Card className="bg-card/80 backdrop-blur border-border">
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-muted/5 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Settings2 className="w-4 h-4 text-primary" />
                    Configuração do Laboratório
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {!configOpen && selectedStrategies.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {selectedStrategies.length} estratégias • {gamesPerStrategy} jogos • {PROFILE_INFO[profile].label}
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${configOpen ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-5 pt-0">
                {/* Strategy selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      Estratégias ({selectedStrategies.length}/{available.length})
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">Todas</Button>
                      <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-7 text-muted-foreground">Limpar</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                    {available.map(s => {
                      const isSelected = selectedStrategies.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs transition-all duration-200 ${
                            isSelected
                              ? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/5"
                              : "border-border hover:bg-muted/20 hover:border-muted-foreground/20"
                          }`}
                        >
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleStrategy(s.id)} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-foreground truncate">{s.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">{s.description}</div>
                          </div>
                          <Badge variant="outline" className={`text-[9px] shrink-0 ${
                            s.category === "ai" ? "border-primary/30 text-primary bg-primary/5" :
                            s.category === "math" ? "border-blue-500/30 text-blue-500 bg-blue-500/5" :
                            s.category === "hybrid" ? "border-amber-500/30 text-amber-500 bg-amber-500/5" :
                            "border-muted-foreground/20"
                          }`}>
                            {s.category === "ai" ? "🤖 IA" :
                             s.category === "math" ? "📐 Math" :
                             s.category === "hybrid" ? "⚡ Hybrid" :
                             s.category}
                          </Badge>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2.5">
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
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">3</span>
                      <span className="text-sm font-mono font-black text-primary">{gamesPerStrategy}</span>
                      <span className="text-[10px] text-muted-foreground">30</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                      <Target className="w-3 h-3" />
                      Perfil de Análise
                    </label>
                    <Select value={profile} onValueChange={(v) => { setProfile(v as EvolutionProfile); setResult(null); }}>
                      <SelectTrigger className="h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PROFILE_INFO).map(([k, v]) => (
                          <SelectItem key={k} value={k} className="text-xs">
                            <div className="flex items-center gap-2">
                              <v.icon className={`w-3.5 h-3.5 ${v.color}`} />
                              <span className="font-medium">{v.label}</span>
                              <span className="text-muted-foreground">— {v.desc}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                      <BarChart3 className="w-3 h-3" />
                      Base de Dados
                    </label>
                    <div className="p-3 rounded-xl bg-muted/15 border border-border">
                      <div className="text-sm font-mono font-bold text-foreground">
                        {draws?.length.toLocaleString() || 0} sorteios
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Concurso #{drawRange[0]} → #{drawRange[1]}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Run button */}
                <div className="space-y-3">
                  <Button
                    onClick={runLab}
                    disabled={running || selectedStrategies.length === 0}
                    className="w-full gap-2.5 h-13 text-sm font-bold rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-shadow"
                    size="lg"
                  >
                    {running ? (
                      <>
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Processando {selectedStrategies.length} estratégias...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Executar Laboratório
                        <Badge variant="secondary" className="ml-1 text-[10px] bg-primary-foreground/15">
                          {selectedStrategies.length} × {gamesPerStrategy} = {selectedStrategies.length * gamesPerStrategy} jogos
                        </Badge>
                      </>
                    )}
                  </Button>
                  {running && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
                      <Progress value={progress} className="h-2.5 rounded-full" />
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Gerando, backtestando e calculando métricas...</span>
                        <span className="font-mono font-bold">{progress.toFixed(0)}%</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Action bar */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] gap-1 py-1">
                    ⏱ {result.elapsedMs}ms
                  </Badge>
                  <Badge variant="outline" className="text-[10px] gap-1 py-1">
                    {draws?.length} sorteios analisados
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8" onClick={handleExportCSV}>
                    <FileDown className="w-3 h-3" />
                    Exportar CSV
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8" onClick={() => { setConfigOpen(false); runLab(); }}>
                    <RefreshCw className="w-3 h-3" />
                    Re-executar
                  </Button>
                </div>
              </div>

              {/* Insights Strip */}
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur border-primary/15">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    Insights da Análise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {result.insights.map((insight, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2 p-2.5 rounded-xl bg-background/60 border border-border/50"
                      >
                        <CircleDot className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-foreground leading-relaxed">{insight}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Main Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-7 h-11">
                  <TabsTrigger value="bestgames" className="text-xs gap-1 data-[state=active]:shadow-sm">
                    <Star className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Melhores</span>
                  </TabsTrigger>
                  <TabsTrigger value="ranking" className="text-xs gap-1 data-[state=active]:shadow-sm">
                    <Trophy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ranking</span>
                  </TabsTrigger>
                  <TabsTrigger value="games" className="text-xs gap-1 data-[state=active]:shadow-sm">
                    <Dices className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Jogos</span>
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="text-xs gap-1 data-[state=active]:shadow-sm">
                    <Crosshair className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Análise</span>
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="text-xs gap-1 data-[state=active]:shadow-sm">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Gráficos</span>
                  </TabsTrigger>
                  <TabsTrigger value="suggestions" className="text-xs gap-1 data-[state=active]:shadow-sm">
                    <Brain className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Evolução</span>
                  </TabsTrigger>
                  <TabsTrigger value="comparison" className="text-xs gap-1 data-[state=active]:shadow-sm">
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tabela</span>
                  </TabsTrigger>
                </TabsList>

                {/* ★ Best Games Tab — NEW */}
                <TabsContent value="bestgames" className="mt-4 space-y-4">
                  <BestGamesPanel
                    rankedGames={rankedGames}
                    lotteryId={config.id}
                    lotteryName={config.name}
                    pick={config.pick}
                    maxNum={config.numbers}
                  />
                </TabsContent>

                {/* Ranking Tab */}
                <TabsContent value="ranking" className="space-y-2.5 mt-4">
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2.5">
                    {result.rankings.map((r) => (
                      <motion.div key={r.strategyId} variants={fadeUp}>
                        <RankingCard
                          entry={r}
                          pick={config.pick}
                          isExpanded={showDetails === r.strategyId}
                          onToggle={() => setShowDetails(showDetails === r.strategyId ? null : r.strategyId)}
                          trendIcon={trendIcon}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </TabsContent>

                {/* Generated Games Tab */}
                <TabsContent value="games" className="space-y-4 mt-4">
                  <GeneratedGamesPanel
                    generatedGames={result.generatedGames}
                    lotteryId={config.id}
                    pick={config.pick}
                    maxNum={config.numbers}
                    rankedGames={rankedGames}
                  />
                </TabsContent>

                {/* Combination Analysis Tab */}
                <TabsContent value="analysis" className="mt-4 space-y-4">
                  <CombinationAnalysisPanel analysis={combinationAnalysis} maxNum={config.numbers} />
                </TabsContent>

                {/* Charts Tab */}
                <TabsContent value="charts" className="mt-4 space-y-4">
                  <div className="grid lg:grid-cols-2 gap-4">
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
                            <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                            <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 8 }} domain={[0, "auto"]} />
                            {topNames.map((name, i) => (
                              <Radar key={name} name={name} dataKey={name} stroke={radarColors[i]} fill={radarColors[i]} fillOpacity={0.1} strokeWidth={2} />
                            ))}
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

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
                            <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                            <YAxis type="category" dataKey="name" width={100} tick={{ fill: "hsl(var(--foreground))", fontSize: 10 }} />
                            <RechartsTooltip
                              content={({ payload }) => {
                                if (!payload || payload.length === 0) return null;
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-popover border border-border rounded-lg p-2.5 text-xs shadow-lg">
                                    <p className="font-semibold text-foreground">{d.fullName}</p>
                                    <p className="text-muted-foreground">Score: <span className="font-mono text-primary font-bold">{d.score}</span></p>
                                    <p className="text-muted-foreground">Média acertos: <span className="font-mono">{d.avgHits}</span></p>
                                  </div>
                                );
                              }}
                            />
                            <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                              {barData.map((_, i) => (
                                <Cell key={i} fill={RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)]} fillOpacity={0.85} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

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
                <TabsContent value="suggestions" className="space-y-2.5 mt-4">
                  {result.suggestions.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-14 h-14 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
                        <Brain className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">Sem sugestões de evolução</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">Execute com mais estratégias para gerar recomendações.</p>
                    </div>
                  ) : (
                    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2.5">
                      {result.suggestions.map((s, i) => (
                        <motion.div key={i} variants={fadeUp}>
                          <Card className={`bg-card/80 backdrop-blur border-border overflow-hidden ${
                            s.type === "promote" ? "border-l-[3px] border-l-green-500" :
                            s.type === "discard" ? "border-l-[3px] border-l-destructive" :
                            s.type === "combine" ? "border-l-[3px] border-l-primary" :
                            "border-l-[3px] border-l-amber-500"
                          }`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  s.type === "promote" ? "bg-green-500/10 text-green-500" :
                                  s.type === "discard" ? "bg-destructive/10 text-destructive" :
                                  s.type === "combine" ? "bg-primary/10 text-primary" :
                                  "bg-amber-500/10 text-amber-500"
                                }`}>
                                  {s.type === "promote" ? <TrendingUp className="w-5 h-5" /> :
                                   s.type === "discard" ? <TrendingDown className="w-5 h-5" /> :
                                   s.type === "combine" ? <Sparkles className="w-5 h-5" /> :
                                   <Gauge className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <Badge variant="outline" className={`text-[9px] font-bold ${
                                      s.type === "promote" ? "text-green-500 border-green-500/30" :
                                      s.type === "discard" ? "text-destructive border-destructive/30" :
                                      s.type === "combine" ? "text-primary border-primary/30" :
                                      "text-amber-500 border-amber-500/30"
                                    }`}>
                                      {s.type === "promote" ? "PROMOVER" :
                                       s.type === "discard" ? "DESCARTAR" :
                                       s.type === "combine" ? "COMBINAR" :
                                       "AJUSTAR"}
                                    </Badge>
                                    {s.confidence > 0 && (
                                      <span className="text-[9px] text-muted-foreground font-mono">
                                        Confiança: {(s.confidence * 100).toFixed(0)}%
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-foreground leading-relaxed">{s.reason}</p>
                                  {s.expectedImprovement > 0 && (
                                    <p className="text-[10px] text-primary mt-1 font-medium">
                                      ↗ Melhoria esperada: ~{s.expectedImprovement}%
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </TabsContent>

                {/* Comparison Table Tab */}
                <TabsContent value="comparison" className="mt-4">
                  <Card className="bg-card/80 backdrop-blur border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        Tabela Comparativa
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto -mx-4 px-4">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2.5 px-2 text-muted-foreground font-medium">#</th>
                              <th className="text-left py-2.5 px-2 text-muted-foreground font-medium">Estratégia</th>
                              <th className="text-center py-2.5 px-2 text-muted-foreground font-medium">Score</th>
                              <th className="text-center py-2.5 px-2 text-muted-foreground font-medium">Média</th>
                              <th className="text-center py-2.5 px-2 text-muted-foreground font-medium hidden sm:table-cell">Melhor</th>
                              <th className="text-center py-2.5 px-2 text-muted-foreground font-medium hidden sm:table-cell">Consist.</th>
                              <th className="text-center py-2.5 px-2 text-muted-foreground font-medium hidden md:table-cell">Divers.</th>
                              <th className="text-center py-2.5 px-2 text-muted-foreground font-medium hidden md:table-cell">Cobert.</th>
                              <th className="text-center py-2.5 px-2 text-muted-foreground font-medium">Prêmios</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.rankings.map(r => (
                              <tr key={r.strategyId} className={`border-b border-border/50 transition-colors hover:bg-muted/5 ${r.rank === 1 ? "bg-primary/[0.03]" : ""}`}>
                                <td className="py-2.5 px-2 font-bold text-muted-foreground">{r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}</td>
                                <td className="py-2.5 px-2 font-semibold text-foreground">{r.strategyName}</td>
                                <td className="py-2.5 px-2 text-center">
                                  <span className={`font-mono font-bold ${
                                    r.metrics.globalScore >= 70 ? "text-green-500" :
                                    r.metrics.globalScore >= 40 ? "text-amber-500" : "text-destructive"
                                  }`}>{r.metrics.globalScore.toFixed(1)}</span>
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono text-foreground">{r.metrics.avgHits.toFixed(2)}</td>
                                <td className="py-2.5 px-2 text-center font-mono text-foreground hidden sm:table-cell">{r.metrics.bestHits}/{config.pick}</td>
                                <td className="py-2.5 px-2 text-center font-mono text-foreground hidden sm:table-cell">{(r.metrics.consistency * 100).toFixed(0)}%</td>
                                <td className="py-2.5 px-2 text-center font-mono text-foreground hidden md:table-cell">{r.metrics.diversityScore.toFixed(0)}%</td>
                                <td className="py-2.5 px-2 text-center font-mono text-foreground hidden md:table-cell">{r.metrics.coverageScore.toFixed(0)}%</td>
                                <td className="py-2.5 px-2 text-center">
                                  <span className={`font-mono font-bold ${r.metrics.totalPrizes > 0 ? "text-primary" : "text-muted-foreground"}`}>
                                    {r.metrics.totalPrizes}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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
                  <Badge key={i} variant="outline" className="text-[10px] gap-1.5 py-1 px-2.5">
                    <Crown className="w-2.5 h-2.5 text-primary" />
                    {h.winner} — <span className="font-mono font-bold">{h.score.toFixed(1)}</span>
                    <span className="text-muted-foreground">
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

function MetricBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`text-center p-2.5 rounded-xl border ${accent ? "bg-primary/10 border-primary/20" : "bg-muted/10 border-border"}`}>
      <div className={`text-base font-mono font-black ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
      <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function RankingCard({ entry: r, pick, isExpanded, onToggle, trendIcon }: {
  entry: RankingEntry; pick: number; isExpanded: boolean;
  onToggle: () => void; trendIcon: (t: string) => JSX.Element;
}) {
  const scorePercent = Math.min(100, r.metrics.globalScore);
  const gradeColor = r.metrics.globalScore >= 70 ? "text-green-500" :
                     r.metrics.globalScore >= 40 ? "text-amber-500" : "text-destructive";

  return (
    <Card className={`bg-card/80 backdrop-blur border-border transition-all hover:shadow-md ${
      r.rank === 1 ? "ring-1 ring-primary/30 bg-primary/[0.03] shadow-sm shadow-primary/5" : ""
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
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
                <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 font-bold">CAMPEÃ</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden max-w-[140px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${scorePercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
                />
              </div>
              <span className={`text-xs font-mono font-black ${gradeColor}`}>{r.metrics.globalScore.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <MetricPill label="Média" value={r.metrics.avgHits.toFixed(2)} />
              <MetricPill label="Melhor" value={`${r.metrics.bestHits}/${pick}`} />
              <MetricPill label="Consist." value={`${(r.metrics.consistency * 100).toFixed(0)}%`} />
              <MetricPill label="Prêmios" value={r.metrics.totalPrizes.toString()} highlight={r.metrics.totalPrizes > 0} />
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 shrink-0 rounded-lg" onClick={onToggle}>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-border space-y-3 overflow-hidden"
            >
              <p className="text-xs text-muted-foreground leading-relaxed">{r.explanation}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <MiniMetric label="Diversidade" value={`${r.metrics.diversityScore.toFixed(0)}%`} />
                <MiniMetric label="Cobertura" value={`${r.metrics.coverageScore.toFixed(0)}%`} />
                <MiniMetric label="Redundância" value={`${(r.metrics.redundancyIndex * 100).toFixed(0)}%`} />
                <MiniMetric label="Premiações" value={r.metrics.totalPrizes.toString()} />
              </div>
              <div className="text-[10px] text-muted-foreground bg-muted/10 p-3 rounded-xl border border-border/50">
                <span className="font-semibold text-foreground">Distribuição de acertos: </span>
                {Object.entries(r.metrics.hitDistribution)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .slice(0, 8)
                  .map(([hits, count]) => (
                    <span key={hits} className="inline-flex items-center gap-0.5 mr-2.5">
                      <span className="font-mono text-foreground font-medium">{hits}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-mono text-primary font-bold">{count}×</span>
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
      {label}: <span className={`font-mono ${highlight ? "text-primary font-bold" : "text-foreground font-medium"}`}>{value}</span>
    </span>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-muted/10 border border-border text-center">
      <div className="text-sm font-mono font-bold text-foreground">{value}</div>
      <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ★ BEST GAMES PANEL — Curated top games across all strategies
// ═══════════════════════════════════════════════════════

function QualityBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const color = value >= 80 ? "bg-green-500" : value >= 60 ? "bg-primary" : value >= 40 ? "bg-amber-500" : "bg-destructive";
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="text-muted-foreground flex items-center gap-1 w-20 shrink-0">{icon}{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="font-mono font-bold text-foreground w-8 text-right">{value.toFixed(0)}</span>
    </div>
  );
}

function NumberBall({ num, maxNum }: { num: number; maxNum: number }) {
  const quarterSize = Math.ceil(maxNum / 4);
  const q = Math.min(3, Math.floor((num - 1) / quarterSize));
  const colors = [
    "bg-blue-500/15 text-blue-600 border-blue-500/20 dark:text-blue-400",
    "bg-emerald-500/15 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    "bg-amber-500/15 text-amber-600 border-amber-500/20 dark:text-amber-400",
    "bg-rose-500/15 text-rose-600 border-rose-500/20 dark:text-rose-400",
  ];
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border shadow-sm ${colors[q]}`}>
      {num.toString().padStart(2, "0")}
    </span>
  );
}

/** Mini bar for grade distribution */
function GradeDistributionBar({ groups, total }: { groups: Record<string, number>; total: number }) {
  const grades = ["S", "A", "B", "C", "D"] as const;
  const barColors: Record<string, string> = {
    S: "bg-primary", A: "bg-green-500", B: "bg-amber-500", C: "bg-orange-500", D: "bg-destructive",
  };
  if (total === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex h-3 rounded-full overflow-hidden bg-muted/20">
        {grades.map(g => {
          const pct = (groups[g] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={g}
              className={`${barColors[g]} transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${g}: ${groups[g]} (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[9px] text-muted-foreground">
        {grades.filter(g => groups[g] > 0).map(g => (
          <span key={g} className="flex items-center gap-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${barColors[g]}`} />
            <span className="font-mono font-bold">{g}</span>
            <span>{((groups[g] / total) * 100).toFixed(0)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Smart Pick — highlighted TOP 3 card */
function SmartPickCard({ gq, rank, maxNum, onCopy, onSave, isSaved }: {
  gq: GameQuality; rank: number; maxNum: number;
  onCopy: () => void; onSave: () => void; isSaved: boolean;
}) {
  const medals = ["🥇", "🥈", "🥉"];
  const ringColors = [
    "ring-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30",
    "ring-yellow-500/30 bg-gradient-to-br from-yellow-500/8 via-transparent to-transparent border-yellow-500/20",
    "ring-orange-500/25 bg-gradient-to-br from-orange-500/6 via-transparent to-transparent border-orange-400/15",
  ];
  const evens = gq.game.filter(n => n % 2 === 0).length;
  const odds = gq.game.length - evens;
  const sum = gq.game.reduce((s, n) => s + n, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1, duration: 0.4 }}
    >
      <Card className={`relative overflow-hidden ring-1 ${ringColors[rank]} transition-shadow hover:shadow-lg`}>
        {rank === 0 && <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />}
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{medals[rank]}</span>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  {rank === 0 ? "Melhor jogo" : `#${rank + 1} Smart Pick`}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{gq.strategyName}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className={`text-xs font-mono font-black ${GRADE_STYLES[gq.grade]}`}>
                {gq.grade}
              </Badge>
              <p className="text-lg font-mono font-black text-primary mt-0.5">{gq.overallScore.toFixed(1)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center py-1">
            {gq.game.map(num => <NumberBall key={num} num={num} maxNum={maxNum} />)}
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-1.5 rounded-lg bg-muted/10 border border-border/50">
              <div className="text-[10px] text-muted-foreground">Par/Ímpar</div>
              <div className="text-xs font-mono font-bold text-foreground">{evens}/{odds}</div>
            </div>
            <div className="p-1.5 rounded-lg bg-muted/10 border border-border/50">
              <div className="text-[10px] text-muted-foreground">Soma</div>
              <div className="text-xs font-mono font-bold text-foreground">{sum}</div>
            </div>
            <div className="p-1.5 rounded-lg bg-muted/10 border border-border/50">
              <div className="text-[10px] text-muted-foreground">Faixas</div>
              <div className="text-xs font-mono font-bold text-foreground">{gq.rangeBalance.toFixed(0)}%</div>
            </div>
          </div>

          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5 h-8 rounded-lg" onClick={onCopy}>
              <Copy className="w-3 h-3" /> Copiar
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs gap-1.5 h-8 rounded-lg"
              disabled={isSaved}
              onClick={onSave}
            >
              {isSaved ? <><Check className="w-3 h-3" /> Salvo</> : <><Save className="w-3 h-3" /> Salvar</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BestGamesPanel({ rankedGames, lotteryId, lotteryName, pick, maxNum }: {
  rankedGames: GameQuality[];
  lotteryId: string;
  lotteryName: string;
  pick: number;
  maxNum: number;
}) {
  const [savingGame, setSavingGame] = useState<string | null>(null);
  const [copiedGame, setCopiedGame] = useState<string | null>(null);
  const [savedGames, setSavedGames] = useState<Set<string>>(new Set());
  const [showCount, setShowCount] = useState(15);
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());

  const gradeGroups = useMemo(() => {
    const groups: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    rankedGames.forEach(g => groups[g.grade]++);
    return groups;
  }, [rankedGames]);

  const filteredGames = useMemo(() => {
    if (!gradeFilter) return rankedGames;
    return rankedGames.filter(g => g.grade === gradeFilter);
  }, [rankedGames, gradeFilter]);

  const topGames = useMemo(() => filteredGames.slice(0, showCount), [filteredGames, showCount]);

  const avgScore = useMemo(() => {
    if (rankedGames.length === 0) return 0;
    return rankedGames.reduce((s, g) => s + g.overallScore, 0) / rankedGames.length;
  }, [rankedGames]);

  const top3 = useMemo(() => rankedGames.slice(0, 3), [rankedGames]);
  const restGames = useMemo(() => {
    if (!gradeFilter) return rankedGames.slice(3);
    return rankedGames.filter(g => g.grade === gradeFilter).filter(g => !top3.includes(g));
  }, [rankedGames, gradeFilter, top3]);

  const handleCopy = useCallback((game: number[], key: string) => {
    navigator.clipboard.writeText(game.join(", "));
    setCopiedGame(key);
    toast.success("Jogo copiado!");
    setTimeout(() => setCopiedGame(null), 2000);
  }, []);

  const handleSave = useCallback(async (gq: GameQuality, key: string) => {
    setSavingGame(key);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login para salvar"); return; }
      const { error } = await supabase.from("saved_bets").insert({
        user_id: user.id,
        lottery_id: lotteryId,
        numbers: gq.game,
        strategy: `Lab: ${gq.strategyName}`,
        label: `Lab ${gq.strategyName} [${gq.grade}]`,
        score: Math.round(gq.overallScore),
        grade: gq.grade,
      });
      if (error) throw error;
      setSavedGames(prev => new Set(prev).add(key));
      toast.success("Jogo salvo!");
    } catch {
      toast.error("Erro ao salvar jogo");
    } finally {
      setSavingGame(null);
    }
  }, [lotteryId]);

  const handleSaveBest = useCallback(async () => {
    const best = rankedGames.filter(g => g.grade === "S" || g.grade === "A");
    if (best.length === 0) { toast.info("Nenhum jogo com nota S ou A"); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login para salvar"); return; }
      const inserts = best.map((gq, i) => ({
        user_id: user.id,
        lottery_id: lotteryId,
        numbers: gq.game,
        strategy: `Lab: ${gq.strategyName}`,
        label: `Lab Best #${i + 1} [${gq.grade}]`,
        score: Math.round(gq.overallScore),
        grade: gq.grade,
      }));
      const { error } = await supabase.from("saved_bets").insert(inserts);
      if (error) throw error;
      const ns = new Set(savedGames);
      best.forEach((_, i) => ns.add(`best-${i}`));
      setSavedGames(ns);
      toast.success(`${best.length} melhores jogos salvos!`);
    } catch {
      toast.error("Erro ao salvar jogos");
    }
  }, [rankedGames, lotteryId, savedGames]);

  const handleSaveSelected = useCallback(async () => {
    if (selectedGames.size === 0) { toast.info("Nenhum jogo selecionado"); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login para salvar"); return; }
      const gamesToSave = rankedGames.filter((_, i) => selectedGames.has(`best-${i}`));
      const inserts = gamesToSave.map((gq, i) => ({
        user_id: user.id,
        lottery_id: lotteryId,
        numbers: gq.game,
        strategy: `Lab: ${gq.strategyName}`,
        label: `Lab Selecionado #${i + 1} [${gq.grade}]`,
        score: Math.round(gq.overallScore),
        grade: gq.grade,
      }));
      const { error } = await supabase.from("saved_bets").insert(inserts);
      if (error) throw error;
      const ns = new Set(savedGames);
      gamesToSave.forEach((_, i) => ns.add(`best-${i}`));
      setSavedGames(ns);
      setSelectedGames(new Set());
      toast.success(`${gamesToSave.length} jogos salvos!`);
    } catch {
      toast.error("Erro ao salvar jogos");
    }
  }, [selectedGames, rankedGames, lotteryId, savedGames]);

  const toggleSelect = useCallback((key: string) => {
    setSelectedGames(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    const keys = topGames.map((gq) => `best-${rankedGames.indexOf(gq)}`);
    setSelectedGames(new Set(keys));
  }, [topGames, rankedGames]);

  const deselectAll = useCallback(() => setSelectedGames(new Set()), []);

  if (rankedGames.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
          <Star className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Execute o laboratório para ver os melhores jogos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ★ Smart Pick — TOP 3 hero */}
      {top3.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Smart Pick — Top 3</h3>
            <span className="text-[10px] text-muted-foreground">Melhores jogos de todas as estratégias</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {top3.map((gq, i) => (
              <SmartPickCard
                key={i}
                gq={gq}
                rank={i}
                maxNum={maxNum}
                onCopy={() => handleCopy(gq.game, `smart-${i}`)}
                onSave={() => handleSave(gq, `smart-${i}`)}
                isSaved={savedGames.has(`smart-${i}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* KPIs + Grade Distribution */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="bg-card/80 border-border">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black text-foreground font-mono">{rankedGames.length}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Total de Jogos</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black text-primary font-mono">{gradeGroups.S + gradeGroups.A}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Nota A+ (S + A)</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black text-foreground font-mono">{avgScore.toFixed(1)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Score Médio</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black text-foreground font-mono">
              {rankedGames.length > 0 ? rankedGames[0].overallScore.toFixed(1) : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Melhor Score</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border col-span-2 sm:col-span-1">
          <CardContent className="p-3">
            <GradeDistributionBar groups={gradeGroups} total={rankedGames.length} />
          </CardContent>
        </Card>
      </div>

      {/* Grade filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-muted-foreground font-medium">Filtrar:</span>
        <Badge
          variant={gradeFilter === null ? "default" : "outline"}
          className="text-[10px] cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => setGradeFilter(null)}
        >
          Todos ({rankedGames.length})
        </Badge>
        {(["S", "A", "B", "C", "D"] as const).filter(g => gradeGroups[g] > 0).map(grade => (
          <Badge
            key={grade}
            variant={gradeFilter === grade ? "default" : "outline"}
            className={`text-[10px] cursor-pointer transition-colors font-mono font-bold ${
              gradeFilter !== grade ? GRADE_STYLES[grade] : ""
            }`}
            onClick={() => setGradeFilter(gradeFilter === grade ? null : grade)}
          >
            {grade}: {gradeGroups[grade]}
          </Badge>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            Mostrando {Math.min(showCount + 3, filteredGames.length)} de {filteredGames.length} jogos
            {gradeFilter && ` (nota ${gradeFilter})`}
          </span>
          <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={selectAllVisible}>
            Selecionar todos
          </Button>
          {selectedGames.size > 0 && (
            <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 text-muted-foreground" onClick={deselectAll}>
              Limpar seleção
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedGames.size > 0 && (
            <Button variant="default" size="sm" className="text-xs gap-1.5 h-8" onClick={handleSaveSelected}>
              <Save className="w-3 h-3" />
              Salvar selecionados ({selectedGames.size})
            </Button>
          )}
          <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8" onClick={handleSaveBest}>
            <Save className="w-3 h-3" />
            Salvar nota A+ ({gradeGroups.S + gradeGroups.A})
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500/30 border border-blue-500/30" />Q1</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 border border-emerald-500/30" />Q2</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500/30 border border-amber-500/30" />Q3</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500/30 border border-rose-500/30" />Q4</span>
        <span className="text-muted-foreground/60">— faixas numéricas</span>
      </div>

      {/* Remaining Games List (after top 3) */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
        {(gradeFilter ? filteredGames : restGames).slice(0, showCount).map((gq, i) => {
          const globalIdx = rankedGames.indexOf(gq);
          const key = `best-${globalIdx}`;
          const isSaved = savedGames.has(key);
          const isExpanded = expandedGame === key;
          const isSelected = selectedGames.has(key);
          const displayRank = gradeFilter ? i + 1 : i + 4;
          return (
            <motion.div key={globalIdx} variants={fadeUp}>
              <div className={`rounded-xl border transition-all duration-200 ${
                isSaved ? "bg-primary/5 border-primary/20" :
                isSelected ? "bg-accent/10 border-primary/30 ring-1 ring-primary/20" :
                "bg-muted/5 border-border hover:border-primary/20 hover:bg-muted/10"
              }`}>
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 group">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(key)}
                    className="shrink-0"
                  />

                  {/* Rank + Grade */}
                  <div className="flex flex-col items-center gap-1 shrink-0 w-9">
                    <span className="text-[10px] font-mono text-muted-foreground font-bold">#{displayRank}</span>
                    <Badge variant="outline" className={`text-[9px] font-mono font-black px-1.5 py-0 h-5 ${GRADE_STYLES[gq.grade]}`}>
                      {gq.grade}
                    </Badge>
                  </div>

                  {/* Numbers */}
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 flex-1 min-w-0">
                    {gq.game.map((num) => (
                      <NumberBall key={num} num={num} maxNum={maxNum} />
                    ))}
                  </div>

                  {/* Score + Strategy — visible on all sizes */}
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-sm font-mono font-black text-primary">{gq.overallScore.toFixed(1)}</span>
                    <span className="text-[9px] text-muted-foreground truncate max-w-[80px] sm:max-w-[100px]">{gq.strategyName}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-0.5 sm:gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg" onClick={() => setExpandedGame(isExpanded ? null : key)}>
                      <Eye className={`w-3.5 h-3.5 ${isExpanded ? "text-primary" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg" onClick={() => handleCopy(gq.game, key)}>
                      {copiedGame === key ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg"
                      disabled={savingGame === key || isSaved}
                      onClick={() => handleSave(gq, key)}
                    >
                      {isSaved ? <Check className="w-3.5 h-3.5 text-primary" /> : <Save className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded quality breakdown */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-border/50 space-y-2.5">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-mono font-bold text-primary">{gq.overallScore.toFixed(1)} pts</span>
                          <span className="text-[10px] text-muted-foreground">— {gq.strategyName}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            Soma: <span className="font-mono font-bold text-foreground">{gq.game.reduce((s, n) => s + n, 0)}</span>
                          </span>
                        </div>
                        <QualityBar label="Paridade" value={gq.parityBalance} icon={<Percent className="w-2.5 h-2.5" />} />
                        <QualityBar label="Faixas" value={gq.rangeBalance} icon={<Layers className="w-2.5 h-2.5" />} />
                        <QualityBar label="Soma" value={gq.sumScore} icon={<Hash className="w-2.5 h-2.5" />} />
                        <QualityBar label="Consecutivas" value={gq.consecutiveScore} icon={<Activity className="w-2.5 h-2.5" />} />
                        <QualityBar label="Frequência" value={gq.frequencyScore} icon={<TrendingUp className="w-2.5 h-2.5" />} />
                        <QualityBar label="Gap Mix" value={gq.gapScore} icon={<Gauge className="w-2.5 h-2.5" />} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {showCount < (gradeFilter ? filteredGames : restGames).length && (
        <Button
          variant="outline"
          className="w-full text-xs gap-2"
          onClick={() => setShowCount(prev => Math.min(prev + 15, rankedGames.length))}
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Ver mais ({(gradeFilter ? filteredGames : restGames).length - showCount} restantes)
        </Button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// GENERATED GAMES PANEL (per strategy)
// ═══════════════════════════════════════════════════════

function GeneratedGamesPanel({ generatedGames, lotteryId, pick, maxNum, rankedGames }: {
  generatedGames: StrategyGames[];
  lotteryId: string;
  pick: number;
  maxNum: number;
  rankedGames: GameQuality[];
}) {
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(
    generatedGames[0]?.strategyId || null
  );
  const [savingGame, setSavingGame] = useState<string | null>(null);
  const [copiedGame, setCopiedGame] = useState<string | null>(null);
  const [savedGames, setSavedGames] = useState<Set<string>>(new Set());

  // Create a lookup for game grades
  const gameGradeLookup = useMemo(() => {
    const map = new Map<string, GameQuality>();
    for (const gq of rankedGames) {
      map.set(gq.game.join(","), gq);
    }
    return map;
  }, [rankedGames]);

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
      if (!user) { toast.error("Faça login para salvar jogos"); return; }
      const gq = gameGradeLookup.get(game.join(","));
      const { error } = await supabase.from("saved_bets").insert({
        user_id: user.id,
        lottery_id: lotteryId,
        numbers: game,
        strategy: `Lab: ${strategyName}`,
        label: `Lab ${strategyName}${gq ? ` [${gq.grade}]` : ""}`,
        score: gq ? Math.round(gq.overallScore) : null,
        grade: gq?.grade || null,
      });
      if (error) throw error;
      setSavedGames(prev => new Set(prev).add(gameKey));
      toast.success("Jogo salvo!");
    } catch {
      toast.error("Erro ao salvar jogo");
    } finally {
      setSavingGame(null);
    }
  }, [lotteryId, gameGradeLookup]);

  const handleSaveAll = useCallback(async (sg: StrategyGames) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login para salvar jogos"); return; }
      const inserts = sg.games.map((game, i) => {
        const gq = gameGradeLookup.get(game.join(","));
        return {
          user_id: user.id,
          lottery_id: lotteryId,
          numbers: game,
          strategy: `Lab: ${sg.strategyName}`,
          label: `Lab ${sg.strategyName} #${i + 1}${gq ? ` [${gq.grade}]` : ""}`,
          score: gq ? Math.round(gq.overallScore) : null,
          grade: gq?.grade || null,
        };
      });
      const { error } = await supabase.from("saved_bets").insert(inserts);
      if (error) throw error;
      const newSaved = new Set(savedGames);
      sg.games.forEach((_, i) => newSaved.add(`${sg.strategyId}-${i}`));
      setSavedGames(newSaved);
      toast.success(`${sg.games.length} jogos salvos!`);
    } catch {
      toast.error("Erro ao salvar jogos");
    }
  }, [lotteryId, savedGames, gameGradeLookup]);

  if (generatedGames.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
          <Dices className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Nenhum jogo gerado</p>
      </div>
    );
  }

  const totalGames = generatedGames.reduce((t, sg) => t + sg.games.length, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-[10px] gap-1 py-1">
          <Dices className="w-3 h-3" />
          {totalGames} jogos
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          em {generatedGames.length} estratégias — ordenados por ranking
        </span>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2.5">
        {generatedGames.map((sg, sIdx) => {
          const isExpanded = expandedStrategy === sg.strategyId;
          return (
            <motion.div key={sg.strategyId} variants={fadeUp}>
              <Card className={`bg-card/80 backdrop-blur border-border transition-all overflow-hidden ${
                sIdx === 0 ? "ring-1 ring-primary/30 shadow-sm shadow-primary/5" : "hover:shadow-sm"
              }`}>
                <CardContent className="p-0">
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/5 transition-colors"
                    onClick={() => setExpandedStrategy(isExpanded ? null : sg.strategyId)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      sIdx === 0 ? "bg-primary/15 text-primary ring-2 ring-primary/20" :
                      sIdx === 1 ? "bg-yellow-500/15 text-yellow-500" :
                      sIdx === 2 ? "bg-orange-500/15 text-orange-500" :
                      "bg-muted/20 text-muted-foreground"
                    }`}>
                      {sIdx <= 2 ? ["🥇", "🥈", "🥉"][sIdx] : sIdx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">{sg.strategyName}</span>
                        <Badge variant="outline" className="text-[9px] gap-1">
                          <Dices className="w-2.5 h-2.5" />
                          {sg.games.length} jogos
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] font-mono font-bold">
                          {sg.metrics.globalScore.toFixed(1)} pts
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          Média: <span className="font-mono text-foreground font-medium">{sg.metrics.avgHits.toFixed(2)}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Melhor: <span className="font-mono text-foreground font-medium">{sg.metrics.bestHits}/{pick}</span>
                        </span>
                        {sg.metrics.totalPrizes > 0 && (
                          <span className="text-[10px] text-primary font-semibold">
                            🎯 {sg.metrics.totalPrizes} prêmios
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <Separator />
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                              Jogos gerados
                            </span>
                            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 rounded-lg" onClick={() => handleSaveAll(sg)}>
                              <Save className="w-3 h-3" />
                              Salvar todos ({sg.games.length})
                            </Button>
                          </div>

                          <div className="grid gap-2">
                            {sg.games.map((game, gIdx) => {
                              const gameKey = `${sg.strategyId}-${gIdx}`;
                              const isSaved = savedGames.has(gameKey);
                              const gq = gameGradeLookup.get(game.join(","));
                              return (
                                <div
                                  key={gIdx}
                                  className={`flex items-center gap-3 p-3 rounded-xl border group transition-all duration-200 ${
                                    isSaved ? "bg-primary/5 border-primary/20" :
                                    "bg-muted/5 border-border hover:border-primary/20 hover:bg-muted/10"
                                  }`}
                                >
                                  <div className="flex flex-col items-center gap-0.5 shrink-0 w-8">
                                    <span className="text-[10px] font-mono text-muted-foreground font-bold">#{gIdx + 1}</span>
                                    {gq && (
                                      <Badge variant="outline" className={`text-[8px] font-mono font-black px-1 py-0 h-4 ${GRADE_STYLES[gq.grade]}`}>
                                        {gq.grade}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 flex-1">
                                    {game.map((num) => (
                                      <NumberBall key={num} num={num} maxNum={maxNum} />
                                    ))}
                                  </div>
                                  <div className="flex gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => handleCopy(game, gameKey)}>
                                      {copiedGame === gameKey ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </Button>
                                    <Button
                                      variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg"
                                      disabled={savingGame === gameKey || isSaved}
                                      onClick={() => handleSave(game, sg.strategyName, gameKey)}
                                    >
                                      {isSaved ? <Check className="w-3.5 h-3.5 text-primary" /> : <Save className="w-3.5 h-3.5" />}
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
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// COMBINATION ANALYSIS PANEL
// ═══════════════════════════════════════════════════════

function CombinationAnalysisPanel({ analysis, maxNum }: { analysis: CombinationAnalysis | null; maxNum: number }) {
  if (!analysis) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
          <Crosshair className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Execute o laboratório para ver a análise combinatória.</p>
      </div>
    );
  }

  // Build heatmap data — frequency of each number across all games
  const heatmapData = useMemo(() => {
    const data: { num: number; count: number; pct: number }[] = [];
    const maxCount = Math.max(...analysis.numberFrequency.values(), 1);
    for (let n = 1; n <= maxNum; n++) {
      const count = analysis.numberFrequency.get(n) || 0;
      data.push({ num: n, count, pct: (count / maxCount) * 100 });
    }
    return data;
  }, [analysis, maxNum]);

  const barChartData = useMemo(() =>
    [...analysis.numberFrequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([num, count]) => ({ num: num.toString().padStart(2, "0"), count })),
  [analysis]);

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/80 border-border">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black text-primary font-mono">{analysis.coveragePercent.toFixed(0)}%</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Cobertura Numérica</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black text-foreground font-mono">{analysis.avgOverlap.toFixed(1)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Sobreposição Média</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black text-foreground font-mono">{analysis.numberFrequency.size}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Números Únicos</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black text-foreground font-mono">{analysis.pairFrequency.size}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Pares Únicos</div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card className="bg-card/80 backdrop-blur border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <Crosshair className="w-3.5 h-3.5 text-primary" />
            Mapa de Calor — Frequência dos Números nos Jogos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {heatmapData.map(d => {
              const intensity = d.pct;
              const bg = intensity === 0
                ? "bg-muted/20 text-muted-foreground/40"
                : intensity >= 80
                  ? "bg-primary/80 text-primary-foreground"
                  : intensity >= 60
                    ? "bg-primary/50 text-primary-foreground"
                    : intensity >= 40
                      ? "bg-primary/30 text-foreground"
                      : intensity >= 20
                        ? "bg-primary/15 text-foreground"
                        : "bg-primary/5 text-muted-foreground";
              return (
                <div
                  key={d.num}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${bg}`}
                  title={`${d.num}: ${d.count} aparições`}
                >
                  {d.num.toString().padStart(2, "0")}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 text-[9px] text-muted-foreground">
            <span>Frio</span>
            <div className="flex gap-0.5">
              <div className="w-5 h-2.5 rounded bg-primary/5" />
              <div className="w-5 h-2.5 rounded bg-primary/15" />
              <div className="w-5 h-2.5 rounded bg-primary/30" />
              <div className="w-5 h-2.5 rounded bg-primary/50" />
              <div className="w-5 h-2.5 rounded bg-primary/80" />
            </div>
            <span>Quente</span>
          </div>
        </CardContent>
      </Card>

      {/* Top 20 most used numbers bar chart */}
      <Card className="bg-card/80 backdrop-blur border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            Top 20 — Números Mais Utilizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barChartData}>
              <XAxis dataKey="num" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <RechartsTooltip
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-2 text-xs shadow-lg">
                      <p className="font-semibold text-foreground">Número {d.num}</p>
                      <p className="text-muted-foreground">{d.count} aparições nos jogos</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Hot & Cold numbers */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-green-500">
              <TrendingUp className="w-3.5 h-3.5" />
              Números Mais Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {analysis.hotNumbers.map(n => (
                <NumberBall key={n} num={n} maxNum={maxNum} />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-blue-500">
              <TrendingDown className="w-3.5 h-3.5" />
              Números Menos Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {analysis.coldNumbers.map(n => (
                <NumberBall key={n} num={n} maxNum={maxNum} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
