import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnalyticsSnapshot } from "@/engine/analytics-core";

interface AlphaMomentumSignalProps {
  analytics: AnalyticsSnapshot;
}

export const AlphaMomentumSignal = ({ analytics }: AlphaMomentumSignalProps) => {
  const signalValue = (100 - analytics.saturationScore + analytics.momentumIndex).toFixed(1);
  const reliability = analytics.complexityScore.toFixed(0);

  return (
    <div className="glass-card rounded-xl p-4 border border-primary/20 bg-primary/5 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-primary uppercase flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Sinal Alpha
        </span>
        <Badge className="bg-primary text-primary-foreground text-[9px] font-bold">ALPHA-BETA V5.2</Badge>
      </div>
      
      <div className="flex items-baseline gap-2 mb-4 relative z-10">
        <span className="text-3xl font-black font-mono text-foreground italic tracking-tighter">
          {signalValue}
        </span>
        <span className="text-xs text-primary font-bold">α-STR</span>
      </div>

      <div className="space-y-2 relative z-10">
        <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground">
          <span>Reliability Index</span>
          <span>{reliability}%</span>
        </div>
        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${reliability}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer"
          />
        </div>
      </div>
      
      <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <Zap className="w-24 h-24 text-primary" />
      </div>
      
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
    </div>
  );
};
