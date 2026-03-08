import { useState, useMemo } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { FrequencyChart } from "@/components/FrequencyChart";
import { HeatmapGrid } from "@/components/HeatmapGrid";
import { SumChart } from "@/components/SumChart";
import { ParityChart } from "@/components/ParityChart";
import { ConsecutiveChart } from "@/components/ConsecutiveChart";
import { RangeDistribution } from "@/components/RangeDistribution";
import { DelayChart } from "@/components/DelayChart";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { StatsCard } from "@/components/StatsCard";
import { computeFrequencyStats, computeSumDistribution } from "@/engine/statistics";
import { motion } from "framer-motion";
import { PieChart, Flame, Snowflake, TrendingUp, BarChart3, Clock, Target, Sigma, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const PERIOD_OPTIONS = [
  { label: "Todos", value: 0 },
  { label: "Últimos 30", value: 30 },
  { label: "Últimos 90", value: 90 },
  { label: "Últimos 180", value: 180 },
  { label: "Últimos 365", value: 365 },
  { label: "Últimos 500", value: 500 },
] as const;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const EstatisticasPage = () => {
  const { config, draws, syncing, syncDraws, syncAllLotteries } = useLotteryContext();
  const [period, setPeriod] = useState(0);

  const filteredDraws = useMemo(() => {
    if (period === 0) return draws;
    return draws.slice(0, period);
  }, [draws, period]);

  const stats = useMemo(() => computeFrequencyStats(filteredDraws, config.numbers), [filteredDraws, config.numbers]);
  const sumData = useMemo(() => computeSumDistribution(filteredDraws), [filteredDraws]);

  const hotNumbers = stats.filter(s => s.status === "hot").length;
  const coldNumbers = stats.filter(s => s.status === "cold").length;
  const avgDelay = stats.length > 0 ? Math.round(stats.reduce((a, s) => a + s.lastSeen, 0) / stats.length) : 0;
  const avgFreq = stats.length > 0 ? Math.round(stats.reduce((a, s) => a + s.frequency, 0) / stats.length) : 0;
  const maxDelay = stats.length > 0 ? Math.max(...stats.map(s => s.lastSeen)) : 0;
  const mostFrequent = stats.length > 0 ? stats.reduce((a, s) => s.frequency > a.frequency ? s : a, stats[0]) : null;
  const leastFrequent = stats.length > 0 ? stats.reduce((a, s) => s.frequency < a.frequency ? s : a, stats[0]) : null;
  const avgSum = sumData.length > 0 ? Math.round(sumData.reduce((a, s) => a + s.sum, 0) / sumData.length) : 0;

  if (draws.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Estatísticas Avançadas"
          description="Análise estatística consolidada de todas as métricas"
          icon={PieChart}
        />
        <LotteryContextBanner />
        <EmptyState
          onImport={syncDraws}
          onImportAll={syncAllLotteries}
          lotteryName={config.name}
          syncing={syncing}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estatísticas Avançadas"
        description={`Visão consolidada de todas as métricas — ${config.name}`}
        icon={PieChart}
        badge={`${filteredDraws.length} sorteios${period > 0 ? ` (últimos ${period})` : ''}`}
      />
      <LotteryContextBanner />

      {/* Period Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-medium">Período:</span>
        </div>
        {PERIOD_OPTIONS.map(opt => (
          <Button
            key={opt.value}
            size="sm"
            variant={period === opt.value ? "default" : "outline"}
            onClick={() => setPeriod(opt.value)}
            className="h-7 text-xs px-3"
            disabled={opt.value > draws.length && opt.value !== 0}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Overview Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}><StatsCard title="Números Quentes" value={hotNumbers} icon={Flame} color="red" subtitle={`Mais sorteados que a média`} /></motion.div>
        <motion.div variants={item}><StatsCard title="Números Frios" value={coldNumbers} icon={Snowflake} color="blue" subtitle={`Menos sorteados que a média`} /></motion.div>
        <motion.div variants={item}><StatsCard title="Atraso Médio" value={`${avgDelay}`} icon={Clock} color="amber" subtitle="Concursos sem aparecer" /></motion.div>
        <motion.div variants={item}><StatsCard title="Maior Atraso" value={`${maxDelay}`} icon={TrendingUp} color="red" subtitle={`Nº mais atrasado`} /></motion.div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}><StatsCard title="Frequência Média" value={avgFreq} icon={BarChart3} color="green" subtitle="Aparições por número" /></motion.div>
        <motion.div variants={item}><StatsCard title="Mais Sorteado" value={mostFrequent ? `${String(mostFrequent.number).padStart(2,'0')} (${mostFrequent.frequency}x)` : '-'} icon={Target} color="green" subtitle="Número campeão" /></motion.div>
        <motion.div variants={item}><StatsCard title="Menos Sorteado" value={leastFrequent ? `${String(leastFrequent.number).padStart(2,'0')} (${leastFrequent.frequency}x)` : '-'} icon={Snowflake} color="blue" subtitle="Número mais raro" /></motion.div>
        <motion.div variants={item}><StatsCard title="Soma Média" value={avgSum} icon={Sigma} color="amber" subtitle="Soma das dezenas" /></motion.div>
      </motion.div>

      {/* Frequency + Heatmap */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={item}><FrequencyChart stats={stats} /></motion.div>
        <motion.div variants={item}><HeatmapGrid stats={stats} totalNumbers={config.numbers} /></motion.div>
      </motion.div>

      {/* Parity + Consecutive */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ParityChart draws={draws} />
        <ConsecutiveChart draws={draws} />
      </div>

      {/* Range + Delay */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RangeDistribution draws={draws} config={config} />
        <DelayChart stats={stats} />
      </div>

      {/* Sum + Trend Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SumChart data={sumData} />
        {/* Trend table */}
        <div className="rounded-xl glass-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Tendências</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Números com maior momentum positivo</p>
            </div>
          </div>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {[...stats]
              .sort((a, b) => b.trend - a.trend)
              .slice(0, 15)
              .map(s => (
                <div key={s.number} className="flex items-center gap-2 text-xs font-mono px-2 py-1.5 rounded-lg bg-secondary/50 border border-border">
                  <span className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
                    s.status === 'hot' ? 'bg-destructive/15 text-destructive' : s.status === 'cold' ? 'bg-neon-blue/15 text-neon-blue' : 'bg-primary/15 text-primary'
                  }`}>
                    {String(s.number).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, Math.max(5, 50 + s.trend * 10))}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-[10px] ${s.trend > 0 ? 'text-primary' : 'text-destructive'}`}>
                    {s.trend > 0 ? '↑' : '↓'}{Math.abs(s.trend).toFixed(1)}
                  </span>
                  <span className="text-[10px] text-muted-foreground w-12 text-right">{s.frequency}x</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstatisticasPage;
