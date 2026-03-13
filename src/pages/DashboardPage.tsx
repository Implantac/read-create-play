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
import { BarChart3, Flame, Snowflake, TrendingUp, Loader2, Sparkles, FlaskConical, PieChart, Brain, Clover, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { runIntelligentPipeline } from "@/ai/knowledge/strategiesLibrary";

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
  const [luckyGame, setLuckyGame] = useState<{ numbers: number[]; score: number; strategy: string } | null>(null);
  const [generatingLucky, setGeneratingLucky] = useState(false);

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
      <PageHeader
        title="Dashboard"
        description={`Análise estatística completa — ${config.name}`}
        icon={BarChart3}
        badge={draws.length > 0 ? `${draws.length} sorteios` : undefined}
      />
      <LotteryContextBanner />

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
                  Jogo da Sorte
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  IA gera 1 jogo otimizado com estratégia aleatória para {config.name}
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
                  <><Sparkles className="w-4 h-4 mr-2" /> GERAR JOGO DA SORTE</>
                )}
              </Button>
            </div>

            <AnimatePresence>
              {luckyGame && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 glass-card rounded-xl border border-accent/30 p-4"
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
          </motion.div>

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
