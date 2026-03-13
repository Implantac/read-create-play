import { useCallback, useMemo } from "react";
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
import { motion } from "framer-motion";
import { BarChart3, Flame, Snowflake, TrendingUp, Loader2, Sparkles, FlaskConical, PieChart, Brain } from "lucide-react";
import { Link } from "react-router-dom";

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

  const hotNumbers = useMemo(() => stats.filter(s => s.status === "hot").length, [stats]);
  const coldNumbers = useMemo(() => stats.filter(s => s.status === "cold").length, [stats]);
  const avgDelay = useMemo(() => stats.length > 0 ? Math.round(stats.reduce((a, s) => a + s.lastSeen, 0) / stats.length) : 0, [stats]);

  const handleNewDraw = useCallback((draw: any) => addDraw(draw), [addDraw]);

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

          {/* Quick access cards */}
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
