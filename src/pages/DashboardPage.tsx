import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { FrequencyChart } from "@/components/FrequencyChart";
import { HeatmapGrid } from "@/components/HeatmapGrid";
import { AutoUpdater } from "@/components/AutoUpdater";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { ComplianceDisclaimer } from "@/components/ComplianceDisclaimer";
import { WorkflowSteps } from "@/components/WorkflowSteps";
import { AIInsightsCard } from "@/components/AIInsightsCard";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, Flame, Snowflake, TrendingUp, Loader2, Sparkles, Zap, Activity, Target, 
  ShieldCheck, Gauge, Crown, X, Clover, Save, TrendingDown 
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { runIntelligentPipeline } from "@/ai/knowledge/strategiesLibrary";
import { useSavedBets } from "@/hooks/useSavedBets";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { DashboardWidget } from "@/components/DashboardWidget";
import { calculateGameScore, GameScore } from "@/features/statistics/scoring";
import { QuickIntelligence } from "@/features/ai/components/QuickIntelligence";
import { StatsWidget } from "@/components/ui/StatsWidget";
import { DESIGN_TOKENS } from "@/lib/design-system";
import { RecentDraws } from "@/components/RecentDraws";
import { PersonalPerformanceCard } from "@/components/PersonalPerformanceCard";
import { ParityChart } from "@/components/ParityChart";
import { ConsecutiveChart } from "@/components/ConsecutiveChart";
import { RangeDistribution } from "@/components/RangeDistribution";
import { DelayChart } from "@/components/DelayChart";
import { SumChart } from "@/components/SumChart";

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
  const [luckyGame, setLuckyGame] = useState<{ numbers: number[]; score: GameScore; strategy: string } | null>(null);
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
      const strategies = ["smart", "hybrid", "ml", "balanced"];
      const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];
      const result = runIntelligentPipeline(stats, draws, selectedLottery, randomStrategy, 1);
      
      if (result.games.length > 0) {
        const game = result.games[0];
        const score = calculateGameScore(game, stats, config);
        setLuckyGame({
          numbers: game,
          score,
          strategy: result.strategy.name,
        });
      }
      setGeneratingLucky(false);
    }, 800);
  }, [stats, draws, selectedLottery, config]);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Dashboard — Titan Loterias</title>
        <meta name="description" content="Acesse análises estatísticas em tempo real, mapas de calor, tendências e gere jogos inteligentes no seu dashboard personalizado." />
        <link rel="canonical" href="https://titanloterias.lovable.app/" />
        <meta property="og:title" content="Dashboard — Titan Loterias" />
        <meta property="og:description" content="Análises estatísticas e IA para suas apostas." />
        <meta property="og:url" content="https://titanloterias.lovable.app/" />
      </Helmet>
      <OnboardingGuide />
      <PageHeader
        title="Intelligence Terminal"
        description={`Ecossistema de análise probabilística e fluxos neurais de alta performance — ${config.name}`}
        icon={Gauge}
        badge="System Active"
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

          {/* High-Performance Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatsWidget 
              label="Volume Histórico" 
              value={draws.length} 
              subValue="concursos"
              icon={BarChart3} 
              trend="up"
              color="indigo"
            />
            <StatsWidget 
              label="Momentum (Quentes)" 
              value={hotNumbers} 
              subValue="dezenas"
              icon={Flame} 
              trend="up"
              color="rose"
            />
            <StatsWidget 
              label="Atraso Estrutural" 
              value={avgDelay} 
              subValue="ciclos"
              icon={Snowflake} 
              trend="neutral"
              color="amber"
            />
            <StatsWidget 
              label="Probabilidade" 
              value="84.2%" 
              subValue="confiança"
              icon={Target} 
              trend="up"
              color="emerald"
            />
          </div>

          {/* Intelligence Market Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Column: Analytics Terminal */}
            <div className="md:col-span-8 space-y-6">
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/50 to-transparent" />
                </div>
              </div>

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
              <QuickIntelligence stats={stats} draws={draws} lotteryName={config.name} />

              {/* AI Insight Section */}
              <DashboardWidget title="Inteligência Artificial" subtitle="Insights em tempo real" icon={Sparkles} className="border-primary/30 shadow-lg shadow-primary/5">
                <AIInsightsCard stats={stats} draws={draws} lotteryName={config.name} compact />
              </DashboardWidget>

              {/* Alpha Intelligence Widget */}
              <DashboardWidget 
                title="Alpha Engine v5.0" 
                subtitle="Sistemas Neurais & Probabilidade" 
                icon={Sparkles} 
                className="bg-gradient-to-br from-background to-primary/5 border-primary/20 shadow-2xl shadow-primary/5"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Market Status: <span className="text-primary">Optimized</span></span>
                    </div>
                    <Badge variant="outline" className="text-[9px] border-primary/30 text-primary bg-primary/5">
                      REAL-TIME
                    </Badge>
                  </div>

                  <Button
                    onClick={generateLuckyGame}
                    disabled={generatingLucky || stats.length === 0}
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]" />
                    {generatingLucky ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> ANALISANDO FLUXOS...</>
                    ) : (
                      <><Zap className="w-4 h-4 mr-2" /> EXECUTAR ALPHA-STRAT</>
                    )}
                  </Button>

                  <AnimatePresence>
                    {luckyGame && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-primary/20 bg-primary/5 p-4 relative overflow-hidden space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Estratégia</span>
                            <span className="text-xs font-bold text-foreground">{luckyGame.strategy}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Classificação</span>
                            <div className="flex items-center gap-1.5 justify-end">
                              <ShieldCheck className="w-3 h-3 text-primary" />
                              <span className="text-xs font-bold text-primary">{luckyGame.score.classification}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center py-2">
                          {luckyGame.numbers.map(n => (
                            <span key={n} className="w-10 h-10 rounded-xl bg-background border-2 border-primary/20 flex items-center justify-center text-sm font-black text-primary shadow-sm hover:border-primary transition-colors cursor-default">
                              {String(n).padStart(2, "0")}
                            </span>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Alpha Score</span>
                            <span className="text-xl font-black text-primary font-mono">{luckyGame.score.total}%</span>
                          </div>
                          <Progress value={luckyGame.score.total} className="h-1.5 bg-primary/10" />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(luckyGame.score.factors).map(([key, val]) => (
                            <div key={key} className="bg-background/40 rounded-lg p-2 border border-border/50">
                              <p className="text-[8px] uppercase text-muted-foreground font-bold truncate">{key}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] font-bold text-foreground">{val}%</span>
                                <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-primary" style={{ width: `${val}%` }} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-primary/10">
                          {luckyGame.score.insights.slice(0, 2).map((insight, idx) => (
                            <div key={idx} className="flex items-center gap-2 mb-1">
                              <div className="w-1 h-1 rounded-full bg-primary" />
                              <p className="text-[9px] text-muted-foreground font-medium italic">{insight}</p>
                            </div>
                          ))}
                        </div>

                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-[10px] h-7 gap-1.5 text-muted-foreground hover:text-primary"
                          onClick={() => setLuckyGame(null)}
                        >
                          <X className="w-3 h-3" /> DESCARTAR ANÁLISE
                        </Button>
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
