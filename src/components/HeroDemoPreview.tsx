import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Brain, TrendingUp, Zap } from "lucide-react";
import { useState, useEffect } from "react";

const barSets = [
  [65, 42, 78, 35, 90, 55, 70, 48, 82, 60, 45, 73, 38, 85, 52],
  [50, 70, 60, 80, 45, 75, 55, 90, 40, 68, 58, 82, 47, 63, 72],
  [82, 55, 43, 70, 62, 88, 38, 65, 75, 50, 90, 42, 68, 48, 60],
];

const numberSets = [
  [7, 13, 22, 34, 41, 58],
  [3, 18, 25, 37, 44, 52],
  [9, 15, 28, 33, 46, 55],
  [5, 11, 20, 36, 42, 59],
];

const statValues = [
  { sorteios: "3.248", padroes: "147", winRate: "68%", score: "A+" },
  { sorteios: "3.249", padroes: "152", winRate: "71%", score: "A+" },
  { sorteios: "3.250", padroes: "149", winRate: "69%", score: "A" },
  { sorteios: "3.251", padroes: "155", winRate: "72%", score: "A+" },
];

export function HeroDemoPreview() {
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCycle(c => c + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const bars = barSets[cycle % barSets.length];
  const numbers = numberSets[cycle % numberSets.length];
  const stats = statValues[cycle % statValues.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
      className="mt-12 mx-auto max-w-4xl"
      style={{ perspective: "1200px" }}
    >
      <div className="rounded-2xl border border-border/30 glass-card overflow-hidden shadow-2xl shadow-primary/5 animate-pulse-glow ring-1 ring-primary/10" style={{ boxShadow: '0 0 30px hsl(var(--primary) / 0.12), 0 0 80px hsl(var(--primary) / 0.06), 0 20px 60px hsl(var(--primary) / 0.08)' }}>
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/20 bg-card/50">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-neon-red/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-neon-amber/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/60 ml-2">Titan Loterias — Dashboard</span>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 grid grid-cols-12 gap-4">
          {/* Stats row */}
          <div className="col-span-12 grid grid-cols-4 gap-3">
            {[
              { label: "Sorteios", value: stats.sorteios, icon: BarChart3, color: "text-primary" },
              { label: "Padrões IA", value: stats.padroes, icon: Brain, color: "text-neon-blue" },
              { label: "Win Rate", value: stats.winRate, icon: TrendingUp, color: "text-primary" },
              { label: "Score", value: stats.score, icon: Zap, color: "text-neon-amber" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 + i * 0.1 }}
                className="rounded-lg border border-border/20 bg-card/30 p-3 text-center"
              >
                <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                <motion.div
                  key={s.value}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-base md:text-lg font-bold font-mono text-foreground"
                >
                  {s.value}
                </motion.div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Chart area */}
          <div className="col-span-8 rounded-lg border border-border/20 bg-card/20 p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-mono">
              Frequência dos Números
            </div>
            <div className="flex items-end gap-[3px] h-24">
              {bars.map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/80 to-primary/30"
                />
              ))}
            </div>
          </div>

          {/* Numbers panel */}
          <div className="col-span-4 rounded-lg border border-border/20 bg-card/20 p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-mono">
              Aposta Gerada
            </div>
            <div className="grid grid-cols-3 gap-2">
              <AnimatePresence mode="popLayout">
                {numbers.map((n, i) => (
                  <motion.div
                    key={n}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 300 }}
                    className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-xs font-bold font-mono mx-auto shadow-md shadow-primary/20"
                  >
                    {n.toString().padStart(2, "0")}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.4 }}
              className="mt-3 text-center"
            >
              <span className="text-[9px] font-mono text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                Score: 94/100
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
