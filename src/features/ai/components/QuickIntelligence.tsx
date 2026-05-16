import { useMemo } from "react";
import { NumberStats } from "@/features/statistics/engine";
import { DrawResult } from "@/data/lotteries";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Zap, ArrowRight, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DESIGN_TOKENS, cn } from "@/lib/design-system";
import { motion } from "framer-motion";

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
        severity: "high",
        icon: Gauge
      };
    }
    
    if (hotTrending > 4) {
      return {
        title: "MOMENTUM DE ALTA",
        desc: `O mercado de ${lotteryName} apresenta ${hotTrending} números em tendência de subida. Recomendamos 'IA Híbrida'.`,
        action: "Seguir Tendência",
        type: "trend",
        severity: "medium",
        icon: Zap
      };
    }
    
    return {
      title: "EQUILÍBRIO ESTATÍSTICO",
      desc: "Distribuição estável detectada. Melhores resultados esperados com 'IA Ensemble'.",
      action: "Usar ML Ensemble",
      type: "stable",
      severity: "low",
      icon: Sparkles
    };
  }, [stats, lotteryName]);

  if (!recommendation) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "p-5 rounded-2xl space-y-5 border group relative overflow-hidden",
        DESIGN_TOKENS.effects.glass
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl opacity-20 -z-10 group-hover:bg-primary/20 transition-all duration-700" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
            <recommendation.icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Elite Intelligence</h4>
            <Badge variant="outline" className={cn(
              "text-[8px] h-4 mt-1 border-transparent px-1.5",
              recommendation.severity === 'high' ? 'bg-rose-500/20 text-rose-400' : 
              recommendation.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' : 
              'bg-emerald-500/20 text-emerald-400'
            )}>
              {recommendation.severity.toUpperCase()} SIGNAL DETECTED
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-2 relative z-10">
        <p className="text-sm font-black text-white leading-tight tracking-tight uppercase group-hover:text-primary transition-colors">
          {recommendation.title}
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed font-bold uppercase tracking-tighter opacity-70">
          {recommendation.desc}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">
            {recommendation.action}
          </span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
      </div>
    </motion.div>
  );
};
