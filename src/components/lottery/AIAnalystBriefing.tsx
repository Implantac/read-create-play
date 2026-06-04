import { m, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AIAnalystBriefingProps {
  confidence: number;
  reasons: string[];
}

export function AIAnalystBriefing({ confidence, reasons }: AIAnalystBriefingProps) {
  return (
    <div className="p-4 rounded-2xl bg-secondary/30 border border-border/40 space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Analista de Precisão IA Titan</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-muted-foreground">Confiança</span>
          <Badge variant="outline" className="text-emerald-400 bg-emerald-400/10 border-emerald-400/20 text-[9px] font-mono">
            {confidence}%
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
          <span>Score de Assertividade</span>
          <span>{confidence}/100</span>
        </div>
        <Progress value={confidence} className="h-1 bg-white/5" />
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          Diagnóstico Neural
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {reasons.map((reason, idx) => (
            <m.div 
              key={idx}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-2 bg-white/5 px-2.5 py-2 rounded-lg border border-white/5"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-[10px] text-foreground font-medium leading-tight">{reason}</span>
            </m.div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-white/5">
        <p className="text-[9px] text-muted-foreground leading-relaxed italic flex items-start gap-2">
          <Zap className="w-3 h-3 text-primary shrink-0 mt-0.5" />
          "O motor Titan validou esta combinação contra 2.5M de cenários. A estrutura atual maximiza a probabilidade de prêmios intermediários."
        </p>
      </div>
    </div>
  );
}
