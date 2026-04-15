import { useState, useMemo, memo, lazy, Suspense } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { StatsCard } from "@/components/StatsCard";
import { computeFrequencyStats, computeSumDistribution } from "@/engine/statistics";
import { PieChart, Flame, Snowflake, TrendingUp, BarChart3, Clock, Target, Sigma, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const FrequencyChart = lazy(() => import("@/components/FrequencyChart").then(m => ({ default: m.FrequencyChart })));
const HeatmapGrid = lazy(() => import("@/components/HeatmapGrid").then(m => ({ default: m.HeatmapGrid })));
const SumChart = lazy(() => import("@/components/SumChart").then(m => ({ default: m.SumChart })));
const ParityChart = lazy(() => import("@/components/ParityChart").then(m => ({ default: m.ParityChart })));
const ConsecutiveChart = lazy(() => import("@/components/ConsecutiveChart").then(m => ({ default: m.ConsecutiveChart })));
const RangeDistribution = lazy(() => import("@/components/RangeDistribution").then(m => ({ default: m.RangeDistribution })));
const DelayChart = lazy(() => import("@/components/DelayChart").then(m => ({ default: m.DelayChart })));

const ChartFallback = () => (
  <div className="flex items-center justify-center py-12 rounded-xl glass-card">
    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
  </div>
);

const PERIOD_OPTIONS = [
  { label: "Todos", value: 0 },
  { label: "Últimos 30", value: 30 },
  { label: "Últimos 90", value: 90 },
  { label: "Últimos 180", value: 180 },
  { label: "Últimos 365", value: 365 },
  { label: "Últimos 500", value: 500 },
] as const;

const TrendsList = memo(function TrendsList({ stats }: { stats: ReturnType<typeof computeFrequencyStats> }) {
  const sorted = useMemo(() => [...stats].sort((a, b) => b.trend - a.trend).slice(0, 15), [stats]);

  return (
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
        {sorted.map(s => (
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
  );
});

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
    const hotNumbers = stats.filter(s => s.status === "hot").length;
    const coldNumbers = stats.filter(s => s.status === "cold").length;
    const avgDelay = stats.length > 0 ? Math.round(stats.reduce((a, s) => a + s.lastSeen, 0) / stats.length) : 0;
    const avgFreq = stats.length > 0 ? Math.round(stats.reduce((a, s) => a + s.frequency, 0) / stats.length) : 0;
    const maxDelay = stats.length > 0 ? Math.max(...stats.map(s => s.lastSeen)) : 0;
    const mostFrequent = stats.length > 0 ? stats.reduce((a, s) => s.frequency > a.frequency ? s : a, stats[0]) : null;
    const leastFrequent = stats.length > 0 ? stats.reduce((a, s) => s.frequency < a.frequency ? s : a, stats[0]) : null;
    const avgSum = sumData.length > 0 ? Math.round(sumData.reduce((a, s) => a + s.sum, 0) / sumData.length) : 0;
    return { hotNumbers, coldNumbers, avgDelay, avgFreq, maxDelay, mostFrequent, leastFrequent, avgSum };
  }, [stats, sumData]);

  const { hotNumbers, coldNumbers, avgDelay, avgFreq, maxDelay, mostFrequent, leastFrequent, avgSum } = derivedStats;

  if (draws.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Estatísticas Avançadas" description="Análise estatística consolidada de todas as métricas" icon={PieChart} />
        <LotteryContextBanner />
        <EmptyState onImport={syncDraws} onImportAll={syncAllLotteries} lotteryName={config.name} syncing={syncing} />
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Números Quentes" value={hotNumbers} icon={Flame} color="red" subtitle="Mais sorteados que a média" />
        <StatsCard title="Números Frios" value={coldNumbers} icon={Snowflake} color="blue" subtitle="Menos sorteados que a média" />
        <StatsCard title="Atraso Médio" value={`${avgDelay}`} icon={Clock} color="amber" subtitle="Concursos sem aparecer" />
        <StatsCard title="Maior Atraso" value={`${maxDelay}`} icon={TrendingUp} color="red" subtitle="Nº mais atrasado" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Frequência Média" value={avgFreq} icon={BarChart3} color="green" subtitle="Aparições por número" />
        <StatsCard title="Mais Sorteado" value={mostFrequent ? `${String(mostFrequent.number).padStart(2,'0')} (${mostFrequent.frequency}x)` : '-'} icon={Target} color="green" subtitle="Número campeão" />
        <StatsCard title="Menos Sorteado" value={leastFrequent ? `${String(leastFrequent.number).padStart(2,'0')} (${leastFrequent.frequency}x)` : '-'} icon={Snowflake} color="blue" subtitle="Número mais raro" />
        <StatsCard title="Soma Média" value={avgSum} icon={Sigma} color="amber" subtitle="Soma das dezenas" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartFallback />}><FrequencyChart stats={stats} /></Suspense>
        <Suspense fallback={<ChartFallback />}><HeatmapGrid stats={stats} totalNumbers={config.numbers} /></Suspense>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartFallback />}><ParityChart draws={filteredDraws} /></Suspense>
        <Suspense fallback={<ChartFallback />}><ConsecutiveChart draws={filteredDraws} /></Suspense>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartFallback />}><RangeDistribution draws={filteredDraws} config={config} /></Suspense>
        <Suspense fallback={<ChartFallback />}><DelayChart stats={stats} /></Suspense>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartFallback />}><SumChart data={sumData} /></Suspense>
        <TrendsList stats={stats} />
      </div>
    </div>
  );
};

export default EstatisticasPage;
