import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Activity, Database, Cpu, Share2, Lock, Fingerprint, Network } from "lucide-react";

export function SystemAuditStatus() {
  const [entropy, setEntropy] = useState(0.842);
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setEntropy(0.84 + Math.random() * 0.01);
      const events = [
        "Neural weights verified",
        "Neural weights synced",
        "Chaos entropy: nominal",
        "Neural handshake: OK",
        "Node TITAN-01: Stable",
        "Database: Latency 14ms"
      ];
      const event = events[Math.floor(Math.random() * events.length)];
      setLogs(prev => [event, ...prev].slice(0, 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    { label: "Neural", status: "Active", icon: Cpu, color: "text-primary" },
    { label: "Sync", status: "Live", icon: Database, color: "text-neon-blue" },
    { label: "Security", status: "Shield-X", icon: ShieldCheck, color: "text-accent" },
  ];

  return (
    <div className="p-5 bg-black/60 border border-primary/20 rounded-2xl space-y-5 relative overflow-hidden group backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-5 h-5 text-primary animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Audit Protocol</span>
            <span className="text-[8px] font-mono text-primary/60">V5.3.0-INSTITUTIONAL</span>
          </div>
        </div>
        <Badge variant="outline" className="text-[8px] font-mono border-primary/20 bg-primary/5 text-primary h-5">SECURE</Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all group/metric">
            <m.icon className={`w-4 h-4 ${m.color} group-hover/metric:scale-110 transition-transform`} />
            <div className="text-center">
              <p className="text-[8px] font-black uppercase text-foreground/60">{m.label}</p>
              <p className="text-[9px] font-mono text-foreground font-bold">{m.status}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-white/5 pt-4">
        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest opacity-40">
          <span>Neural Entropy</span>
          <span className="font-mono">{entropy.toFixed(4)}</span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            animate={{ width: `${entropy * 100}%` }}
            className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
          />
        </div>
      </div>

      <div className="space-y-1.5 min-h-[45px]">
        <AnimatePresence mode="popLayout">
          {logs.map((log, i) => (
            <motion.p 
              key={log}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 5 }}
              className="text-[8px] font-mono text-primary/40 flex items-center gap-2"
            >
              <Lock className="w-2 h-2" />
              {log}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>

      <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-1 bg-primary/20 group-hover:bg-primary/50 transition-colors" />
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${className}`}>
      {children}
    </div>
  );
}
