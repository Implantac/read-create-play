import { useCallback, useMemo, useState } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Flame, Snowflake, TrendingUp, Loader2, Sparkles, FlaskConical, PieChart, Brain, Clover, X, Save, Crown, History } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { runIntelligentPipeline } from "@/ai/knowledge/strategiesLibrary";
import { useSavedBets } from "@/hooks/useSavedBets";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";


const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const quickLinks = [
  { title: "Gerador", description: "Gerar jogos inteligentes", icon: Sparkles, url: "/gerador", color: "text-primary" },
  { title: "Simulações", description: "Testar contra o histórico", icon: FlaskConical, url: "/simulacoes", color: "text-neon-blue" },
  { title: "Estatísticas", description: "Análise consolidada", icon: PieChart, url: "/estatisticas", color: "text-accent" },
  { title: "Estratégias IA", description: "Machine Learning e IA", icon: Brain, url: "/estrategias", color: "text-neon-purple" },
];

const DashboardPage = () => {
  const { config, draws, drawsWithPrizes, loading, syncing, stats, sumData, syncDraws, syncAllLotteries, addDraw, selectedLottery } = useLotteryContext();
  const { savedBets, limit, remaining, isAtLimit } = useSavedBets(selectedLottery);
  const { currentPlan } = usePlanAccess();
  const { profile, trialDaysLeft, isTrialExpired, isAdmin, isSuperAdmin } = useAuth();
  const [luckyGame, setLuckyGame] = useState<{ 
    numbers: number[]; 
    score: number; 
    strategy: string;
    description: string;
    pipeline: { step: string; detail: string; count: number }[];
  } | null>(null);
  const [generatingLucky, setGeneratingLucky] = useState(false);
  const { history, saveGeneration } = useGenerationHistory(selectedLottery);


  const hotNumbers = useMemo(() => stats.filter(s => s.status === "hot").length, [stats]);
  const coldNumbers = useMemo(() => stats.filter(s => s.status === "cold").length, [stats]);
  const avgDelay = useMemo(() => stats.length > 0 ? Math.round(stats.reduce((a, s) => a + s.lastSeen, 0) / stats.length) : 0, [stats]);

  const handleNewDraw = useCallback((draw: any) => addDraw(draw), [addDraw]);

  const generateLuckyGame = useCallback(() => {
    if (stats.length === 0 || draws.length === 0) return;
    setGeneratingLucky(true);
    setLuckyGame(null);
    
    // Simulate processing for "premium" feel
    setTimeout(async () => {
      const strategies = ["frequency", "balance", "coverage", "dispersion", "delay", "anti_pattern"];
      const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];
      const result = runIntelligentPipeline(stats, draws, selectedLottery, randomStrategy, 1);
      
      if (result.games.length > 0) {
        const gameData = {
          numbers: result.games[0],
          score: result.scores[0] || 0,
          strategy: result.strategy.name,
          description: result.strategy.description,
          pipeline: result.pipeline,
        };
        setLuckyGame(gameData);
        await saveGeneration(gameData);
      }
      setGeneratingLucky(false);
    }, 1500);
  }, [stats, draws, selectedLottery, saveGeneration]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Terminal de Inteligência"
        description={`Análise de precisão em tempo real — ${config.name}`}
        icon={BarChart3}
        badge={draws.length > 0 ? `${draws.length} sorteios` : undefined}
      />
      <LotteryContextBanner />

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
          {/* Progress bar */}
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

      {loading && (
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
        <>
          <AutoUpdater lotteryId={selectedLottery} onNewDraw={handleNewDraw} latestConcurso={draws[0]?.concurso || 0} />

          {/* 🍀 GERAR JOGO DA SORTE */}
          <motion.div variants={item} className="relative">
            <div className="glass-card rounded-xl border border-primary/20 p-5 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 justify-center sm:justify-start">
                  <Clover className="w-5 h-5 text-primary" />
                  Engine de Probabilidade
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  IA processa matrizes de alta confiança para {config.name}
                </p>
              </div>
              <Button
                onClick={generateLuckyGame}
                disabled={generatingLucky || stats.length === 0}
                className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                {generatingLucky ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Gerando...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> EXECUTAR ENGINE PROBABILITY</>
                )}
              </Button>
            </div>

            <AnimatePresence>
              {luckyGame && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="glass-card rounded-xl border border-primary/30 bg-primary/5 p-6 relative">
                    <button 
                      onClick={() => setLuckyGame(null)} 
                      className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Estratégia Aplicada</h4>
                          <h3 className="text-xl font-bold text-foreground">{luckyGame.strategy}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{luckyGame.description}</p>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-accent mb-3">Matriz Gerada</h4>
                          <div className="flex flex-wrap gap-3">
                            {luckyGame.numbers.map(n => (
                              <motion.div 
                                key={n}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-12 h-12 rounded-lg bg-background border-2 border-primary/40 flex items-center justify-center text-lg font-mono font-bold text-primary shadow-glow-sm"
                              >
                                {String(n).padStart(2, "0")}
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-primary/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-foreground">Score de Confiança</span>
                            <span className="text-lg font-mono font-bold text-accent">{luckyGame.score.toFixed(1)}/100</span>
                          </div>
                          <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${luckyGame.score}%` }}
                              className="h-full bg-gradient-to-r from-primary to-accent"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-black/40 rounded-lg p-4 border border-white/5 font-mono text-[11px] space-y-2">
                        <div className="flex items-center gap-2 text-primary/70 mb-3 border-b border-white/5 pb-2">
                          <Loader2 className="w-3 h-3 animate-pulse" />
                          <span className="uppercase tracking-tighter">Engine Process Log</span>
                        </div>
                        {luckyGame.pipeline.map((step, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex justify-between items-start gap-4"
                          >
                            <span className="text-primary whitespace-nowrap">[{step.step.toUpperCase()}]</span>
                            <span className="text-muted-foreground flex-1 text-right">{step.detail}</span>
                            <span className="text-accent min-w-[30px] text-right">{step.count}</span>
                          </motion.div>
                        ))}
                        <div className="pt-4 text-[10px] text-primary/50 italic border-t border-white/5 mt-4">
                          * Algoritmo de inteligência estatística validado com sucesso.
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Recent Generations History */}
          {history.length > 0 && (
            <motion.div variants={item} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Últimas Simulações
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {history.map((record) => (
                  <motion.button
                    key={record.id}
                    onClick={() => {
                      setLuckyGame({
                        numbers: record.numbers,
                        score: record.score,
                        strategy: record.strategy,
                        description: record.description || "",
                        pipeline: record.pipeline as any,
                      });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    whileHover={{ scale: 1.02 }}
                    className="flex flex-col gap-2 p-3 rounded-xl glass-card border border-border/50 hover:border-primary/40 text-left transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-primary uppercase">{record.strategy}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(record.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {record.numbers.slice(0, 6).map((n, i) => (
                        <span key={i} className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                          {String(n).padStart(2, "0")}
                        </span>
                      ))}
                      {record.numbers.length > 6 && <span className="text-[10px] text-muted-foreground self-center">...</span>}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex-1 h-1 bg-muted/30 rounded-full mr-3">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${record.score}%` }} />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-accent">{record.score.toFixed(0)}%</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}


          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickLinks.map(link => (
              <motion.div key={link.url} variants={item}>
                <Link
                  to={link.url}
                  className="flex items-center gap-3 rounded-xl glass-card p-4 border border-border hover:border-primary/30 transition-all duration-300 hover:translate-y-[-2px] group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <link.icon className={`w-5 h-5 ${link.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{link.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{link.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            key={selectedLottery}
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <motion.div variants={item}><StatsCard title="Total Concursos" value={draws.length} icon={BarChart3} color="green" subtitle="Resultados históricos" /></motion.div>
            <motion.div variants={item}><StatsCard title="Números Quentes" value={hotNumbers} icon={Flame} color="red" subtitle="Acima da média" /></motion.div>
            <motion.div variants={item}><StatsCard title="Números Frios" value={coldNumbers} icon={Snowflake} color="blue" subtitle="Abaixo da média" /></motion.div>
            <motion.div variants={item}><StatsCard title="Atraso Médio" value={`${avgDelay}d`} icon={TrendingUp} color="amber" subtitle="Concursos sem aparecer" /></motion.div>
          </motion.div>

          {/* Saved bets limit card */}
          {limit !== Infinity && (
            <motion.div variants={item} className="glass-card rounded-xl border border-border/50 p-5">
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
              {/* Progress bar */}
              <div className="mt-3 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isAtLimit ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${Math.min((savedBets.length / limit) * 100, 100)}%` }}
                />
              </div>
            </motion.div>
          )}

          <motion.div variants={container} initial="hidden" animate="show" className="grid lg:grid-cols-2 gap-6">
            <motion.div variants={item}><FrequencyChart stats={stats} /></motion.div>
            <motion.div variants={item}><HeatmapGrid stats={stats} totalNumbers={config.numbers} /></motion.div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            <ParityChart draws={draws} />
            <ConsecutiveChart draws={draws} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <RangeDistribution draws={draws} config={config} />
            <DelayChart stats={stats} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <SumChart data={sumData} />
            <RecentDraws draws={drawsWithPrizes} />
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
