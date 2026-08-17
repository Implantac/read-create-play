import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, History, TrendingUp, Info, Activity } from "lucide-react";
import { StrategyComparisonCard } from "./StrategyComparisonCard";
import { BacktestResult } from "@/engine/strategy-lab/backtest-engine";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, Legend
} from "recharts";

interface BacktestDashboardProps {
  results: BacktestResult[];
}

export function BacktestDashboard({ results }: BacktestDashboardProps) {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(
    results[0]?.strategyId || null
  );

  const selectedResult = useMemo(() => 
    results.find(r => r.strategyId === selectedStrategyId) || results[0]
  , [results, selectedStrategyId]);

  const comparisonData = useMemo(() => {
    if (results.length < 2) return null;
    const top3 = results.slice(0, 3);
    const timeline: any[] = [];
    
    // Assumindo que todos os backtests têm o mesmo número de concursos
    const length = top3[0].history.length;
    for (let i = 0; i < length; i++) {
      const entry: any = { concurso: top3[0].history[i].concurso };
      top3.forEach((res, idx) => {
        entry[`strat_${idx}`] = res.history[i].equity;
      });
      timeline.push(entry);
    }
    return { timeline, strategies: top3 };
  }, [results]);

  if (results.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-black uppercase tracking-tighter italic">Simulador de Robustez</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono border-primary/20 bg-primary/5 text-primary">
            Backtest 100+ Concursos
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono border-rose-500/20 bg-rose-500/5 text-rose-400">
            Professional Grade
          </Badge>
        </div>
      </div>

      {comparisonData && (
        <Card className="bg-card/40 border-border/40 backdrop-blur-md overflow-hidden">
          <CardHeader className="pb-2 bg-muted/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Benchmark: Top 3 Estratégias
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} />
                  <XAxis dataKey="concurso" hide />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "JetBrains Mono" }} hide />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-2xl text-xs space-y-2">
                            <p className="font-bold text-primary">Concurso {payload[0].payload.concurso}</p>
                            {payload.map((p: any, i: number) => (
                              <div key={i} className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">{comparisonData.strategies[i].strategyName}:</span>
                                <span className="font-mono font-bold" style={{ color: p.color }}>R$ {p.value.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {comparisonData.strategies.map((s, i) => (
                    <Line 
                      key={s.strategyId}
                      type="monotone"
                      dataKey={`strat_${i}`}
                      name={s.strategyName}
                      stroke={i === 0 ? "hsl(var(--primary))" : i === 1 ? "hsl(var(--secondary))" : "#10b981"}
                      strokeWidth={i === 0 ? 3 : 2}
                      dot={false}
                      strokeDasharray={i === 2 ? "5 5" : ""}
                    />
                  ))}
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {results.map((res) => (
          <div 
            key={res.strategyId} 
            onClick={() => setSelectedStrategyId(res.strategyId)}
            className="cursor-pointer"
          >
            <StrategyComparisonCard 
              name={res.strategyName} 
              metrics={res.metrics} 
              isBest={res.strategyId === results[0].strategyId}
            />
          </div>
        ))}
      </div>

      {selectedResult && (
        <Card className="bg-card/40 border-border/40 backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Curva de Patrimônio: {selectedResult.strategyName}
              </CardTitle>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-black">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Patrimônio
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedResult.history}>
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} />
                  <XAxis 
                    dataKey="concurso" 
                    hide 
                  />
                  <YAxis 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "JetBrains Mono" }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-2xl text-xs space-y-1">
                            <p className="font-bold text-primary">Concurso {data.concurso}</p>
                            <p className="font-mono text-foreground font-black tracking-tight">
                              Saldo: R$ {data.equity.toFixed(2)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Hits: {data.hits} {data.isPrize ? "🏆" : ""}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorEquity)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-[1.5rem] bg-muted/20 border border-border/50">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <span className="font-bold text-foreground uppercase">Análise de Risco:</span> Esta curva representa a evolução de uma banca inicial de R$ 1.000,00 apostando {selectedResult.metrics.totalSpent / selectedResult.history.length / 3.5} jogos por concurso. 
                  O <span className="text-primary font-bold">Drawdown</span> de {selectedResult.metrics.drawdown.toFixed(1)}% indica a maior queda sofrida.
                </p>
              </div>
              <div className="flex flex-col justify-center border-l border-border/20 pl-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] uppercase font-black text-muted-foreground">Volatilidade</p>
                      <p className="text-sm font-mono font-bold text-foreground">{selectedResult.metrics.volatility.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-black text-muted-foreground">Max Loss Streak</p>
                      <p className="text-sm font-mono font-bold text-rose-400">{selectedResult.metrics.maxConsecutiveLosses} conc.</p>
                    </div>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
