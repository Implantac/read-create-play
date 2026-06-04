import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnalyticsSnapshot } from "@/engine/stats/analytics-core";

interface AlphaMomentumSignalProps {
  analytics: AnalyticsSnapshot;
}

export const AlphaMomentumSignal = ({ analytics }: AlphaMomentumSignalProps) => {
  const signalValue = (100 - analytics.saturationScore + analytics.momentumIndex).toFixed(1);
  const reliability = analytics.complexityScore.toFixed(0);

  return (
    <div className="glass-card rounded-2xl p-5 border border-primary/20 bg-primary/5 relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
          Sinal Alpha
        </span>
        <Badge variant="outline" className="border-primary/30 text-primary text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">ALPHA-CORE V5.3</Badge>
      </div>
      
      <div className="flex items-baseline gap-2 mb-6 relative z-10 group-hover:translate-x-1 transition-transform duration-500">
        <span className="text-4xl font-black font-mono text-foreground italic tracking-tighter drop-shadow-sm">
          {signalValue}
        </span>
        <span className="text-[10px] text-primary font-black uppercase tracking-widest opacity-80">α-Momentum</span>
      </div>

      <div className="space-y-3 relative z-10">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
          <span>Reliability Index</span>
          <span className="font-mono text-primary">{reliability}%</span>
        </div>
        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${reliability}%` }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer shadow-[0_0_10px_rgba(var(--primary),0.5)]"
          />
        </div>
      </div>
      
      <div className="absolute -bottom-8 -right-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700">
        <Zap className="w-32 h-32 text-primary" />
      </div>
      
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[80px] -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </div>

  );
};
