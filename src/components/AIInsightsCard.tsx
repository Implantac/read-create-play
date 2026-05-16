import { useMemo } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, Zap, AlertTriangle } from "lucide-react";

interface Props {
  stats: Array<{ number: number; frequency: number; lastSeen: number; status: string }>;
  draws: Array<{ numbers: number[] }>;
  lotteryName: string;
  compact?: boolean;
}

export function AIInsightsCard({ stats, draws, lotteryName, compact }: Props) {
  const insights = useMemo(() => {
    if (stats.length === 0 || draws.length === 0) return [];

    const result: { icon: any; text: string; type: "info" | "warning" | "positive" }[] = [];

    // Hot numbers insight
    const hot = stats.filter(s => s.status === "hot").slice(0, 5).map(s => String(s.number).padStart(2, "0"));
    if (hot.length > 0) {
      result.push({
        icon: TrendingUp,
        text: `Matrix Momentum: As dezenas ${hot.join(", ")} apresentam um desvio positivo significativo no volume de sorteios recentes.`,
        type: "positive",
      });
    }

    // Cold numbers insight
    const cold = stats.filter(s => s.status === "cold").sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 5).map(s => String(s.number).padStart(2, "0"));
    if (cold.length > 0) {
      result.push({
        icon: TrendingDown,
        text: `Ciclo de Atraso: ${cold.join(", ")} ultrapassaram o limite de entropia esperado e entram na zona de alta probabilidade técnica.`,
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
          text: `Padrão de Continuidade: Detectamos a repetição de ${repeated.length} dezenas. O motor neural sugere persistência de cluster.`,
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
        text: `${highDelay.length} dezena${highDelay.length > 1 ? "s" : ""} com atraso anômalo (>2x média) — candidatas a correção estatística.`,
        type: "warning",
      });
    }

    return result.slice(0, 4);
  }, [stats, draws]);

  if (insights.length === 0) return null;

  const typeColors = {
    info: "text-neon-blue",
    warning: "text-accent",
    positive: "text-primary",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={compact ? "" : "glass-card rounded-xl border border-border/50 p-5"}
    >
      {!compact && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/10 animate-pulse" />
            <Brain className="w-5 h-5 text-primary relative z-10" />
          </div>
          <div>
            <h3 className="text-base font-black text-foreground tracking-tight uppercase">Titan Insights</h3>
            <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-60">Neural Engine v4.0</p>
          </div>
        </div>
      )}
      <div className="space-y-5">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-4 text-xs group p-3 rounded-xl border border-white/[0.03] bg-white/[0.02] hover:bg-white/[0.04] transition-all"
          >
            <div className={`p-2 rounded-lg ${insight.type === 'positive' ? 'bg-primary/10' : insight.type === 'warning' ? 'bg-accent/10' : 'bg-blue-500/10'} group-hover:scale-110 transition-transform`}>
              <insight.icon className={`w-4 h-4 shrink-0 ${typeColors[insight.type]}`} />
            </div>
            <p className="text-muted-foreground leading-relaxed font-semibold">{insight.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
