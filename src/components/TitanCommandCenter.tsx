import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Terminal, Activity, Zap, ShieldCheck, Cpu, Database, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { useMemo } from "react";
import { calculatePredictiveEntropy } from "@/engine/predictive-entropy";

export const TitanCommandCenter = () => {
  const { draws, stats, selectedLottery } = useLotteryContext();
  const [uptime, setUptime] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => setUptime(u => u + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const entropyData = useMemo(() => {
    return calculatePredictiveEntropy(stats, draws);
  }, [stats, draws]);
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
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono text-[9px]">
            UPTIME: {formatUptime(uptime)}
          </Badge>
          <Badge variant="outline" className={`${entropyData.entropy > 50 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-primary/5 text-primary border-primary/20'} animate-pulse font-mono text-[9px]`}>
            {entropyData.chaosLevel === "EXTREME" ? "CRITICAL ENTROPY" : `ENTROPY: ${entropyData.chaosLevel}`}
          </Badge>
          <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 font-mono text-[9px]">
            NODE: CLOUD-SÃO-PAULO-01
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
            {[40, 70, 45, 90, 65, 80, 50, 85, 95, 60, 75, 55].map((h, i) => {
              const animatedH = i % 2 === 0 ? h : h * (1 + (Math.sin(Date.now() / 1000) * 0.1));
              return (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${animatedH}%` }}
                  className={`flex-1 ${entropyData.entropy > 50 ? 'bg-amber-500/40' : 'bg-primary/20'} rounded-t-sm transition-colors duration-500`}
                />
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
            <Zap className="w-3 h-3" /> Predictive Entropy
            </span>
            <span className="text-[10px] font-mono text-primary">{entropyData.entropy.toFixed(1)}%</span>
          </div>
          <div className="bg-black/20 rounded-lg p-3 border border-white/5 h-24 flex flex-col justify-center">
            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
              {entropyData.recommendation}
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
            <p className="flex items-center gap-2"><Database className="w-2.5 h-2.5" /> [DB] Synced {draws.length} records for {selectedLottery}</p>
            <p className="flex items-center gap-2"><Network className="w-2.5 h-2.5" /> [P2P] Neural weights redistributed</p>
            <p className="flex items-center gap-2 text-amber-500/80"><Zap className="w-2.5 h-2.5" /> [CORE] Entropy signal: {entropyData.signalStrength.toFixed(0)}% strength</p>
            <p className="animate-pulse flex items-center gap-2"><Cpu className="w-2.5 h-2.5" /> [IA] Processing quantum patterns...</p>
            <p className="text-primary/30 text-[8px] mt-1">{`> exec --optimize --lottery=${selectedLottery}`}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
