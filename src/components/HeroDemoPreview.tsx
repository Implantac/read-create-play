import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Brain, TrendingUp, Zap, Activity, Sparkles, Target } from "lucide-react";
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

const linePoints = [
  [20, 65, 40, 80, 55, 35, 70, 45, 85, 60],
  [45, 30, 70, 50, 85, 40, 60, 75, 35, 55],
  [60, 75, 35, 55, 45, 80, 50, 30, 70, 65],
];

const statusMessages = [
  "Analisando padrões de frequência...",
  "Modelo neural processando dados...",
  "Otimizando combinações via Monte Carlo...",
  "Validando com backtesting histórico...",
];

export function HeroDemoPreview() {
  const [cycle, setCycle] = useState(0);
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCycle(c => c + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(d => (d % 3) + 1);
    }, 500);
    return () => clearInterval(dotInterval);
  }, []);

  const bars = barSets[cycle % barSets.length];
  const numbers = numberSets[cycle % numberSets.length];
  const stats = statValues[cycle % statValues.length];
  const points = linePoints[cycle % linePoints.length];
  const statusMsg = statusMessages[cycle % statusMessages.length];

  // Generate SVG line path
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * 28 + 10} ${100 - p}`)
    .join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
      className="mt-12 mx-auto max-w-5xl"
      style={{ perspective: "1200px" }}
    >
      <div
        className="rounded-2xl border border-border/30 glass-card overflow-hidden ring-1 ring-primary/10 relative"
        style={{
          boxShadow:
            "0 0 30px hsl(var(--primary) / 0.12), 0 0 80px hsl(var(--primary) / 0.06), 0 20px 60px hsl(var(--primary) / 0.08)",
        }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/2 -right-1/4 w-96 h-96 rounded-full"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.08), transparent 70%)" }}
          />
          <motion.div
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: [1.1, 1, 1.1],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-1/3 -left-1/4 w-80 h-80 rounded-full"
            style={{ background: "radial-gradient(circle, hsl(var(--neon-blue) / 0.06), transparent 70%)" }}
          />
        </div>

        {/* Title bar */}
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/20 bg-card/50 relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-neon-red/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-neon-amber/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/60 ml-2">
              Titan Loterias — Dashboard IA
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
            <span className="text-[9px] font-mono text-primary/70">LIVE</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-5 grid grid-cols-12 gap-3 relative z-10">
          {/* Stats row */}
          <div className="col-span-12 grid grid-cols-4 gap-2.5">
            {[
              { label: "Sorteios", value: stats.sorteios, icon: BarChart3, color: "text-primary", bg: "bg-primary/10" },
              { label: "Padrões IA", value: stats.padroes, icon: Brain, color: "text-neon-blue", bg: "bg-neon-blue/10" },
              { label: "Win Rate", value: stats.winRate, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
              { label: "Score", value: stats.score, icon: Zap, color: "text-accent", bg: "bg-accent/10" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 + i * 0.1 }}
                className="rounded-lg border border-border/20 bg-card/40 p-2.5 text-center group hover:border-primary/20 transition-colors"
              >
                <div className={`w-6 h-6 rounded-md ${s.bg} flex items-center justify-center mx-auto mb-1.5`}>
                  <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={s.value}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm md:text-base font-bold font-mono text-foreground"
                  >
                    {s.value}
                  </motion.div>
                </AnimatePresence>
                <div className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Chart area + Line chart */}
          <div className="col-span-8 grid grid-rows-[1fr_auto] gap-3">
            {/* Bar chart */}
            <div className="rounded-lg border border-border/20 bg-card/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                  Frequência dos Números
                </div>
                <div className="flex gap-1">
                  {["1D", "7D", "30D"].map((label, idx) => (
                    <span
                      key={label}
                      className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                        idx === 2
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-[3px] h-20">
                {bars.map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.02 }}
                    className="flex-1 rounded-t-sm relative overflow-hidden"
                    style={{
                      background: `linear-gradient(to top, hsl(var(--primary) / 0.9), hsl(var(--primary) / 0.3))`,
                    }}
                  >
                    <motion.div
                      animate={{ opacity: [0, 0.4, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
                      className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Line chart (trend) */}
            <div className="rounded-lg border border-border/20 bg-card/20 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-neon-blue" />
                  Tendência
                </div>
                <motion.span
                  key={stats.winRate}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[9px] font-mono text-primary"
                >
                  +2.4%
                </motion.span>
              </div>
              <svg viewBox="0 0 260 100" className="w-full h-12" preserveAspectRatio="none">
                {/* Grid lines */}
                {[25, 50, 75].map(y => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="260"
                    y2={y}
                    stroke="hsl(var(--border) / 0.2)"
                    strokeWidth="0.5"
                  />
                ))}
                {/* Gradient area */}
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--neon-blue))" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="hsl(var(--neon-blue))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.path
                  key={`area-${cycle}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  d={`${linePath} L 262 100 L 10 100 Z`}
                  fill="url(#lineGrad)"
                />
                <motion.path
                  key={`line-${cycle}`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  d={linePath}
                  fill="none"
                  stroke="hsl(var(--neon-blue))"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Right panel */}
          <div className="col-span-4 flex flex-col gap-3">
            {/* Numbers panel */}
            <div className="rounded-lg border border-border/20 bg-card/20 p-3 flex-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                <Target className="w-3 h-3 text-primary" />
                Aposta Gerada
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <AnimatePresence mode="popLayout">
                  {numbers.map((n, i) => (
                    <motion.div
                      key={n}
                      initial={{ opacity: 0, scale: 0, rotateY: 90 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      exit={{ opacity: 0, scale: 0, rotateY: -90 }}
                      transition={{
                        delay: i * 0.08,
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-[11px] font-bold font-mono mx-auto relative"
                      style={{
                        boxShadow: "0 2px 10px hsl(var(--primary) / 0.3)",
                      }}
                    >
                      <motion.div
                        animate={{ opacity: [0, 0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        className="absolute inset-0 rounded-full"
                        style={{
                          boxShadow: "0 0 12px hsl(var(--primary) / 0.5)",
                        }}
                      />
                      {n.toString().padStart(2, "0")}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.4 }}
                className="mt-2.5 text-center"
              >
                <span className="text-[8px] font-mono text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                  Score: 94/100
                </span>
              </motion.div>
            </div>

            {/* AI confidence mini panel */}
            <div className="rounded-lg border border-border/20 bg-card/20 p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-accent" />
                Confiança IA
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "Padrão", pct: 87, color: "bg-primary" },
                  { label: "Neural", pct: 74, color: "bg-neon-blue" },
                  { label: "Genético", pct: 91, color: "bg-accent" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-[8px] text-muted-foreground font-mono w-10 shrink-0">
                      {item.label}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-border/20 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 1.5 }}
                        className={`h-full rounded-full ${item.color}`}
                      />
                    </div>
                    <span className="text-[8px] font-mono text-foreground/70 w-6 text-right">
                      {item.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom status bar */}
          <div className="col-span-12 rounded-lg border border-border/20 bg-card/30 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-3 h-3"
              >
                <Brain className="w-3 h-3 text-primary" />
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.span
                  key={statusMsg}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="text-[9px] font-mono text-muted-foreground"
                >
                  {statusMsg}{".".repeat(dots)}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[8px] font-mono text-muted-foreground/50">
                GPU: 24%
              </span>
              <span className="text-[8px] font-mono text-muted-foreground/50">
                RAM: 1.2GB
              </span>
              <span className="text-[8px] font-mono text-primary/70">
                ● Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
