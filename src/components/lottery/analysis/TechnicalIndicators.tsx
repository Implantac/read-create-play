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
  <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/10 border border-border/40 hover:border-primary/40 transition-all duration-500 group/indicator relative overflow-hidden hover:shadow-premium">
    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/indicator:opacity-100 transition-opacity" />
    <div className="flex items-center gap-4 relative z-10">
      <div className="w-10 h-10 rounded-xl bg-background/50 border border-border/60 flex items-center justify-center text-muted-foreground group-hover/indicator:text-primary group-hover/indicator:border-primary/30 transition-all duration-500 shadow-inner group-hover/indicator:rotate-3">
        <Icon className="w-5 h-5 transition-transform group-hover/indicator:scale-110" />
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 group-hover/indicator:opacity-100 group-hover/indicator:text-primary transition-all italic">{label}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="focus:outline-none">
                  <Info className="w-3 h-3 text-muted-foreground/30 hover:text-primary/50 transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[240px] text-[10px] font-medium leading-relaxed bg-popover/90 backdrop-blur-md border-primary/20">
                {description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black font-mono text-foreground tracking-tighter italic group-hover/indicator:text-primary transition-colors">{value}</span>
          {suffix && <span className="text-[10px] font-black text-muted-foreground uppercase opacity-40">{suffix}</span>}
        </div>
      </div>
    </div>
    {trend && (
      <div className={`relative z-10 text-[9px] font-black tracking-widest px-2 py-1 rounded-full border shadow-sm ${
        trend === "up" ? "text-primary bg-primary/10 border-primary/20" : 
        trend === "down" ? "text-destructive bg-destructive/10 border-destructive/20" : 
        "text-muted-foreground bg-secondary/50 border-border/60"
      }`}>
        {trend === "up" ? "STABLE" : trend === "down" ? "VOLATILE" : "ACTIVE"}
      </div>
    )}
  </div>
);


export const TechnicalIndicators = ({ analytics }: { analytics: AnalyticsSnapshot }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <Indicator 
        label="Momentum do Sinal" 
        value={analytics.momentumIndex.toFixed(2)} 
        description="Força das tendências de curto prazo baseada na aceleração das dezenas detectadas."
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
        label="Confiança Alpha" 
        value={(100 - analytics.saturationScore).toFixed(1)} 
        suffix="α"
        description="Confiança do sinal teórico baseado na ineficiência estatística detectada."
        icon={TrendingUp}
      />
    </div>
  );
};
