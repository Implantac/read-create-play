import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Terminal, Activity, Zap, ShieldCheck, Cpu, Database, Network, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { calculatePredictiveEntropy } from "@/engine/predictive-entropy";

export const TitanCommandCenter = () => {
  const { draws, stats, selectedLottery } = useLotteryContext();
  const [uptime, setUptime] = React.useState(0);
  const [logs, setLogs] = React.useState<string[]>([
    "Initializating Neural Core...",
    "Syncing historical data tensors...",
    "Kernel version 5.2.0 established."
  ]);

  React.useEffect(() => {
    const timer = setInterval(() => setUptime(u => u + 1), 1000);
    const logInterval = setInterval(() => {
      const events = [
        "Neural weights redistributed",
        "Entropy variance detected",
        "Processing quantum patterns",
        "Alpha signal stabilized",
        "Cache invalidated",
        "P2P handshake verified"
      ];
      const newLog = events[Math.floor(Math.random() * events.length)];
      setLogs(prev => [newLog, ...prev.slice(0, 4)]);
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(logInterval);
    };
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
      {/* Neural Web Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="neural-web" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="0" cy="0" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neural-web)" />
        </svg>
        <motion.div 
          animate={{ 
            opacity: entropyData.entropy > 50 ? [0.1, 0.3, 0.1] : [0.05, 0.1, 0.05],
            scale: entropyData.entropy > 50 ? [1, 1.05, 1] : [1, 1.01, 1]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 bg-primary/20 blur-[100px]"
        />
      </div>

      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
        <Cpu className="w-24 h-24 text-primary animate-pulse" />
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-10">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-3 tracking-tighter italic uppercase">
            <Terminal className="w-7 h-7 text-primary" />
            Titan <span className="text-primary">Command</span> Center
          </h2>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-1">
            v5.2 — Neural Engine Elite • Institutional Grade
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
            NODE: LATAM-CORE-01
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
              <Activity className="w-3 h-3" /> Core Heatmap
            </span>
            <span className="text-[10px] font-mono text-emerald-500">OPTIMAL</span>
          </div>
          <div className="h-24 flex items-end gap-1">
            {[40, 70, 45, 90, 65, 80, 50, 85, 95, 60, 75, 55].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${i % 2 === 0 ? h : h * (1 + (Math.sin(Date.now() / 1000 + i) * 0.1))}%` }}
                className={`flex-1 ${entropyData.entropy > 50 ? 'bg-amber-500/40' : 'bg-primary/30'} rounded-t-sm transition-colors duration-500`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
            <Zap className="w-3 h-3" /> Alpha Prediction
            </span>
            <span className="text-[10px] font-mono text-primary">{entropyData.entropy.toFixed(1)}%</span>
          </div>
          <div className="bg-black/40 rounded-lg p-3 border border-white/5 h-24 flex flex-col justify-center relative overflow-hidden">
            <p className="text-[10px] text-muted-foreground leading-relaxed italic relative z-10">
              {entropyData.recommendation}
            </p>
            <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Live Event Log
            </span>
          </div>
          <div className="font-mono text-[9px] text-primary/60 space-y-1 h-24 overflow-hidden mask-fade-bottom">
            {logs.map((log, i) => (
              <p key={i} className="flex items-center gap-2 truncate">
                <ChevronRight className="w-2.5 h-2.5 text-primary/40" />
                {log}
              </p>
            ))}
            <p className="animate-pulse text-primary/40 mt-1">{`> monitoring --lottery=${selectedLottery}`}</p>
          </div>
        </div>
      </div>
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-[0.02]" />
    </motion.div>
  );
};

