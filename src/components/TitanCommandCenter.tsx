import { motion } from "framer-motion";
import { Terminal, Activity, Zap, ShieldCheck, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const TitanCommandCenter = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl border border-primary/20 p-6 bg-black/40 backdrop-blur-xl relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
        <Cpu className="w-24 h-24 text-primary animate-pulse" />
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-3 tracking-tighter italic uppercase">
            <Terminal className="w-7 h-7 text-primary" />
            Titan <span className="text-primary">Command</span> Center
          </h2>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-1">
            v5.0 — Neural Network Core • Multi-Threaded Processing
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 animate-pulse">
            SISTEMA OPERACIONAL
          </Badge>
          <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20">
            LATÊNCIA: 12MS
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
              <Activity className="w-3 h-3" /> Health Status
            </span>
            <span className="text-[10px] font-mono text-emerald-500">OPTIMAL</span>
          </div>
          <div className="h-24 flex items-end gap-1">
            {[40, 70, 45, 90, 65, 80, 50, 85, 95, 60, 75, 55].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                className="flex-1 bg-primary/20 rounded-t-sm"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
              <Zap className="w-3 h-3" /> Predictive Entropy
            </span>
            <span className="text-[10px] font-mono text-primary">87.4%</span>
          </div>
          <div className="bg-black/20 rounded-lg p-3 border border-white/5 h-24 flex flex-col justify-center">
            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
              A convergência de padrões sugere uma quebra de tendência nos próximos 3 ciclos. Recomenda-se estratégia de cobertura.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Audit Log
            </span>
          </div>
          <div className="font-mono text-[9px] text-primary/60 space-y-1 h-24 overflow-hidden">
            <p>[SYSTEM] Neural weights updated</p>
            <p>[WORKER] Monte Carlo simulation complete</p>
            <p>[CORE] Entropy threshold: 0.124</p>
            <p className="animate-pulse">[AI] Scanning for convergences...</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
