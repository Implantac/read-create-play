import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  XAxis, YAxis, Tooltip, 
  ResponsiveContainer, ReferenceLine, AreaChart, Area 
} from "recharts";
import { RankingEntry } from "@/engine/strategy-evolution/types";
import { TrendingUp, AlertCircle, Info, CheckCircle2, ShieldAlert } from "lucide-react";
import { formatNumber } from "@/utils/formatters";

interface EvidenceDistributionPanelProps {
  rankings: RankingEntry[];
}

export function EvidenceDistributionPanel({ rankings }: EvidenceDistributionPanelProps) {
  const topStrategy = rankings[0];

  const distributionData = useMemo(() => {
    if (!topStrategy?.metrics.monteCarloData) return [];
    
    const data = topStrategy.metrics.monteCarloData;
    const buckets: Record<string, number> = {};
    const min = Math.min(...data);
    const max = Math.max(...data);
    const step = (max - min) / 20;

    for (let i = 0; i < 20; i++) {
      const lo = min + i * step;
      const hi = min + (i + 1) * step;
      const key = lo.toFixed(3);
      buckets[key] = data.filter(v => v >= lo && v < hi).length;
    }

    return Object.entries(buckets).map(([lift, count]) => ({
      lift: parseFloat(lift),
      count
    }));
  }, [topStrategy]);

  if (!topStrategy) return null;

  const isSignificant = topStrategy.metrics.pValue < 0.05;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card/40 border-border/40 backdrop-blur-md lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Binary className="w-4 h-4 text-primary" />
                Distribuição Monte Carlo: {topStrategy.strategyName}
              </CardTitle>
              <Badge variant={isSignificant ? "default" : "outline"} className={isSignificant ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" : ""}>
                {isSignificant ? "Sinal Validado" : "Ruído Estatístico"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={distributionData}>
                  <defs>
                    <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="lift" 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "JetBrains Mono" }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-2xl text-xs">
                            <p className="text-muted-foreground mb-1">Intervalo de Lift</p>
                            <p className="font-mono font-bold text-primary">{payload[0].payload.lift.toFixed(3)}x</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Frequência: {payload[0].value} iterações</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine x={1.0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: 'Random', position: 'top', fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <ReferenceLine x={topStrategy.metrics.lift} stroke="hsl(var(--primary))" strokeWidth={2} label={{ value: 'Real', position: 'top', fill: "hsl(var(--primary))", fontSize: 10, fontWeight: 'bold' }} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorDist)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 p-4 rounded-xl bg-muted/20 border border-border/50 flex items-start gap-3">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Este gráfico mostra a distribuição de performance de 1.000 simulações aleatórias pareadas contra os mesmos concursos.
                  A linha <span className="text-primary font-bold">Real ({topStrategy.metrics.lift.toFixed(2)}x)</span> indica o desempenho observado.
                </p>
                <p className="text-[10px] text-amber-500/80 italic">
                  Nota: A distribuição observada acima da referência simulada indica correlação histórica, mas não constitui garantia de vantagem preditiva futura.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Métricas de Confiança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] uppercase font-black text-muted-foreground">
                <span>Grau de Evidência</span>
                <Badge variant="outline" className={`font-mono text-[10px] ${
                  topStrategy.metrics.evidenceGrade === 'E4' ? 'border-emerald-500 text-emerald-500' :
                  topStrategy.metrics.evidenceGrade === 'E3' ? 'border-blue-500 text-blue-500' :
                  topStrategy.metrics.evidenceGrade === 'E0' ? 'border-destructive text-destructive' : ''
                }`}>
                  {topStrategy.metrics.evidenceGrade || 'E0'}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground italic leading-tight">
                {topStrategy.metrics.evidenceExplanation}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] uppercase font-black text-muted-foreground">
                <span>Lift Observado</span>
                <span className="text-primary">{topStrategy.metrics.lift.toFixed(3)}x</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, (topStrategy.metrics.lift / 1.5) * 100)}%` }} />
              </div>
            </div>

            <div className="pt-4 border-t border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-muted-foreground">Z-Score (Real)</span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {topStrategy.metrics.zScore.toFixed(2)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-muted-foreground">P-Value (Simulado)</span>
                <span className={`font-mono text-[10px] font-bold ${topStrategy.metrics.pValue < 0.05 ? "text-emerald-500" : "text-amber-500"}`}>
                  {topStrategy.metrics.pValue < 0.001 ? "< 0.001" : topStrategy.metrics.pValue.toFixed(3)}
                </span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 ${
              isSignificant ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"
            }`}>
              <div className="flex items-center gap-2">
                {isSignificant ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                )}
                <span className="text-xs font-bold uppercase tracking-tighter">
                  {isSignificant ? "Sinal Validado" : "Sinal Incerto"}
                </span>
              </div>
              <span className="text-[10px] text-center opacity-70 leading-tight">
                {isSignificant 
                  ? "A performance observada ultrapassa a variância aleatória esperada."
                  : "A performance pode ser atribuída à sorte ou variância estatística."}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
