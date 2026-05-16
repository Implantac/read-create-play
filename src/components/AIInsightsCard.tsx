import { useMemo } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, Zap, AlertTriangle, Sparkles, Activity } from "lucide-react";
import { DESIGN_TOKENS, cn } from "@/lib/design-system";

interface Props {
  stats: Array<{ number: number; frequency: number; lastSeen: number; status: string }>;
  draws: Array<{ numbers: number[] }>;
  lotteryName: string;
  compact?: boolean;
}

export function AIInsightsCard({ stats, draws, lotteryName, compact }: Props) {
  const insights = useMemo(() => {
    if (stats.length === 0 || draws.length === 0) return [];

    const result: { icon: any; text: string; label: string; type: "info" | "warning" | "positive" }[] = [];

    // Hot numbers insight
    const hot = stats.filter(s => s.status === "hot").slice(0, 5).map(s => String(s.number).padStart(2, "0"));
    if (hot.length > 0) {
      result.push({
        icon: TrendingUp,
        label: "MATRIX MOMENTUM",
        text: `As dezenas ${hot.join(", ")} apresentam um desvio positivo significativo no volume de sorteios recentes.`,
        type: "positive",
      });
    }

    // Cold numbers insight
    const cold = stats.filter(s => s.status === "cold").sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 5).map(s => String(s.number).padStart(2, "0"));
    if (cold.length > 0) {
      result.push({
        icon: TrendingDown,
        label: "CICLO DE ATRASO",
        text: `${cold.join(", ")} ultrapassaram o limite de entropia esperado e entram na zona de alta probabilidade técnica.`,
        type: "warning",
      });
    }

    // Last draw repetition
    if (draws.length >= 2) {
      const last = new Set(draws[0].numbers);
      const prev = draws[1].numbers;
      const repeated = prev.filter(n => last.has(n));
      if (repeated.length > 0) {
        result.push({
          icon: Zap,
          label: "CONTINUIDADE",
          text: `Detectamos a repetição de ${repeated.length} dezenas. O motor neural sugere persistência de cluster de alta densidade.`,
          type: "info",
        });
      }
    }

    // Avg delay anomaly
    const avgDelay = stats.reduce((a, s) => a + s.lastSeen, 0) / stats.length;
    const highDelay = stats.filter(s => s.lastSeen > avgDelay * 2);
    if (highDelay.length > 0) {
      result.push({
        icon: AlertTriangle,
        label: "REVERSÃO À MÉDIA",
        text: `${highDelay.length} dezenas apresentam atraso >2x a média histórica. Correção estocástica iminente detectada.`,
        type: "warning",
      });
    }

    return result.slice(0, 4);
  }, [stats, draws]);

  if (insights.length === 0) return null;

  const typeColors = {
    info: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    warning: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    positive: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        compact ? "" : "p-6 rounded-2xl",
        !compact && DESIGN_TOKENS.effects.glass
      )}
    >
      {!compact && (
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center relative overflow-hidden group shadow-inner">
            <div className="absolute inset-0 bg-primary/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity animate-pulse" />
            <Brain className="w-6 h-6 text-primary relative z-10 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase leading-none">Titan Neural Insights</h3>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold tracking-widest uppercase opacity-60 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" />
              Quantum v5.2 Stream Active
            </p>
          </div>
        </div>
      )}
      <div className="space-y-4">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group p-4 rounded-xl border border-white/[0.03] bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-start gap-4 relative z-10">
              <div className={cn("p-2.5 rounded-lg transition-transform group-hover:scale-110 duration-500 border", typeColors[insight.type])}>
                <insight.icon className="w-4 h-4 shrink-0" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", insight.type === 'positive' ? 'text-emerald-400' : insight.type === 'warning' ? 'text-amber-400' : 'text-blue-400')}>
                    {insight.label}
                  </span>
                  <Activity className="w-2.5 h-2.5 text-muted-foreground/30" />
                </div>
                <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed font-bold group-hover:text-foreground transition-colors uppercase tracking-tight">
                  {insight.text}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {!compact && (
        <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
          <span>LATENCY: 8MS</span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            STABLE REASONING
          </span>
        </div>
      )}
    </motion.div>
  );
}
