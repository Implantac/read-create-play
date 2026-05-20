import { motion } from "framer-motion";
import { ShieldCheck, Activity, Database, Cpu } from "lucide-react";

export function SystemAuditStatus() {
  const metrics = [
    { label: "Core", status: "Active", icon: Cpu, color: "text-primary" },
    { label: "DB", status: "Synced", icon: Database, color: "text-neon-blue" },
    { label: "AI", status: "Ready", icon: ShieldCheck, color: "text-accent" },
  ];

  return (
    <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">System Audit</span>
        </div>
        <span className="text-[8px] font-mono text-primary/60 px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5">V4.0.2</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-black/40 border border-white/5">
            <m.icon className={`w-3 h-3 ${m.color}`} />
            <span className="text-[8px] font-bold uppercase text-foreground/80">{m.label}</span>
            <span className="text-[7px] font-mono text-muted-foreground">{m.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
