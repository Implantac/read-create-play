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
    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-5 animate-in fade-in slide-in-from-bottom-2 shadow-inner relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Brain className="w-20 h-20 text-primary" />
      </div>
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

      <div className="pt-3 border-t border-primary/10">
        <p className="text-[10px] text-muted-foreground leading-relaxed italic flex items-start gap-3 bg-background/40 p-3 rounded-xl border border-white/5">
          <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5 animate-pulse" />
          "Validação Alpha concluída: esta configuração otimiza o fluxo de entropia recente, alinhando-se aos clusters de coocorrência mais estáveis dos últimos 50 ciclos."
        </p>
      </div>
    </div>
  );
}
