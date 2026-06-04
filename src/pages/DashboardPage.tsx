import { useCallback, useEffect, useMemo, useState, memo, lazy, Suspense } from "react";
import { DrawResult } from "@/data/lotteries";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { StatsCard } from "@/components/common/StatsCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { TechnicalIndicators } from "@/components/TechnicalIndicators";
import { AlphaMomentumSignal } from "@/components/AlphaMomentumSignal";
import { m, AnimatePresence } from "framer-motion";
import { 
  BarChart3, Loader2, RefreshCw, Sparkles, FlaskConical, PieChart, 
  Brain, Clover, X, Crown, History, Info, Terminal, Zap, Search, 
  ShieldCheck, CheckCircle2, TrendingUp, ActivitySquare, Activity as LucideActivity 
} from "lucide-react";

// Lazy loaded components for performance
const FrequencyChart = lazy(() => import("@/components/FrequencyChart").then(m => ({ default: m.FrequencyChart })));
const HeatmapGrid = lazy(() => import("@/components/HeatmapGrid").then(m => ({ default: m.HeatmapGrid })));
const RecentDraws = lazy(() => import("@/components/RecentDraws").then(m => ({ default: m.RecentDraws })));
const SumChart = lazy(() => import("@/components/SumChart").then(m => ({ default: m.SumChart })));
const ParityChart = lazy(() => import("@/components/ParityChart").then(m => ({ default: m.ParityChart })));
const ConsecutiveChart = lazy(() => import("@/components/ConsecutiveChart").then(m => ({ default: m.ConsecutiveChart })));
const RangeDistribution = lazy(() => import("@/components/RangeDistribution").then(m => ({ default: m.RangeDistribution })));
const DelayChart = lazy(() => import("@/components/DelayChart").then(m => ({ default: m.DelayChart })));
const AutoUpdater = lazy(() => import("@/components/AutoUpdater").then(m => ({ default: m.AutoUpdater })));
const TitanCommandCenter = lazy(() => import("@/components/TitanCommandCenter").then(m => ({ default: m.TitanCommandCenter })));
const NeuralSynergyCore = lazy(() => import("@/components/NeuralSynergyCore").then(m => ({ default: m.NeuralSynergyCore })));

const Activity = LucideActivity;
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { runIntelligentPipeline } from "@/ai/knowledge/strategiesLibrary";
import { useSavedBets } from "@/hooks/useSavedBets";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";
import { calculateAnalyticsSnapshot, getComplianceNotice } from "@/engine/stats/analytics-core";
import { Skeleton } from "@/components/ui/skeleton";
import { TitanScoreBadge } from "@/components/TitanScoreBadge";
import { evaluateBetQuality } from "@/engine/stats/bet-quality";
import { StrategyBriefingPanel } from "@/components/StrategyBriefingPanel";
import { BettingBudgetPlanner } from "@/components/BettingBudgetPlanner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const quickLinks = [
  { title: "Gerador", description: "Gerar jogos inteligentes", icon: Sparkles, url: "/gerador", color: "text-primary" },
  { title: "Simulações", description: "Testar contra o histórico", icon: FlaskConical, url: "/simulacoes", color: "text-neon-blue", badge: "Monte Carlo" },
  { title: "Estatísticas", description: "Análise consolidada", icon: PieChart, url: "/estatisticas", color: "text-accent" },
  { title: "Estratégias IA", description: "Machine Learning e IA", icon: Brain, url: "/estrategias", color: "text-neon-purple" },
];

