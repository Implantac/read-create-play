import { useState, useMemo, lazy, Suspense } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { StatsCard } from "@/components/common/StatsCard";
import { computeFrequencyStats, computeSumDistribution } from "@/engine/stats/statistics";
import { m } from "framer-motion";
import { PieChart, Flame, Snowflake, TrendingUp, BarChart3, Clock, Target, Sigma, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy imports for heavy components
const FrequencyChart = lazy(() => import("@/components/FrequencyChart").then(m => ({ default: m.FrequencyChart })));
const HeatmapGrid = lazy(() => import("@/components/HeatmapGrid").then(m => ({ default: m.HeatmapGrid })));
const SumChart = lazy(() => import("@/components/SumChart").then(m => ({ default: m.SumChart })));
const ParityChart = lazy(() => import("@/components/ParityChart").then(m => ({ default: m.ParityChart })));
const ConsecutiveChart = lazy(() => import("@/components/ConsecutiveChart").then(m => ({ default: m.ConsecutiveChart })));
const RangeDistribution = lazy(() => import("@/components/RangeDistribution").then(m => ({ default: m.RangeDistribution })));
const DelayChart = lazy(() => import("@/components/DelayChart").then(m => ({ default: m.DelayChart })));

const PERIOD_OPTIONS = [
  { label: "Todos", value: 0 },
  { label: "Últimos 30", value: 30 },
  { label: "Últimos 100", value: 100 },
  { label: "Últimos 300", value: 300 },
] as const;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
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

  const derivedStats = useMemo(() => {
    const hotCount = stats.filter(s => s.status === "hot").length;
    const coldCount = stats.filter(s => s.status === "cold").length;
    const avgDelay = stats.length > 0 ? Math.round(stats.reduce((a, s) => a + s.lastSeen, 0) / stats.length) : 0;
    const maxDelay = stats.length > 0 ? Math.max(...stats.map(s => s.lastSeen)) : 0;
    const mostFrequent = stats.length > 0 ? stats.reduce((a, s) => s.frequency > a.frequency ? s : a, stats[0]) : null;
    const avgSum = sumData.length > 0 ? Math.round(sumData.reduce((a, s) => a + s.sum, 0) / sumData.length) : 0;
    return { hotCount, coldCount, avgDelay, maxDelay, mostFrequent, avgSum };
  }, [stats, sumData]);

  const { hotCount, coldCount, avgDelay, maxDelay, mostFrequent, avgSum } = derivedStats;

  if (draws.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Estatísticas Avançadas" description="Análise estatística" icon={PieChart} />
        <LotteryContextBanner />
        <EmptyState onImport={syncDraws} onImportAll={syncAllLotteries} lotteryName={config.name} syncing={syncing} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Estatísticas Avançadas"
        description={`Análise — ${config.name}`}
        icon={PieChart}
        badge={`${filteredDraws.length} sorteios`}
      />
      
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {PERIOD_OPTIONS.map(opt => (
          <Button key={opt.value} size="sm" variant={period === opt.value ? "default" : "outline"} onClick={() => setPeriod(opt.value)} className="h-7 text-xs px-3">
            {opt.label}
          </Button>
        ))}
      </div>

      <m.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <m.div variants={item}><StatsCard title="Números Quentes" value={hotCount} icon={Flame} /></m.div>
        <m.div variants={item}><StatsCard title="Números Frios" value={coldCount} icon={Snowflake} /></m.div>
        <m.div variants={item}><StatsCard title="Atraso Médio" value={avgDelay} icon={Clock} /></m.div>
        <m.div variants={item}><StatsCard title="Maior Atraso" value={maxDelay} icon={TrendingUp} /></m.div>
      </m.div>

      <m.div variants={container} initial="hidden" animate="show" className="grid lg:grid-cols-2 gap-6">
        <m.div variants={item}>
          <Suspense fallback={<Skeleton className="h-[350px] w-full" />}><FrequencyChart stats={stats} /></Suspense>
        </m.div>
        <m.div variants={item}>
          <Suspense fallback={<Skeleton className="h-[350px] w-full" />}><HeatmapGrid stats={stats} totalNumbers={config.numbers} /></Suspense>
        </m.div>
        <m.div variants={item}>
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}><SumChart data={sumData} /></Suspense>
        </m.div>
        <m.div variants={item}>
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}><ParityChart draws={filteredDraws} /></Suspense>
        </m.div>
        <m.div variants={item}>
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}><ConsecutiveChart draws={filteredDraws} /></Suspense>
        </m.div>
        <m.div variants={item}>
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}><DelayChart stats={stats} /></Suspense>
        </m.div>
      </m.div>
    </div>
  );
};

export default EstatisticasPage;