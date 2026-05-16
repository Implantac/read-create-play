import { useMemo } from "react";
import { NumberStats } from "@/features/statistics/engine";
import { DrawResult } from "@/data/lotteries";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  stats: NumberStats[];
  draws: DrawResult[];
  lotteryName: string;
}

export const QuickIntelligence = ({ stats, draws, lotteryName }: Props) => {
  const recommendation = useMemo(() => {
    if (stats.length === 0) return null;
    
    const highCycle = stats.filter(s => s.cycleScore > 1.5).length;
    const hotTrending = stats.filter(s => s.status === "hot" && s.trend > 0).length;
    
    if (highCycle > 5) {
      return {
        title: "ALTA MATURIDADE DE CICLO",
        desc: `Identificamos ${highCycle} dezenas com ciclo vencido. Momento ideal para estratégias de 'Atraso Estrutural'.`,
        action: "Usar Estratégia Frias/Ciclo",
        type: "cycle",
        severity: "high"
      };
    }
    
    if (hotTrending > 4) {
      return {
        title: "MOMENTUM DE ALTA",
        desc: `O mercado de ${lotteryName} apresenta ${hotTrending} números em tendência de subida. Recomendamos 'IA Híbrida'.`,
        action: "Seguir Tendência",
        type: "trend",
        severity: "medium"
      };
    }
    
    return {
      title: "EQUILÍBRIO ESTATÍSTICO",
      desc: "Distribuição estável detectada. Melhores resultados esperados com 'IA Ensemble'.",
      action: "Usar ML Ensemble",
      type: "stable",
      severity: "low"
    };
  }, [stats, lotteryName]);

  if (!recommendation) return null;

  return (
    <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-2xl p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Recomendação Elite</h4>
        </div>
        <Badge variant={recommendation.severity === 'high' ? 'destructive' : 'default'} className="text-[8px] h-4">
          {recommendation.severity.toUpperCase()} SIGNAL
        </Badge>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-bold text-foreground leading-tight">{recommendation.title}</p>
        <p className="text-[10px] text-muted-foreground leading-normal">{recommendation.desc}</p>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
        <CheckCircle2 className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-bold text-primary uppercase tracking-tighter cursor-pointer hover:underline">
          {recommendation.action}
        </span>
      </div>
    </div>
  );
};
