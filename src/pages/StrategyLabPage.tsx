import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PlanGate } from "@/components/PlanGate";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BacktestDashboard } from "@/components/lab/backtest/BacktestDashboard";
import { runBacktest, BacktestResult } from "@/engine/strategy-lab/backtest-engine";
import { LOTTERY_BET_COST } from "@/engine/betting-budget";
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
  LabConfig, LabResult, EvolutionProfile,
} from "@/engine/strategy-evolution";
import { rankAllGames, exportGamesCSV, analyzeCombination, CombinationAnalysis } from "@/engine/strategy-evolution/game-quality";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, Trophy, TrendingUp, TrendingDown,
  Zap, BarChart3, Lightbulb, Target,
  Play, ChevronDown, Sparkles, Crown,
  Gauge, Layers, Award,
  Star, Hash, Dices,
  Settings2,
  Activity, CircleDot, Brain, FileDown, RefreshCw,
} from "lucide-react";
import { generateRandomGames } from "@/engine/stats/baseline-benchmark";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";

// Extracted sub-components
import { PROFILE_INFO, RANK_COLORS, stagger, fadeUp, trendIcon, MetricBox } from "@/components/lab/LabShared";
import { RankingCard } from "@/components/lab/RankingCard";
import { BestGamesPanel } from "@/components/lab/BestGamesPanel";
import { GeneratedGamesPanel } from "@/components/lab/GeneratedGamesPanel";
import { CombinationAnalysisPanel } from "@/components/lab/CombinationAnalysisPanel";
import { ComparisonTablePanel } from "@/components/lab/ComparisonTablePanel";

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
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [labHistory, setLabHistory] = useState<{ timestamp: number; winner: string; score: number }[]>([]);
  const [configOpen, setConfigOpen] = useState(true);
  const [customDrawRange, setCustomDrawRange] = useState<[number, number] | null>(null);
  const [enableShuffledBacktest, setEnableShuffledBacktest] = useState(true);

  const available = useMemo(() => getStrategiesForLottery(config.id), [config.id]);

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
    if (customDrawRange) return customDrawRange;
    if (!draws || draws.length === 0) return [1, 1];
    const sorted = [...draws].sort((a, b) => a.concurso - b.concurso);
    return [sorted[0].concurso, sorted[sorted.length - 1].concurso];
  }, [draws, customDrawRange]);

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

        const testWindowSize = 200; // Aumentado para maior significância
        const randomGames = generateRandomGames(config, gamesPerStrategy);
        const randomBacktest = runBacktest(
          "random_baseline",
          "Random Baseline (Sorteio Puro)",
          randomGames,
          draws.slice(-testWindowSize),
          config,
          LOTTERY_BET_COST[config.id] || 3.5,
          1000,
          false // Don't shuffle random
        );

        const backtests: BacktestResult[] = res.generatedGames.map(sg => {
          return runBacktest(
            sg.strategyId,
            sg.strategyName,
            sg.games,
            draws.slice(-testWindowSize),
            config,
            LOTTERY_BET_COST[config.id] || 3.5,
            1000, 
            enableShuffledBacktest
          );
        });

        // Add random baseline and sort
        const finalBacktests = [randomBacktest, ...backtests].sort((a, b) => b.metrics.roi - a.metrics.roi);
        setBacktestResults(finalBacktests);
        toast.success(`${formatNumber(res.rankings.length)} estratégias testadas em ${formatNumber(res.elapsedMs)}ms`);
        setActiveTab("backtest");
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

  // Executive summary data
  const executiveSummary = useMemo(() => {
    if (!result || rankedGames.length === 0) return null;
    const sCount = rankedGames.filter(g => g.grade === "S").length;
    const aCount = rankedGames.filter(g => g.grade === "A").length;
    const avgScore = rankedGames.reduce((s, g) => s + g.overallScore, 0) / rankedGames.length;
    const bestStrategy = result.rankings[0];
    const worstStrategy = result.rankings[result.rankings.length - 1];
    const scoreDiff = bestStrategy && worstStrategy
      ? bestStrategy.metrics.globalScore - worstStrategy.metrics.globalScore
      : 0;
    const consistentCount = result.rankings.filter(r => r.metrics.consistency > 0.6).length;
    const prizeCount = result.rankings.filter(r => r.metrics.totalPrizes > 0).length;
    
    const recommendations: { icon: string; text: string; priority: "high" | "medium" | "low" }[] = [];
    if (sCount + aCount > 0) {
      recommendations.push({ icon: "🎯", text: `Use os ${sCount + aCount} jogos nota S/A como base principal de apostas`, priority: "high" });
    }
    if (bestStrategy && bestStrategy.metrics.consistency > 0.7) {
      recommendations.push({ icon: "🔄", text: `${bestStrategy.strategyName} é confiável — priorize para apostas recorrentes`, priority: "high" });
    }
    if (scoreDiff > 30) {
      recommendations.push({ icon: "⚠️", text: `Grande variação entre estratégias (${formatNumber(scoreDiff)} pts) — foque nas top 3`, priority: "medium" });
    }
    if (consistentCount < result.rankings.length * 0.3) {
      recommendations.push({ icon: "📊", text: "Poucas estratégias consistentes — aumente o volume de jogos para estabilizar", priority: "medium" });
    }
    if (prizeCount > 0) {
      recommendations.push({ icon: "💰", text: `${prizeCount} estratégia(s) geraram premiações no backtesting — resultados promissores`, priority: "low" });
    }
    if (combinationAnalysis && combinationAnalysis.coveragePercent < 60) {
      recommendations.push({ icon: "🔢", text: "Cobertura numérica baixa — considere adicionar mais estratégias de dispersão", priority: "medium" });
    }

    return { sCount, aCount, avgScore, scoreDiff, consistentCount, prizeCount, recommendations };
  }, [result, rankedGames, combinationAnalysis]);

  return (
    <PlanGate feature="estrategias_ml">
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 px-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-[0.2em] italic">Evolutionary Lab v5.3</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">
              Laboratório de <span className="gradient-brand-text">Estratégias</span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium max-w-md">Motor autoevolutivo para testes de integridade e simulação de backtesting real.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {result && (
              <>
                <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest gap-2 py-2 px-4 rounded-xl shadow-lg border-white/5 bg-secondary/40 backdrop-blur-md italic">
                  <Activity className="w-3.5 h-3.5" />
                  {formatNumber(result.rankings.length)} Testes
                </Badge>
                <Badge className="text-[10px] font-black uppercase tracking-widest gap-2 py-2 px-4 rounded-xl shadow-lg bg-primary/10 text-primary border-primary/20 italic">
                  <Dices className="w-3.5 h-3.5" />
                  {formatNumber(totalGamesGenerated)} Jogos
                </Badge>
              </>
            )}
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 pointer-events-none" />
          <LotteryContextBanner />
        </div>

        {/* Winner Spotlight */}
        <AnimatePresence>
          {result && result.bestStrategy && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Card className="relative overflow-hidden border-primary/30 bg-primary/[0.02] rounded-[2.5rem] shadow-2xl group active:scale-[0.99] transition-all">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                <CardContent className="p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                    <Trophy className="w-40 h-40" />
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center gap-10 relative z-10">
                    <div className="flex items-center gap-8 flex-1">
                      <div className="w-24 h-24 rounded-[2rem] gradient-brand flex items-center justify-center text-5xl shadow-2xl group-hover:scale-110 transition-transform duration-500">
                        🏆
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-primary font-black italic opacity-60 leading-none">Alpha Winner v4.0</p>
                        <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter italic leading-none">{result.bestStrategy.strategyName}</h2>
                        <p className="text-xs text-muted-foreground font-medium italic opacity-60 leading-relaxed max-w-md">Estratégia de elite detectada pela rede neural com alta taxa de convergência estatística.</p>

                      </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
                      <MetricBox label="Alpha Score" value={formatNumber(result.bestStrategy.metrics.globalScore)} accent />
                      <MetricBox label="Média Hits" value={formatNumber(result.bestStrategy.metrics.avgHits)} />
                      <MetricBox label="Recorde" value={`${formatNumber(result.bestStrategy.metrics.bestHits)}/${formatNumber(config.pick)}`} />
                      <MetricBox label="Dataset SYNC" value={`${formatNumber(Math.round(result.bestStrategy.metrics.consistency * 100))}%`} />
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
                        {formatNumber(selectedStrategies.length)} estratégias • {formatNumber(gamesPerStrategy)} jogos • {PROFILE_INFO[profile].label}
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${configOpen ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-5 pt-0">
                {/* Configuration: Strategies + Window Selection */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Column 1: Strategy Selection */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        Estratégias para Testar ({selectedStrategies.length})
                      </span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={selectAll} className="text-[10px] h-6 px-2">Selecionar Todas</Button>
                        <Button variant="ghost" size="sm" onClick={clearAll} className="text-[10px] h-6 px-2 text-muted-foreground">Limpar</Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
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
                              "border-muted-foreground/20"
                            }`}>
                              {s.category === "ai" ? "🤖 IA" :
                               s.category === "math" ? "📐 Math" :
                               s.category}
                            </Badge>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 2: Parameters & Time Window */}
                  <div className="space-y-6">
                    {/* Time Window Section */}
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">
                        Janela Temporal (Backtest)
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[10, 30, 50, 100, 200, 500].map(window => {
                          if (!draws || draws.length < 10) return null;
                          const sorted = [...draws].sort((a, b) => b.concurso - a.concurso);
                          const currentEnd = sorted[0].concurso;
                          const currentStart = sorted[Math.min(window - 1, sorted.length - 1)].concurso;
                          const isActive = customDrawRange && customDrawRange[0] === currentStart && customDrawRange[1] === currentEnd;
                          
                          return (
                            <Button
                              key={window}
                              variant={isActive ? "default" : "outline"}
                              size="sm"
                              disabled={draws.length < window && window !== 500}
                              className={`text-[10px] h-8 ${isActive ? "bg-primary" : ""}`}
                              onClick={() => setCustomDrawRange([currentStart, currentEnd])}
                            >
                              Últimos {window}
                            </Button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">
                        Testando do concurso {drawRange[0]} ao {drawRange[1]} ({drawRange[1] - drawRange[0] + 1} sorteios)
                      </p>
                    </div>

                    {/* Simulation Parameters */}
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                          <span>Jogos por Estratégia</span>
                          <span className="text-foreground">{gamesPerStrategy}</span>
                        </div>
                        <Slider
                          value={[gamesPerStrategy]}
                          onValueChange={([v]) => setGamesPerStrategy(v)}
                          max={50} min={1} step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Perfil Evolutivo</span>
                        <div className="grid grid-cols-3 gap-1">
                          {(["economico", "equilibrado", "agressivo"] as const).map(p => (
                            <Button
                              key={p}
                              variant={profile === p ? "default" : "outline"}
                              size="sm"
                              className="text-[10px] h-7 px-1 capitalize"
                              onClick={() => setProfile(p)}
                            >
                              {p}
                            </Button>
                          ))}
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-primary border-primary/20 bg-primary/5">Integrity Guard</Badge>
                      </div>
                      <div className="flex items-start gap-4">
                        <Checkbox 
                          id="shuffled-backtest" 
                          checked={enableShuffledBacktest}
                          onCheckedChange={(checked) => setEnableShuffledBacktest(!!checked)}
                          className="mt-1"
                        />
                        <div className="space-y-1">
                          <label htmlFor="shuffled-backtest" className="text-xs font-black uppercase tracking-wider cursor-pointer text-foreground flex items-center gap-2">
                            Shuffled Backtest (Integridade Temporal)
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] font-bold">RECOMENDADO</Badge>
                          </label>
                          <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                            Embaralha a ordem dos sorteios para detectar se a estratégia realmente captura tendências temporais ou se apenas deu sorte em números frequentes (combate o overfitting).
                          </p>
                        </div>
                      </div>
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

              {/* Executive Summary */}
              {executiveSummary && (
                <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 backdrop-blur border-primary/15 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-primary/40 to-transparent" />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      Resumo Executivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-center">
                        <div className="text-lg font-black font-mono text-primary">{executiveSummary.sCount}</div>
                        <div className="text-[9px] text-muted-foreground">Nota S</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                        <div className="text-lg font-black font-mono text-green-500">{executiveSummary.aCount}</div>
                        <div className="text-[9px] text-muted-foreground">Nota A</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/10 border border-border text-center">
                        <div className="text-lg font-black font-mono text-foreground">{executiveSummary.avgScore.toFixed(1)}</div>
                        <div className="text-[9px] text-muted-foreground">Score Médio</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/10 border border-border text-center">
                        <div className="text-lg font-black font-mono text-foreground">{executiveSummary.consistentCount}</div>
                        <div className="text-[9px] text-muted-foreground">Consistentes</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/10 border border-border text-center">
                        <div className="text-lg font-black font-mono text-foreground">{executiveSummary.prizeCount}</div>
                        <div className="text-[9px] text-muted-foreground">Com Prêmios</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/10 border border-border text-center">
                        <div className="text-lg font-black font-mono text-foreground">{executiveSummary.scoreDiff.toFixed(0)}</div>
                        <div className="text-[9px] text-muted-foreground">Δ Score</div>
                      </div>
                    </div>

                    {executiveSummary.recommendations.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Recomendações</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {executiveSummary.recommendations.map((rec, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className={`flex items-start gap-2 p-2.5 rounded-xl border ${
                                rec.priority === "high" ? "bg-primary/5 border-primary/20" :
                                rec.priority === "medium" ? "bg-amber-500/5 border-amber-500/15" :
                                "bg-background/60 border-border/50"
                              }`}
                            >
                              <span className="text-sm shrink-0">{rec.icon}</span>
                              <p className="text-xs text-foreground leading-relaxed">{rec.text}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Insights</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                        {result.insights.map((insight, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-background/60 border border-border/50">
                            <CircleDot className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                            <p className="text-[11px] text-foreground leading-relaxed">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Main Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="overflow-x-auto -mx-1 px-1 scrollbar-thin">
                  <TabsList className="inline-flex w-full min-w-[640px] sm:min-w-0 sm:grid sm:grid-cols-8 h-11">
                    <TabsTrigger value="backtest" className="text-xs gap-1 data-[state=active]:shadow-sm">
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Backtest</span>
                    </TabsTrigger>
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
                      <Target className="w-3.5 h-3.5" />
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
                </div>

                <TabsContent value="backtest" className="mt-6 space-y-6">
                  <BacktestDashboard results={backtestResults} />
                </TabsContent>

                <TabsContent value="bestgames" className="mt-4 space-y-4">
                  <BestGamesPanel
                    rankedGames={rankedGames}
                    lotteryId={config.id}
                    lotteryName={config.name}
                    pick={config.pick}
                    maxNum={config.numbers}
                  />
                </TabsContent>

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

                <TabsContent value="games" className="space-y-4 mt-4">
                  <GeneratedGamesPanel
                    generatedGames={result.generatedGames}
                    lotteryId={config.id}
                    pick={config.pick}
                    maxNum={config.numbers}
                    rankedGames={rankedGames}
                  />
                </TabsContent>

                <TabsContent value="analysis" className="mt-4 space-y-4">
                  <CombinationAnalysisPanel analysis={combinationAnalysis} maxNum={config.numbers} />
                </TabsContent>

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

                <TabsContent value="comparison" className="mt-4 space-y-4">
                  <ComparisonTablePanel rankings={result.rankings} pick={config.pick} />
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
