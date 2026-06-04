import React from "react";
import { motion } from "framer-motion";
import { Share2, Zap, Shield, Cpu, Activity } from "lucide-react";
import { AnalyticsSnapshot } from "@/engine/stats/analytics-core";
import { Badge } from "@/components/ui/badge";

interface NeuralSynergyCoreProps {
  analytics: AnalyticsSnapshot;
}

export const NeuralSynergyCore = ({ analytics }: NeuralSynergyCoreProps) => {
  const engines = [
    { name: "Genetic GA-X", status: "SYNCED", load: 42 },
    { name: "Markov Matrix", status: "ACTIVE", load: 68 },
    { name: "Simulated Annealing", status: "OPTIMIZING", load: 25 },
    { name: "Quantum Entropy", status: "CALIBRATED", load: 89 }
  ];

  return (
    <div className="glass-card rounded-2xl border border-primary/20 p-6 bg-black/40 backdrop-blur-xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-foreground flex items-center gap-2 tracking-tighter italic uppercase">
            <Share2 className="w-5 h-5 text-primary" />
            Neural Synergy Core
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-0.5">
            Engine Fusion • v5.3 Synergy Protocol
          </p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 animate-pulse font-mono text-[9px]">
          SYNC: {analytics.synergyScore.toFixed(1)}%
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2 mb-2">
            <Cpu className="w-3 h-3" /> Engine Fusion Matrix
          </span>
          {engines.map((engine, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-foreground/80">{engine.name}</span>
                <span className={engine.status === "OPTIMIZING" ? "text-accent" : "text-primary"}>{engine.status}</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${engine.load}%` }}
                  className="h-full bg-primary/40"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
              <Activity className="w-3 h-3" /> Quantum Flux Indicator
            </span>
            <div className="relative h-20 bg-black/40 rounded-lg border border-white/5 flex items-center justify-center overflow-hidden">
              <svg className="absolute inset-0 w-full h-full opacity-30">
                <path
                  d="M 0 40 Q 50 10 100 40 T 200 40 T 300 40 T 400 40"
                  fill="transparent"
                  stroke="var(--primary)"
                  strokeWidth="2"
                />
              </svg>
              <div className="relative z-10 text-center">
                <span className="text-2xl font-black text-primary font-mono tracking-tighter">
                  {analytics.quantumFlux.toFixed(2)}
                </span>
                <p className="text-[8px] text-muted-foreground uppercase font-mono">FLUX VELOCITY</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <div className="flex-1 bg-primary/5 rounded-lg p-3 border border-primary/10">
              <span className="text-[8px] text-muted-foreground uppercase font-mono block mb-1">Confidence</span>
              <span className="text-sm font-bold text-foreground font-mono">{analytics.institutionalConfidence.toFixed(1)}%</span>
            </div>
            <div className="flex-1 bg-accent/5 rounded-lg p-3 border border-accent/10">
              <span className="text-[8px] text-muted-foreground uppercase font-mono block mb-1">Alpha Level</span>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-accent" />
                <span className="text-sm font-bold text-foreground font-mono">ELITE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
