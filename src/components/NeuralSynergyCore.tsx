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
    { name: "Engine GA-X (Genético)", status: "SYNCED", load: 42 },
    { name: "Matrix Markov v2.4", status: "ACTIVE", load: 68 },
    { name: "Annealing Estocástico", status: "OPTIMIZING", load: 25 },
    { name: "Entropia Quântica", status: "CALIBRATED", load: 89 }
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
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/40 animate-pulse font-black tracking-widest text-[9px] px-3 py-1 rounded-full shadow-lg shadow-primary/10">
          CORE-SYNC: {analytics.synergyScore.toFixed(1)}%
        </Badge>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 flex items-center gap-2 mb-4">
            <Cpu className="w-3.5 h-3.5 text-primary" /> Matrix Fusion Distribution
          </span>

          {engines.map((engine, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest mb-1.5">
                <span className="text-foreground/70">{engine.name}</span>
                <span className={`italic ${engine.status === "OPTIMIZING" ? "text-accent" : "text-primary"}`}>{engine.status}</span>
              </div>

              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${engine.load}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="h-full bg-gradient-to-r from-primary/60 to-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                />
              </div>

            </div>
          ))}
        </div>

        <div className="flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 flex items-center gap-2 mb-4">
              <Activity className="w-3.5 h-3.5 text-primary" /> Flux Velocity Index
            </span>

            <div className="relative h-24 bg-black/60 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden shadow-inner group/flux">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-0 group-hover/flux:opacity-100 transition-opacity duration-700" />
              <svg className="absolute inset-0 w-full h-full opacity-20">

                <path
                  d="M 0 40 Q 50 10 100 40 T 200 40 T 300 40 T 400 40"
                  fill="transparent"
                  stroke="var(--primary)"
                  strokeWidth="2"
                />
              </svg>
              <div className="relative z-10 text-center group-hover/flux:scale-110 transition-transform duration-500">
                <span className="text-4xl font-black text-primary font-mono tracking-tighter italic drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                  {analytics.quantumFlux.toFixed(2)}
                </span>
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40 mt-1">Velocity Protocol</p>
              </div>

            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <div className="flex-1 bg-primary/10 rounded-xl p-4 border border-primary/20 shadow-lg shadow-primary/5 group/box transition-all hover:bg-primary/15">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary opacity-60 block mb-1">Confidence Node</span>
              <span className="text-xl font-black text-foreground font-mono italic">{analytics.institutionalConfidence.toFixed(1)}%</span>
            </div>
            <div className="flex-1 bg-accent/10 rounded-xl p-4 border border-accent/20 shadow-lg shadow-accent/5 group/box transition-all hover:bg-accent/15">
              <span className="text-[9px] font-black uppercase tracking-widest text-accent opacity-60 block mb-1">Elite Alpha Path</span>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent animate-pulse" />
                <span className="text-lg font-black text-foreground font-mono italic">ACTIVE</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