const DashboardPage = () => {
  const { config, draws, drawsWithPrizes, loading, syncing, lastSyncAt, syncError, stats, sumData, syncDraws, syncAllLotteries, addDraw, selectedLottery } = useLotteryContext();
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");
  const { savedBets, limit, remaining, isAtLimit } = useSavedBets(selectedLottery);
  const { currentPlan } = usePlanAccess();
  const { profile, trialDaysLeft, isTrialExpired, isAdmin, isSuperAdmin } = useAuth();
  const [luckyGame, setLuckyGame] = useState<any | null>(null);
  const [generatingLucky, setGeneratingLucky] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);
  const { history, saveGeneration } = useGenerationHistory(selectedLottery);

  const analytics = useMemo(() => calculateAnalyticsSnapshot(stats, draws), [stats, draws]);
  const heatingCount = useMemo(() => stats.filter(s => s.trend > 15).length, [stats]);

  const handleNewDraw = useCallback((draw: DrawResult) => addDraw(draw), [addDraw]);

  const handleSyncManual = useCallback(async () => {
    setSyncStatus("idle");
    const result = await syncDraws();
    if (result && result.success) {
      setSyncStatus("success");
      setTimeout(() => setSyncStatus("idle"), 3000);
    } else {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 5000);
    }
  }, [syncDraws]);

  const generateLuckyGame = useCallback(() => {
    if (stats.length === 0 || draws.length === 0) return;
    setGeneratingLucky(true);
    setLuckyGame(null);
    setTimeout(async () => {
      const strategies = ["frequency", "balance", "coverage", "dispersion", "delay", "anti_pattern"];
      const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];
      const result = runIntelligentPipeline(stats, draws, selectedLottery, randomStrategy, 1);
      if (result.games.length > 0) {
        const bet = result.games[0];
        const qualityReport = evaluateBetQuality(bet, stats, config, draws);
        const gameData = { numbers: bet, score: qualityReport.overall, strategy: result.strategy.name, description: result.strategy.description, pipeline: result.pipeline };
        setLuckyGame(gameData);
        await saveGeneration(gameData);
      }
      setGeneratingLucky(false);
    }, 1500);
  }, [stats, draws, selectedLottery, saveGeneration, config]);

  return (
    <div className="space-y-6 pb-12 relative">
      <PageHeader
        title="Terminal de Inteligência"
        description={`Análise de precisão institucional — ${config.name}`}
        icon={BarChart3}
        badge={draws.length > 0 ? `${draws.length} sorteios` : undefined}
      >
        <div className="flex items-center gap-2">
          {lastSyncAt && (
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Última Sincronização</span>
              <span className="text-xs font-mono text-primary/80">{new Date(lastSyncAt).toLocaleTimeString("pt-BR")}</span>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleSyncManual}
            disabled={syncing}
            className="transition-all duration-300 gap-2"
          >
            {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{syncing ? "Sincronizando..." : "Atualizar Dados"}</span>
          </Button>
        </div>
      </PageHeader>
      
      <LotteryContextBanner />

      <AnimatePresence mode="wait">
        {syncError && (
          <m.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-destructive">Falha na Sincronização</p>
                <p className="text-xs text-destructive/80">{syncError}</p>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {draws.length > 0 && (
        <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <StrategyBriefingPanel config={config} stats={stats} draws={draws} />
          <BettingBudgetPlanner config={config} stats={stats} draws={draws} compact />
        </div>
      )}
      
      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
        <TitanCommandCenter />
      </Suspense>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Terminal className="w-3 h-3 text-primary" /> Indicadores Técnicos
          </h3>
          <TechnicalIndicators analytics={analytics} />
        </div>
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Zap className="w-3 h-3 text-accent" /> Alpha Momentum Signal
          </h3>
          <AlphaMomentumSignal analytics={analytics} />
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-2xl" />}>
          <NeuralSynergyCore analytics={analytics} />
        </Suspense>
        <div className="glass-card rounded-2xl border border-primary/20 p-6 bg-black/40 backdrop-blur-xl">
           <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Neural Audit Log</h3>
           <div className="font-mono text-[10px] text-primary/60 space-y-2">
             <p>SYSTEM OK. SYNERGY PROTOCOL v5.3 INITIALIZED.</p>
             <p className="text-accent">ANOMALY DETECTION: SHIELD ACTIVE.</p>
           </div>
        </div>
      </div>

      <m.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickLinks.map(link => (
          <m.div key={link.url} variants={item}>
            <Link to={link.url} className="flex items-center gap-3 rounded-xl glass-card p-4 border border-white/5 hover:border-primary/40 transition-all">
              <link.icon className={`w-5 h-5 ${link.color}`} />
              <div>
                <p className="text-sm font-bold text-foreground">{link.title}</p>
                <p className="text-[10px] text-muted-foreground">{link.description}</p>
              </div>
            </Link>
          </m.div>
        ))}
      </m.div>

      {draws.length > 0 && (
        <m.div variants={container} initial="hidden" animate="show" className="grid lg:grid-cols-2 gap-6">
          <m.div variants={item}><Suspense fallback={<Skeleton className="h-[300px] w-full" />}><FrequencyChart stats={stats} /></Suspense></m.div>
          <m.div variants={item}><Suspense fallback={<Skeleton className="h-[300px] w-full" />}><HeatmapGrid stats={stats} totalNumbers={config.numbers} /></Suspense></m.div>
          <m.div variants={item}><Suspense fallback={<Skeleton className="h-[300px] w-full" />}><SumChart data={sumData} /></Suspense></m.div>
          <m.div variants={item}><Suspense fallback={<Skeleton className="h-[300px] w-full" />}><ParityChart draws={draws} /></Suspense></m.div>
        </m.div>
      )}
    </div>
  );
};
export default memo(DashboardPage);