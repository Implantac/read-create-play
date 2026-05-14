import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { StatsCard } from "@/components/StatsCard";
import { FrequencyChart } from "@/components/FrequencyChart";
import { HeatmapGrid } from "@/components/HeatmapGrid";
import { RecentDraws } from "@/components/RecentDraws";
import { SumChart } from "@/components/SumChart";
import { ParityChart } from "@/components/ParityChart";
import { ConsecutiveChart } from "@/components/ConsecutiveChart";
import { RangeDistribution } from "@/components/RangeDistribution";
import { DelayChart } from "@/components/DelayChart";
import { AutoUpdater } from "@/components/AutoUpdater";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { ComplianceDisclaimer } from "@/components/ComplianceDisclaimer";
import { WorkflowSteps } from "@/components/WorkflowSteps";
import { AIInsightsCard } from "@/components/AIInsightsCard";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Flame, Snowflake, TrendingUp, Loader2, Sparkles, X, Save, Crown, Clover } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { runIntelligentPipeline } from "@/ai/knowledge/strategiesLibrary";
import { useSavedBets } from "@/hooks/useSavedBets";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { PersonalPerformanceCard } from "@/components/PersonalPerformanceCard";
import { DashboardWidget } from "@/components/DashboardWidget";
import { Zap, Activity, Target } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const DashboardPage = () => {
  const { config, draws, drawsWithPrizes, loading, syncing, stats, sumData, syncDraws, syncAllLotteries, addDraw, refetchDraws, selectedLottery } = useLotteryContext();
  const { savedBets, limit, remaining, isAtLimit } = useSavedBets(selectedLottery);
  const { currentPlan } = usePlanAccess();
  const { profile, trialDaysLeft, isTrialExpired, isAdmin, isSuperAdmin } = useAuth();
  const [luckyGame, setLuckyGame] = useState<{ numbers: number[]; score: number; strategy: string } | null>(null);
  const [generatingLucky, setGeneratingLucky] = useState(false);

  // Reset lucky game when lottery changes
  const prevLotteryRef = useRef(selectedLottery);
  useEffect(() => {
    if (prevLotteryRef.current !== selectedLottery) {
      setLuckyGame(null);
      setGeneratingLucky(false);
      prevLotteryRef.current = selectedLottery;
    }
  }, [selectedLottery]);

  const hotNumbers = useMemo(() => stats.filter(s => s.status === "hot").length, [stats]);
  const coldNumbers = useMemo(() => stats.filter(s => s.status === "cold").length, [stats]);
  const avgDelay = useMemo(() => stats.length > 0 ? Math.round(stats.reduce((a, s) => a + s.lastSeen, 0) / stats.length) : 0, [stats]);

  const handleNewDraw = useCallback((draw: any) => addDraw(draw), [addDraw]);

  const generateLuckyGame = useCallback(() => {
    if (stats.length === 0 || draws.length === 0) return;
    setGeneratingLucky(true);
    setTimeout(() => {
      const strategies = ["frequency", "balance", "coverage", "dispersion"];
      const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];
      const result = runIntelligentPipeline(stats, draws, selectedLottery, randomStrategy, 1);
      if (result.games.length > 0) {
        setLuckyGame({
          numbers: result.games[0],
          score: result.scores[0] || 0,
          strategy: result.strategy.name,
        });
      }
      setGeneratingLucky(false);
    }, 800);
  }, [stats, draws, selectedLottery]);

  return (
    <div className="space-y-6">
      <OnboardingGuide />
      <PageHeader
        title="Dashboard"
        description={`Plataforma de análise estatística e inteligência para loterias — ${config.name}`}
        icon={BarChart3}
        badge={draws.length > 0 ? `${draws.length} sorteios` : undefined}
      />
      <LotteryContextBanner />
      <ComplianceDisclaimer compact />

      {/* Trial countdown banner */}
      {profile?.plan === "free" && !isTrialExpired && !isAdmin && !isSuperAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-4"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/15">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {trialDaysLeft === 1
                    ? "⏱ Último dia do período de teste!"
                    : `⏱ ${trialDaysLeft} dias restantes no período de teste`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Faça upgrade para desbloquear todas as funcionalidades
                </p>
              </div>
            </div>
            <Link to="/planos">
              <Button size="sm" className="gradient-brand text-primary-foreground gap-1.5 shadow-lg shadow-primary/20">
                <Crown className="w-3.5 h-3.5" />
                Ver Planos
              </Button>
            </Link>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-muted/50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((7 - trialDaysLeft) / 7) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            />
          </div>
        </motion.div>
      )}

      {/* Upgrade banner for free users */}
      {currentPlan === "free" && !isAdmin && !isSuperAdmin && isTrialExpired && (
        <UpgradeBanner />
      )}

      {loading && draws.length === 0 && (
        <DashboardSkeleton />
      )}

      {!loading && draws.length === 0 && (
        <EmptyState
          onImport={syncDraws}
          onImportAll={syncAllLotteries}
          lotteryName={config.name}
          syncing={syncing}
        />
      )}

      {draws.length > 0 && (
        <div key={selectedLottery} className="space-y-8 pb-10">
          <AutoUpdater key={`auto-${selectedLottery}`} lotteryId={selectedLottery} onNewDraw={handleNewDraw} latestConcurso={draws[0]?.concurso || 0} onSyncTriggered={refetchDraws} />

          {/* Core Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Column: Quick Stats & AI */}
            <div className="md:col-span-8 space-y-6">
              {/* Stats Grid */}
              <motion.div
                key={`stats-${selectedLottery}`}
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <motion.div variants={item}><StatsCard title="Concursos" value={draws.length} icon={BarChart3} color="green" subtitle="Histórico total" /></motion.div>
                <motion.div variants={item}><StatsCard title="Quentes" value={hotNumbers} icon={Flame} color="red" subtitle="Top frequência" /></motion.div>
                <motion.div variants={item}><StatsCard title="Frios" value={coldNumbers} icon={Snowflake} color="blue" subtitle="Menor frequência" /></motion.div>
                <motion.div variants={item}><StatsCard title="Delay" value={`${avgDelay}c`} icon={TrendingUp} color="amber" subtitle="Atraso médio" /></motion.div>
              </motion.div>

              {/* Workflow & Progress */}
              <DashboardWidget title="Fluxo de Trabalho" subtitle="Etapas sugeridas para sua aposta" icon={Activity} noPadding>
                <div className="p-1">
                  <WorkflowSteps />
                </div>
              </DashboardWidget>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardWidget title="Frequência Global" subtitle="Distribuição de dezenas" icon={BarChart3}>
                  <FrequencyChart stats={stats} />
                </DashboardWidget>
                <DashboardWidget title="Mapa de Calor" subtitle="Intensidade de sorteios" icon={Flame}>
                  <HeatmapGrid stats={stats} totalNumbers={config.numbers} />
                </DashboardWidget>
              </div>
            </div>

            {/* Right Column: AI & Smart Tools */}
            <div className="md:col-span-4 space-y-6">
              {/* AI Insight Section */}
              <DashboardWidget title="Inteligência Artificial" subtitle="Insights em tempo real" icon={Sparkles} className="border-primary/30 shadow-lg shadow-primary/5">
                <AIInsightsCard stats={stats} draws={draws} lotteryName={config.name} compact />
              </DashboardWidget>

              {/* Lucky Game Widget */}
              <DashboardWidget title="Jogo da Sorte" subtitle="Geração inteligente v4.0" icon={Clover} className="bg-gradient-to-br from-background to-primary/5">
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    IA analisa as melhores tendências para gerar seu jogo.
                  </p>
                  <Button
                    onClick={generateLuckyGame}
                    disabled={generatingLucky || stats.length === 0}
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {generatingLucky ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> PROCESSANDO...</>
                    ) : (
                      <><Zap className="w-4 h-4 mr-2" /> GERAR AGORA</>
                    )}
                  </Button>

                  <AnimatePresence>
                    {luckyGame && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl border border-primary/20 bg-primary/5 p-4 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
                        <div className="flex items-center justify-between mb-3 relative z-10">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10">
                            {luckyGame.strategy}
                          </span>
                          <button onClick={() => setLuckyGame(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 relative z-10">
                          {luckyGame.numbers.map(n => (
                            <span key={n} className="w-9 h-9 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center text-sm font-black text-primary shadow-sm">
                              {String(n).padStart(2, "0")}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex justify-between items-center relative z-10">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Probabilidade estimada</span>
                          <span className="text-xs font-black text-accent">{luckyGame.score.toFixed(1)}%</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </DashboardWidget>

              <PersonalPerformanceCard />
            </div>
          </div>

          {/* Advanced Analytics Section */}
          <div className="space-y-6 mt-12">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full bg-primary" />
              <h2 className="text-xl font-black tracking-tight text-foreground uppercase">Análise de Comportamento</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardWidget title="Paridade & Equilíbrio" subtitle="Pares vs Ímpares" icon={Target}>
                <ParityChart draws={draws} />
              </DashboardWidget>
              <DashboardWidget title="Sequências Consecutivas" subtitle="Detecção de padrões seguidos" icon={Activity}>
                <ConsecutiveChart draws={draws} />
              </DashboardWidget>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardWidget title="Distribuição por Faixa" subtitle="Amplitude das dezenas" icon={BarChart3}>
                <RangeDistribution draws={draws} config={config} />
              </DashboardWidget>
              <DashboardWidget title="Atraso por Dezena" subtitle="Concursos desde a última saída" icon={TrendingUp}>
                <DelayChart stats={stats} />
              </DashboardWidget>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardWidget title="Tendência de Soma" subtitle="Volume total por concurso" icon={TrendingUp}>
                <SumChart data={sumData} />
              </DashboardWidget>
              <DashboardWidget title="Últimos Resultados" subtitle="Conferência de prêmios" icon={Clover} noPadding>
                <RecentDraws key={`recent-${selectedLottery}`} draws={drawsWithPrizes} />
              </DashboardWidget>
            </div>
          </div>

          {/* Limits section */}
          {limit !== Infinity && (
            <motion.div variants={item} className="glass-card rounded-2xl border border-border/50 p-6 mt-12 bg-gradient-to-r from-background to-muted/30">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-inner">
                    <Save className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Gestão de Jogos Salvos</h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      Plano <span className="text-accent uppercase font-black">{currentPlan === "free" ? "Gratuito" : currentPlan}</span> • {config.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="text-right">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-black font-mono ${isAtLimit ? "text-destructive" : "text-primary"}`}>
                        {savedBets.length}
                      </span>
                      <span className="text-muted-foreground font-bold text-sm">/ {limit}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      {isAtLimit ? "CAPACIDADE ESGOTADA" : "JOGOS EM MEMÓRIA"}
                    </p>
                  </div>
                  {isAtLimit && (
                    <Link to="/planos" className="flex-1 md:flex-none">
                      <Button size="lg" className="w-full md:w-auto gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20 rounded-xl font-bold">
                        <Crown className="w-4 h-4" />
                        UPGRADE
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              <div className="mt-6 h-2 rounded-full bg-muted overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((savedBets.length / limit) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: "circOut" }}
                  className={`h-full rounded-full ${isAtLimit ? "bg-destructive" : "bg-gradient-to-r from-primary to-accent"}`}
                />
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
