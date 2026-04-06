import { useMemo } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, Zap, AlertTriangle } from "lucide-react";

interface Props {
  stats: Array<{ number: number; frequency: number; lastSeen: number; status: string }>;
  draws: Array<{ numbers: number[] }>;
  lotteryName: string;
}

export function AIInsightsCard({ stats, draws, lotteryName }: Props) {
  const insights = useMemo(() => {
    if (stats.length === 0 || draws.length === 0) return [];

    const result: { icon: any; text: string; type: "info" | "warning" | "positive" }[] = [];

    // Hot numbers insight
    const hot = stats.filter(s => s.status === "hot").slice(0, 5).map(s => String(s.number).padStart(2, "0"));
    if (hot.length > 0) {
      result.push({
        icon: TrendingUp,
        text: `Dezenas em alta: ${hot.join(", ")} — aparecem com frequência acima da média nos últimos sorteios.`,
        type: "positive",
      });
    }

    // Cold numbers insight
    const cold = stats.filter(s => s.status === "cold").sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 5).map(s => String(s.number).padStart(2, "0"));
    if (cold.length > 0) {
      result.push({
        icon: TrendingDown,
        text: `Dezenas atrasadas: ${cold.join(", ")} — estão sem aparecer há mais tempo que o esperado.`,
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
          text: `${repeated.length} dezena${repeated.length > 1 ? "s" : ""} se repetiram entre os 2 últimos concursos — padrão de continuidade detectado.`,
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
      className="glass-card rounded-xl border border-border/50 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Insights da IA</h3>
          <p className="text-[10px] text-muted-foreground">Análise automática — {lotteryName}</p>
        </div>
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-2.5 text-xs"
          >
            <insight.icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${typeColors[insight.type]}`} />
            <p className="text-muted-foreground leading-relaxed">{insight.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
