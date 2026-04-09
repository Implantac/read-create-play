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
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm">Carregando resultados...</span>
        </div>
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
        <div key={selectedLottery}>
          <AutoUpdater key={`auto-${selectedLottery}`} lotteryId={selectedLottery} onNewDraw={handleNewDraw} latestConcurso={draws[0]?.concurso || 0} />

          {/* Workflow Steps */}
          <WorkflowSteps />

          {/* Stats cards */}
          <motion.div
            key={`stats-${selectedLottery}`}
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6"
          >
            <motion.div variants={item}><StatsCard title="Total Concursos" value={draws.length} icon={BarChart3} color="green" subtitle="Resultados históricos" /></motion.div>
            <motion.div variants={item}><StatsCard title="Números Quentes" value={hotNumbers} icon={Flame} color="red" subtitle="Acima da média" /></motion.div>
            <motion.div variants={item}><StatsCard title="Números Frios" value={coldNumbers} icon={Snowflake} color="blue" subtitle="Abaixo da média" /></motion.div>
            <motion.div variants={item}><StatsCard title="Atraso Médio" value={`${avgDelay}d`} icon={TrendingUp} color="amber" subtitle="Concursos sem aparecer" /></motion.div>
          </motion.div>

          {/* AI Insights + Lucky Game */}
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <AIInsightsCard stats={stats} draws={draws} lotteryName={config.name} />

            <motion.div variants={item} className="relative">
              <div className="glass-card rounded-xl border border-primary/20 p-5 flex flex-col gap-4 h-full">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Clover className="w-5 h-5 text-primary" />
                    Jogo da Sorte
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    IA gera 1 jogo otimizado com estratégia aleatória para {config.name}
                  </p>
                </div>
                <Button
                  onClick={generateLuckyGame}
                  disabled={generatingLucky || stats.length === 0}
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all w-full"
                  size="lg"
                >
                  {generatingLucky ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Gerando...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> GERAR JOGO DA SORTE</>
                  )}
                </Button>

                <AnimatePresence>
                  {luckyGame && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="rounded-xl border border-accent/30 bg-accent/5 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-xs text-muted-foreground">Estratégia: </span>
                          <span className="text-xs font-semibold text-primary">{luckyGame.strategy}</span>
                          <span className="ml-3 text-xs text-muted-foreground">Score: </span>
                          <span className="text-xs font-bold text-accent">{luckyGame.score.toFixed(1)}/100</span>
                        </div>
                        <button onClick={() => setLuckyGame(null)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {luckyGame.numbers.map(n => (
                          <span key={n} className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                            {String(n).padStart(2, "0")}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Saved bets limit card */}
          {limit !== Infinity && (
            <motion.div variants={item} className="glass-card rounded-xl border border-border/50 p-5 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <Save className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Apostas Salvas — {config.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Plano {currentPlan === "free" ? "Gratuito" : currentPlan} • Limite de {limit} jogos por loteria
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-2xl font-bold font-mono ${isAtLimit ? "text-destructive" : "text-primary"}`}>
                      {savedBets.length}/{limit}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {isAtLimit ? "Limite atingido" : `${remaining} restante${remaining !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  {isAtLimit && (
                    <Link to="/planos">
                      <Button size="sm" variant="outline" className="gap-1.5 border-accent/20 text-accent hover:bg-accent/5">
                        <Crown className="w-3.5 h-3.5" />
                        Upgrade
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isAtLimit ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${Math.min((savedBets.length / limit) * 100, 100)}%` }}
                />
              </div>
            </motion.div>
          )}

          <motion.div variants={container} initial="hidden" animate="show" className="grid lg:grid-cols-2 gap-6 mt-6">
            <motion.div variants={item}><FrequencyChart stats={stats} /></motion.div>
            <motion.div variants={item}><HeatmapGrid stats={stats} totalNumbers={config.numbers} /></motion.div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <ParityChart draws={draws} />
            <ConsecutiveChart draws={draws} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <RangeDistribution draws={draws} config={config} />
            <DelayChart stats={stats} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <SumChart data={sumData} />
            <RecentDraws key={`recent-${selectedLottery}`} draws={drawsWithPrizes} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
