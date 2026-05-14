import { useState } from "react";
import { NumberStats } from "@/engine/statistics";
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
import { Brain, Play, TrendingUp, GitBranch, Layers, BarChart3, Microscope, ShieldAlert, Activity, Sparkles } from "lucide-react";
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <SummaryCard
                icon={<TrendingUp className="w-3 h-3" />}
                title="Regressão Logística"
                value={`Top: ${logistic![0].number}`}
                detail={`P=${(logistic![0].probability * 100).toFixed(1)}%`}
              />
              <SummaryCard
                icon={<BarChart3 className="w-3 h-3" />}
                title="Séries Temporais"
                value={`Top: ${timeSeries![0].number}`}
                detail={`Previsão: ${timeSeries![0].forecast.toFixed(1)}`}
              />
              <SummaryCard
                icon={<GitBranch className="w-3 h-3" />}
                title="Correlações"
                value={`${correlations!.filter(c => Math.abs(c.correlation) > 0.1).length} pares`}
                detail={`Lift máx: ${Math.max(...correlations!.map(c => c.lift)).toFixed(2)}`}
              />
              <SummaryCard
                icon={<Layers className="w-3 h-3" />}
                title="Clusters"
                value={`${clusters!.length} grupos`}
                detail={`Maior: ${clusters![0]?.size || 0} jogos`}
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

              {/* Integrated Score */}
              <TabsContent value="integrated" className="mt-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Score combinado: Logística (30%) + Séries Temporais (25%) + Correlação (20%) + Cluster (25%)
                </p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={integrated!.slice(0, 20)} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <XAxis dataKey="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(value: number, name: string) => {
                          const labels: Record<string, string> = {
                            finalScore: "Score Final",
                            logisticScore: "Logística",
                            timeSeriesScore: "Séries Temp.",
                            correlationBonus: "Correlação",
                            clusterAlignment: "Cluster",
                          };
                          return [`${value}`, labels[name] || name];
                        }}
                      />
                      <Bar dataKey="finalScore" radius={[3, 3, 0, 0]}>
                        {integrated!.slice(0, 20).map((_, i) => (
                          <Cell key={i} fill={`hsl(142, ${70 - i * 2}%, ${50 + i}%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {integrated!.slice(0, 10).map((s, i) => (
                    <span
                      key={s.number}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono font-bold border"
                      style={{
                        backgroundColor: `hsl(142, 70%, ${15 + i * 3}%)`,
                        borderColor: `hsl(142, 70%, ${30 + i * 2}%)`,
                        color: `hsl(142, 80%, ${80 - i * 2}%)`,
                      }}
                    >
                      {String(s.number).padStart(2, "0")}
                      <span className="text-[10px] opacity-70">{s.finalScore.toFixed(0)}</span>
                    </span>
                  ))}
                </div>
              </TabsContent>

              {/* Logistic Regression */}
              <TabsContent value="logistic" className="mt-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Probabilidade sigmoid com features: frequência, recência, tendência, momentum, ciclo e consistência
                </p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={logistic!.slice(0, 20).map(l => ({ ...l, prob: Math.round(l.probability * 100) }))}
                      margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                    >
                      <XAxis dataKey="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(value: number) => [`${value}%`, "Probabilidade"]}
                      />
                      <Bar dataKey="prob" radius={[3, 3, 0, 0]}>
                        {logistic!.slice(0, 20).map((_, i) => (
                          <Cell key={i} fill={`hsl(200, ${80 - i * 2}%, ${50 + i}%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Feature importance for top number */}
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Coeficientes do nº {logistic![0].number}:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {logistic![0].coefficients.map(c => (
                      <div key={c.feature} className="rounded bg-secondary/50 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground">{c.feature}</p>
                        <p className={`text-xs font-mono font-bold ${c.weight > 0 ? "text-primary" : "text-destructive"}`}>
                          {c.weight > 0 ? "+" : ""}{c.weight.toFixed(3)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Time Series */}
              <TabsContent value="timeseries" className="mt-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Holt-Winters Exponential Smoothing com detecção de sazonalidade por autocorrelação
                </p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeSeries!.slice(0, 20)} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <XAxis dataKey="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === "forecast") return [value.toFixed(2), "Previsão"];
                          if (name === "seasonality") return [(value * 100).toFixed(0) + "%", "Sazonalidade"];
                          return [value, name];
                        }}
                      />
                      <Bar dataKey="forecast" radius={[3, 3, 0, 0]}>
                        {timeSeries!.slice(0, 20).map((t, i) => (
                          <Cell
                            key={i}
                            fill={t.trend === "up" ? `hsl(142, 70%, ${50 + i}%)` : t.trend === "down" ? `hsl(0, 70%, ${50 + i}%)` : `hsl(45, 70%, ${50 + i}%)`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {timeSeries!.slice(0, 10).map(t => (
                    <div key={t.number} className="flex items-center gap-1 px-2 py-1 rounded bg-secondary/50 text-xs">
                      <span className="font-mono font-bold text-foreground">{String(t.number).padStart(2, "0")}</span>
                      <span className={t.trend === "up" ? "text-primary" : t.trend === "down" ? "text-destructive" : "text-muted-foreground"}>
                        {t.trend === "up" ? "↑" : t.trend === "down" ? "↓" : "→"}
                      </span>
                      {t.seasonality > 0.3 && (
                        <span className="text-[10px] text-accent-foreground bg-accent px-1 rounded">sazonal</span>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Correlation */}
              <TabsContent value="correlation" className="mt-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Coeficiente Phi (correlação binária) + Lift de co-ocorrência entre pares de dezenas
                </p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <XAxis dataKey="numA" name="Dezena A" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis dataKey="numB" name="Dezena B" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <ZAxis dataKey="lift" range={[30, 200]} name="Lift" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === "Lift") return [value.toFixed(2), "Lift"];
                          return [value, name];
                        }}
                      />
                      <Scatter
                        data={correlations!.filter(c => c.lift > 1)}
                        fill="hsl(var(--primary))"
                        fillOpacity={0.7}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto">
                  {correlations!.slice(0, 8).map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-secondary/30 rounded px-3 py-1.5">
                      <span className="font-mono font-bold text-foreground">
                        {String(c.numA).padStart(2, "0")} ↔ {String(c.numB).padStart(2, "0")}
                      </span>
                      <span className="text-muted-foreground">
                        φ={c.correlation.toFixed(3)}
                      </span>
                      <span className={`font-mono ${c.lift > 1.2 ? "text-primary" : c.lift < 0.8 ? "text-destructive" : "text-muted-foreground"}`}>
                        Lift: {c.lift.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">{c.coOccurrences}×</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Clusters */}
              <TabsContent value="clusters" className="mt-4">
                <p className="text-xs text-muted-foreground mb-3">
                  K-Means (k=5) com features: soma, paridade, posição, dispersão e consecutividade
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {clusters!.map(cluster => (
                    <div key={cluster.id} className="rounded-lg bg-secondary/50 border border-border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-foreground">{cluster.label}</span>
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-mono">
                          {cluster.size} jogos
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                        <div>
                          <p>Soma média</p>
                          <p className="font-mono text-foreground text-xs">{cluster.avgSum}</p>
                        </div>
                        <div>
                          <p>% Pares</p>
                          <p className="font-mono text-foreground text-xs">{(cluster.avgEvenRatio * 100).toFixed(0)}%</p>
                        </div>
                        <div>
                          <p>% Altas</p>
                          <p className="font-mono text-foreground text-xs">{(cluster.avgHighRatio * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                      {cluster.members.length > 0 && (
                        <div className="mt-2 text-[10px] text-muted-foreground">
                          <p>Exemplo: {cluster.members[0].map(n => String(n).padStart(2, "0")).join(" ")}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </AnimatePresence>
      )}

      {!hasResults && !running && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Clique em "Executar Análises" para rodar regressão logística, séries temporais, correlação e clusterização
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, title, value, detail }: { icon: React.ReactNode; title: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 border border-border p-3">
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
        {icon}
        <span className="truncate">{title}</span>
      </div>
      <p className="text-sm font-bold text-foreground font-mono">{value}</p>
      <p className="text-[10px] text-muted-foreground">{detail}</p>
    </div>
  );
}
