import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EvolutionProfile } from "@/engine/strategy-evolution";
import { Shield, Target, Zap, Award, Layers } from "lucide-react";

// ═══════════════════════════════════════════════════════
// SHARED CONSTANTS & HELPERS
// ═══════════════════════════════════════════════════════

export const PROFILE_INFO: Record<EvolutionProfile, { label: string; desc: string; icon: LucideIcon; color: string }> = {
  economico: { label: "Econômico", desc: "Menos jogos, menor custo", icon: Shield, color: "text-blue-500" },
  equilibrado: { label: "Equilibrado", desc: "Melhor custo-benefício", icon: Target, color: "text-primary" },
  agressivo: { label: "Agressivo", desc: "Máxima performance", icon: Zap, color: "text-amber-500" },
  profissional: { label: "Profissional", desc: "Análise completa", icon: Award, color: "text-purple-500" },
  cobertura_extrema: { label: "Cobertura Extrema", desc: "Máxima cobertura numérica", icon: Layers, color: "text-rose-500" },
};

export const RANK_COLORS = [
  "hsl(var(--primary))",
  "hsl(45 93% 47%)",
  "hsl(24 75% 50%)",
  "hsl(var(--muted-foreground))",
];

export const GRADE_STYLES: Record<string, string> = {
  S: "bg-primary/15 text-primary border-primary/25 ring-1 ring-primary/10",
  A: "bg-green-500/15 text-green-500 border-green-500/25",
  B: "bg-amber-500/15 text-amber-500 border-amber-500/25",
  C: "bg-orange-500/15 text-orange-500 border-orange-500/25",
  D: "bg-destructive/15 text-destructive border-destructive/25",
};

export const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function trendIcon(t: string) {
  if (t === "up") return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
  if (t === "down") return <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

// ═══════════════════════════════════════════════════════
// SHARED SMALL COMPONENTS
// ═══════════════════════════════════════════════════════

export function MetricBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`text-center p-4 rounded-[1.25rem] border transition-all duration-300 group hover:shadow-lg ${accent ? "bg-primary/10 border-primary/20 hover:bg-primary/20" : "bg-white/[0.02] border-white/5 hover:border-white/10"}`}>
      <div className={`text-xl font-mono font-black italic tracking-tighter leading-none ${accent ? "text-primary" : "text-foreground opacity-80"}`}>{value}</div>
      <div className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-3 opacity-40 leading-none italic">{label}</div>
    </div>
  );
}

export function MetricPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <span className="text-[10px] text-muted-foreground">
      {label}: <span className={`font-mono ${highlight ? "text-primary font-bold" : "text-foreground font-medium"}`}>{value}</span>
    </span>
  );
}

export function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-muted/10 border border-border text-center">
      <div className="text-sm font-mono font-bold text-foreground">{value}</div>
      <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

export function NumberBall({ num, maxNum }: { num: number; maxNum: number }) {
  const quarterSize = Math.ceil(maxNum / 4);
  const q = Math.min(3, Math.floor((num - 1) / quarterSize));
  const colors = [
    "bg-blue-500/15 text-blue-600 border-blue-500/20 dark:text-blue-400",
    "bg-emerald-500/15 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    "bg-amber-500/15 text-amber-600 border-amber-500/20 dark:text-amber-400",
    "bg-rose-500/15 text-rose-600 border-rose-500/20 dark:text-rose-400",
  ];
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border shadow-sm ${colors[q]}`}>
      {num.toString().padStart(2, "0")}
    </span>
  );
}

export function QualityBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const color = value >= 80 ? "bg-green-500" : value >= 60 ? "bg-primary" : value >= 40 ? "bg-amber-500" : "bg-destructive";
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="text-muted-foreground flex items-center gap-1 w-20 shrink-0">{icon}{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="font-mono font-bold text-foreground w-8 text-right">{value.toFixed(0)}</span>
    </div>
  );
}

export function GradeDistributionBar({ groups, total }: { groups: Record<string, number>; total: number }) {
  const grades = ["S", "A", "B", "C", "D"] as const;
  const barColors: Record<string, string> = {
    S: "bg-primary", A: "bg-green-500", B: "bg-amber-500", C: "bg-orange-500", D: "bg-destructive",
  };
  if (total === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex h-3 rounded-full overflow-hidden bg-muted/20">
        {grades.map(g => {
          const pct = (groups[g] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={g}
              className={`${barColors[g]} transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${g}: ${groups[g]} (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[9px] text-muted-foreground">
        {grades.filter(g => groups[g] > 0).map(g => (
          <span key={g} className="flex items-center gap-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${barColors[g]}`} />
            <span className="font-mono font-bold">{g}</span>
            <span>{((groups[g] / total) * 100).toFixed(0)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
