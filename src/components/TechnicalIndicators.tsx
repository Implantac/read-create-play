import React from "react";
import { motion } from "framer-motion";
import { Activity, Zap, TrendingUp, BarChart, Target, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AnalyticsSnapshot } from "@/engine/stats/analytics-core";

interface IndicatorProps {
  label: string;
  value: string | number;
  suffix?: string;
  description: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ElementType;
}

const Indicator = ({ label, value, suffix = "", description, trend, icon: Icon }: IndicatorProps) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 transition-all group">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-md bg-white/5 text-muted-foreground group-hover:text-primary transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-[10px]">
                {description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-mono font-bold text-foreground">{value}</span>
          {suffix && <span className="text-[10px] text-muted-foreground uppercase">{suffix}</span>}
        </div>
      </div>
    </div>
    {trend && (
      <div className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
        trend === "up" ? "text-primary bg-primary/10" : 
        trend === "down" ? "text-destructive bg-destructive/10" : 
        "text-muted-foreground bg-white/5"
      }`}>
        {trend === "up" ? "↑ STABLE" : trend === "down" ? "↓ VOLATILE" : "• NEUTRAL"}
      </div>
    )}
  </div>
);

export const TechnicalIndicators = ({ analytics }: { analytics: AnalyticsSnapshot }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <Indicator 
        label="Momentum IA" 
        value={analytics.momentumIndex.toFixed(2)} 
        description="Força das tendências de curto prazo baseada na aceleração das dezenas 'quentes'."
        icon={Zap}
        trend={analytics.momentumIndex > 50 ? "up" : "neutral"}
      />
      <Indicator 
        label="Entropia Sazonal" 
        value={analytics.complexityScore.toFixed(1)} 
        suffix="pts"
        description="Nível de desordem estatística. Valores altos indicam comportamento errático do sorteio."
        icon={Activity}
        trend={analytics.complexityScore > 60 ? "down" : "up"}
      />
      <Indicator 
        label="Índice VIX-L" 
        value={analytics.volatilityIndex.toFixed(2)} 
        suffix="v"
        description="Volatilidade do ranking de frequências. Mede a instabilidade das dezenas no topo."
        icon={TrendingUp}
        trend={analytics.volatilityIndex > 15 ? "down" : "up"}
      />
      <Indicator 
        label="Saturação Global" 
        value={analytics.saturationScore.toFixed(1)} 
        suffix="%"
        description="Percentual de esgotamento das tendências atuais. Sinaliza reversão iminente."
        icon={Target}
      />
      <Indicator 
        label="Dispersão Ratio" 
        value={analytics.dispersionRatio.toFixed(2)} 
        description="Relação entre o atraso médio e o desvio teórico esperado."
        icon={BarChart}
      />
      <Indicator 
        label="Expectativa Alpha" 
        value={(100 - analytics.saturationScore).toFixed(1)} 
        suffix="α"
        description="Potencial de ganho teórico baseado na ineficiência estatística detectada."
        icon={TrendingUp}
      />
    </div>
  );
};
