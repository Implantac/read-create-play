import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, Wallet, Activity, Sparkles, Brain } from "lucide-react";
import { StrategyMetrics } from "@/engine/strategy-lab/metrics";
import { cn } from "@/lib/utils";

interface StrategyComparisonCardProps {
  name: string;
  metrics: StrategyMetrics;
  isBest?: boolean;
}

export function StrategyComparisonCard({ name, metrics, isBest }: StrategyComparisonCardProps) {
  const roiColor = metrics.roi > 0 ? "text-emerald-500" : metrics.roi < -0.5 ? "text-rose-500" : "text-amber-500";
  const ruinColor = metrics.ruinProbability > 20 ? "text-rose-500" : metrics.ruinProbability > 5 ? "text-amber-500" : "text-emerald-500";

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      isBest ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : "bg-card/40 border-border/40"
    )}>
      {isBest && (
        <div className="absolute top-0 right-0 p-2">
          <Badge className="bg-primary text-[10px] font-black uppercase tracking-widest">Efficiency King</Badge>
        </div>
      )}

      {name.includes("Random Baseline") && (
        <div className="absolute top-0 right-0 p-2">
          <Badge variant="outline" className="text-[10px] font-black border-muted-foreground/30 text-muted-foreground">BASELINE</Badge>
        </div>
      )}
      
      <CardContent className="p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-foreground truncate">{name}</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Backtest Quantitative Analysis</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">ROI Estimado</p>
            <div className={cn("text-xl font-mono font-black italic", roiColor)}>
              {metrics.roi > 0 ? "+" : ""}{(metrics.roi * 100).toFixed(1)}%
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">Prob. Quebra</p>
            <div className={cn("text-xl font-mono font-black italic", ruinColor)}>
              {metrics.ruinProbability.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Max Drawdown
            </span>
            <span className="font-mono font-bold text-rose-400">-{metrics.drawdown.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Win Rate (Premios)
            </span>
            <span className="font-mono font-bold text-emerald-400">{metrics.winRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-muted-foreground flex items-center gap-1">
              <Wallet className="w-3 h-3" /> Total Gasto
            </span>
            <span className="font-mono text-foreground opacity-80">R$ {metrics.totalSpent.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-muted-foreground flex items-center gap-1">
              <Activity className="w-3 h-3" /> Volatilidade
            </span>
            <span className="font-mono text-foreground opacity-80">{metrics.volatility.toFixed(2)}%</span>
          </div>
          {metrics.lift !== undefined && (
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-muted-foreground flex items-center gap-1">
                <Brain className="w-3 h-3" /> Lift Estatístico
              </span>
              <div className="flex flex-col items-end">
                <span className={cn("font-mono font-bold", metrics.lift > 1 ? "text-primary" : "text-muted-foreground")}>
                  {metrics.lift.toFixed(2)}x
                </span>
                {metrics.confidenceInterval && (
                  <span className="text-[8px] text-muted-foreground font-mono">
                    IC95% [{metrics.confidenceInterval[0].toFixed(2)}-{metrics.confidenceInterval[1].toFixed(2)}]
                  </span>
                )}
              </div>
            </div>
          )}
          
          {metrics.signalIntegrity !== undefined && (
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-muted-foreground flex items-center gap-1">
                <Brain className="w-3 h-3" /> Integridade Temporal
              </span>
              <span className={cn("font-mono font-bold", metrics.signalIntegrity > 0.7 ? "text-emerald-400" : metrics.signalIntegrity > 0.4 ? "text-amber-400" : "text-rose-400")}>
                {(metrics.signalIntegrity * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {metrics.signalIntegrity !== undefined && metrics.signalIntegrity < 0.4 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span className="text-[9px] text-amber-400 font-bold uppercase">Sinal Suspeito (Overfitting?)</span>
          </div>
        )}

        {metrics.ruinProbability > 15 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span className="text-[9px] text-rose-400 font-bold uppercase">Risco de Ruína Elevado</span>
          </div>
        )}
        
        {metrics.isSignificant ? (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <div className="flex flex-col">
              <span className="text-[9px] text-emerald-400 font-bold uppercase">Significativo (p={metrics.pValue.toFixed(4)})</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/50">
            <Info className="w-3 h-3 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground font-bold uppercase">Não Significativo (p={metrics.pValue.toFixed(4)})</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
