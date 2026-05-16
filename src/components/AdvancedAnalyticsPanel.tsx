import { useState } from "react";
import { NumberStats } from "@/features/statistics/engine";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import {
  runLogisticRegression,
  runTimeSeriesAnalysis,
  computeCorrelationMatrix,
  runKMeansClustering,
  computeIntegratedScores,
  computeVolatilityAndSentiment,
  LogisticResult,
  TimeSeriesForecast,
  CorrelationPair,
  ClusterInfo,
  IntegratedScore,
  VolatilityStats,
} from "@/engine/advanced-analytics";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Play, TrendingUp, GitBranch, Layers, BarChart3, Microscope, ShieldAlert, Activity, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, LineChart, Line } from "recharts";
import { DashboardWidget } from "./DashboardWidget";

interface Props {
  stats: NumberStats[];
  draws: DrawResult[];
  config: LotteryConfig;
}

export function AdvancedAnalyticsPanel({ stats, draws, config }: Props) {
  const [running, setRunning] = useState(false);
  const [logistic, setLogistic] = useState<LogisticResult[] | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesForecast[] | null>(null);
  const [correlations, setCorrelations] = useState<CorrelationPair[] | null>(null);
  const [clusters, setClusters] = useState<ClusterInfo[] | null>(null);
  const [integrated, setIntegrated] = useState<IntegratedScore[] | null>(null);
  const [volatility, setVolatility] = useState<VolatilityStats[] | null>(null);

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      setLogistic(runLogisticRegression(stats, draws, config));
      setTimeSeries(runTimeSeriesAnalysis(draws, config));
      setCorrelations(computeCorrelationMatrix(draws, config, 25));
      setClusters(runKMeansClustering(draws, config, 5));
      setIntegrated(computeIntegratedScores(stats, draws, config));
      setVolatility(computeVolatilityAndSentiment(draws, config));
      setRunning(false);
    }, 2200);
  };

  const hasResults = logistic && timeSeries && correlations && clusters && integrated && volatility;

  return (
    <DashboardWidget 
      title="Motor de Ciência de Dados" 
      subtitle="Modelagem Preditiva e Analítica Avançada" 
      icon={Brain}
      headerAction={
        <Button
          size="sm"
          onClick={run}
          disabled={running}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          {running ? (
            <><Activity className="w-3 h-3 mr-1.5 animate-pulse" /> CALCULANDO...</>
          ) : (
            <><Play className="w-3 h-3 mr-1.5" /> EXECUTAR ENGINE</>
          )}
        </Button>
      }
    >
      {running && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <Brain className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-foreground uppercase tracking-widest">Processando Modelos</p>
            <p className="text-xs text-muted-foreground font-medium">Sincronizando redes neurais e estatísticas...</p>
          </div>
        </div>
      )}

      {hasResults && !running && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <SummaryCard
                icon={<TrendingUp className="w-3 h-3" />}
                title="Logística"
                value={`Top: ${logistic![0].number}`}
                detail={`P=${(logistic![0].probability * 100).toFixed(1)}%`}
              />
              <SummaryCard
                icon={<BarChart3 className="w-3 h-3" />}
                title="Séries"
                value={`Top: ${timeSeries![0].number}`}
                detail={`Trend: ${timeSeries![0].trend}`}
              />
              <SummaryCard
                icon={<GitBranch className="w-3 h-3" />}
                title="Correlação"
                value={`${correlations!.filter(c => Math.abs(c.correlation) > 0.1).length} pares`}
                detail={`Lift: ${Math.max(...correlations!.map(c => c.lift)).toFixed(2)}`}
              />
              <SummaryCard
                icon={<ShieldAlert className="w-3 h-3" />}
                title="Risco"
                value={`${volatility![0].sentiment}`}
                detail={`Score: ${volatility![0].riskScore.toFixed(0)}`}
              />
            </div>

            <Tabs defaultValue="integrated" className="w-full">
              <TabsList className="w-full bg-muted/30 border border-border/40 flex-wrap h-auto gap-1 p-1 rounded-xl mb-6">
                <TabsTrigger value="integrated" className="text-xs font-bold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Sparkles className="w-3 h-3 mr-1.5" /> Score Integrado
                </TabsTrigger>
                <TabsTrigger value="volatility" className="text-xs font-bold rounded-lg">Volatilidade</TabsTrigger>
                <TabsTrigger value="logistic" className="text-xs font-bold rounded-lg">Regressão</TabsTrigger>
                <TabsTrigger value="timeseries" className="text-xs font-bold rounded-lg">Séries Temp.</TabsTrigger>
                <TabsTrigger value="correlation" className="text-xs font-bold rounded-lg">Correlação</TabsTrigger>
                <TabsTrigger value="clusters" className="text-xs font-bold rounded-lg">Clusters</TabsTrigger>
              </TabsList>

              <TabsContent value="integrated" className="mt-4">
                <p className="text-xs text-muted-foreground mb-4 font-medium italic">
                  Score combinado: Logística (30%) + Séries Temporais (25%) + Correlação (20%) + Cluster (25%)
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={integrated!.slice(0, 20)} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <XAxis dataKey="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }}
                        formatter={(value: number) => [value, "Score"]}
                      />
                      <Bar dataKey="finalScore" radius={[4, 4, 0, 0]}>
                        {integrated!.slice(0, 20).map((_, i) => (
                          <Cell key={i} fill={`hsl(var(--primary), ${100 - i * 3}%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-6">
                  {integrated!.slice(0, 10).map((s, i) => (
                    <div key={s.number} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-xs font-black text-primary shadow-sm">
                        {String(s.number).padStart(2, '0')}
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">{s.finalScore.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="volatility" className="mt-4">
                <p className="text-xs text-muted-foreground mb-4 font-medium italic">
                  Análise de risco baseada em desvio padrão móvel e sentimento de mercado
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={volatility!.slice(0, 15)} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <XAxis dataKey="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "12px", border: "1px solid hsl(var(--border))" }}
                          formatter={(v: number) => [`${v.toFixed(1)}%`, "Risco"]}
                        />
                        <Bar dataKey="riskScore" radius={[4, 4, 0, 0]}>
                          {volatility!.slice(0, 15).map((v, i) => (
                            <Cell key={i} fill={v.riskScore > 70 ? "#ef4444" : v.riskScore > 40 ? "#f59e0b" : "#10b981"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {volatility!.slice(0, 12).map((v) => (
                      <div key={v.number} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/10">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center text-xs font-black">
                            {String(v.number).padStart(2, '0')}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            v.sentiment === 'Bullish' ? 'bg-primary/10 text-primary' : 
                            v.sentiment === 'Bearish' ? 'bg-destructive/10 text-destructive' : 
                            'bg-muted text-muted-foreground'
                          }`}>
                            {v.sentiment}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase font-black">Risco</p>
                          <p className={`text-xs font-black ${v.riskScore > 60 ? 'text-destructive' : 'text-primary'}`}>
                            {v.riskScore.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="logistic" className="mt-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={logistic!.slice(0, 20).map(l => ({ ...l, prob: Math.round(l.probability * 100) }))}
                      margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                    >
                      <XAxis dataKey="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
                      <Bar dataKey="prob" radius={[4, 4, 0, 0]}>
                        {logistic!.slice(0, 20).map((_, i) => (
                          <Cell key={i} fill={`hsl(200, 80%, ${50 + i}%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="timeseries" className="mt-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeSeries!.slice(0, 20)} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <XAxis dataKey="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
                      <Bar dataKey="forecast" radius={[4, 4, 0, 0]}>
                        {timeSeries!.slice(0, 20).map((t, i) => (
                          <Cell key={i} fill={t.trend === "up" ? "#10b981" : t.trend === "down" ? "#ef4444" : "#f59e0b"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="correlation" className="mt-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <XAxis dataKey="numA" name="Dezena A" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis dataKey="numB" name="Dezena B" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <ZAxis dataKey="lift" range={[30, 200]} name="Lift" />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
                      <Scatter data={correlations!.filter(c => c.lift > 1)} fill="hsl(var(--primary))" fillOpacity={0.7} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="clusters" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {clusters!.map(cluster => (
                    <div key={cluster.id} className="rounded-2xl bg-muted/20 border border-border/40 p-4 hover:border-primary/30 transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-black text-foreground uppercase tracking-widest">{cluster.label}</span>
                        <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-black border border-primary/20">
                          {cluster.size} JOGOS
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-[10px] text-muted-foreground uppercase font-black">
                        <div>
                          <p className="mb-1 opacity-60">Soma</p>
                          <p className="text-foreground text-xs">{cluster.avgSum}</p>
                        </div>
                        <div>
                          <p className="mb-1 opacity-60">Pares</p>
                          <p className="text-foreground text-xs">{(cluster.avgEvenRatio * 100).toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="mb-1 opacity-60">Altas</p>
                          <p className="text-foreground text-xs">{(cluster.avgHighRatio * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </AnimatePresence>
      )}

      {!hasResults && !running && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center border border-primary/10">
            <Zap className="w-8 h-8 text-primary/40" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground uppercase tracking-widest">Motor Offline</p>
            <p className="text-xs text-muted-foreground font-medium max-w-[240px] mx-auto">
              Aguardando comando para processar os modelos de ciência de dados.
            </p>
          </div>
        </div>
      )}
    </DashboardWidget>
  );
}

function SummaryCard({ icon, title, value, detail }: { icon: React.ReactNode; title: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl bg-muted/20 border border-border/40 p-4 hover:bg-muted/30 transition-all hover:border-primary/20 group">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-primary p-1.5 rounded-lg bg-primary/10 group-hover:scale-110 transition-transform">{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">{title}</span>
      </div>
      <p className="text-base font-black text-foreground truncate tracking-tighter">{value}</p>
      <p className="text-[10px] font-bold text-primary/80 mt-1">{detail}</p>
    </div>
  );
}
