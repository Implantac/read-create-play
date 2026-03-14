import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Brain, TrendingUp, Zap, Activity, Sparkles,
  Target, Dices, Shield, PieChart, Cpu, LineChart,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

// ── Screen data ──
const screens = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "gerador", label: "Gerador IA", icon: Target },
  { id: "estatisticas", label: "Estatísticas", icon: PieChart },
  { id: "simulador", label: "Simulador", icon: Dices },
];

const barSets = [
  [65, 42, 78, 35, 90, 55, 70, 48, 82, 60, 45, 73, 38, 85, 52],
  [50, 70, 60, 80, 45, 75, 55, 90, 40, 68, 58, 82, 47, 63, 72],
  [82, 55, 43, 70, 62, 88, 38, 65, 75, 50, 90, 42, 68, 48, 60],
];
const numberSets = [
  [7, 13, 22, 34, 41, 58],
  [3, 18, 25, 37, 44, 52],
  [9, 15, 28, 33, 46, 55],
];
const linePoints = [
  [20, 65, 40, 80, 55, 35, 70, 45, 85, 60],
  [45, 30, 70, 50, 85, 40, 60, 75, 35, 55],
  [60, 75, 35, 55, 45, 80, 50, 30, 70, 65],
];
const statusMessages = [
  "Analisando padrões de frequência...",
  "Otimizando combinações via Monte Carlo...",
  "Modelo neural processando dados...",
  "Validando com backtesting histórico...",
];

function makePath(pts: number[]) {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${i * 28 + 10} ${100 - p}`).join(" ");
}

// ── Sub-screens ──
function DashboardScreen({ cycle }: { cycle: number }) {
  const bars = barSets[cycle % barSets.length];
  const pts = linePoints[cycle % linePoints.length];
  const path = makePath(pts);
  return (
    <div className="grid grid-cols-12 gap-2.5">
      {/* Mini stats */}
      <div className="col-span-12 grid grid-cols-4 gap-2">
        {[
          { label: "Sorteios", val: "3.248", icon: BarChart3, c: "text-primary", bg: "bg-primary/10" },
          { label: "Padrões", val: "152", icon: Brain, c: "text-neon-blue", bg: "bg-neon-blue/10" },
          { label: "Win Rate", val: "71%", icon: TrendingUp, c: "text-primary", bg: "bg-primary/10" },
          { label: "Score", val: "A+", icon: Zap, c: "text-accent", bg: "bg-accent/10" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border/20 bg-card/40 p-2 text-center">
            <div className={`w-5 h-5 rounded-md ${s.bg} flex items-center justify-center mx-auto mb-1`}>
              <s.icon className={`w-3 h-3 ${s.c}`} />
            </div>
            <div className="text-xs font-bold font-mono text-foreground">{s.val}</div>
            <div className="text-[7px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
      {/* Bar chart */}
      <div className="col-span-7 rounded-lg border border-border/20 bg-card/20 p-2.5">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono mb-1.5">Frequência</div>
        <div className="flex items-end gap-[2px] h-16">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.5, delay: i * 0.02 }}
              className="flex-1 rounded-t-sm"
              style={{ background: `linear-gradient(to top, hsl(var(--primary) / 0.85), hsl(var(--primary) / 0.25))` }}
            />
          ))}
        </div>
      </div>
      {/* Line chart */}
      <div className="col-span-5 rounded-lg border border-border/20 bg-card/20 p-2.5">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono mb-1 flex items-center gap-1">
          <Activity className="w-2.5 h-2.5 text-neon-blue" /> Tendência
        </div>
        <svg viewBox="0 0 260 100" className="w-full h-14" preserveAspectRatio="none">
          <defs>
            <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--neon-blue))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--neon-blue))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path key={`a${cycle}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} d={`${path} L 262 100 L 10 100 Z`} fill="url(#aGrad)" />
          <motion.path key={`l${cycle}`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} d={path} fill="none" stroke="hsl(var(--neon-blue))" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function GeradorScreen({ cycle }: { cycle: number }) {
  const nums = numberSets[cycle % numberSets.length];
  return (
    <div className="grid grid-cols-12 gap-2.5">
      {/* Numbers */}
      <div className="col-span-7 rounded-lg border border-border/20 bg-card/20 p-3">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono mb-2 flex items-center gap-1">
          <Target className="w-2.5 h-2.5 text-primary" /> Aposta Gerada — Mega-Sena
        </div>
        <div className="flex items-center justify-center gap-2 py-2">
          <AnimatePresence mode="popLayout">
            {nums.map((n, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, scale: 0, rotateY: 90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
                className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-xs font-bold font-mono shadow-md"
                style={{ boxShadow: "0 2px 12px hsl(var(--primary) / 0.35)" }}
              >
                {n.toString().padStart(2, "0")}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="text-center mt-1">
          <span className="text-[8px] font-mono text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
            Score: 94/100 — Grau A+
          </span>
        </div>
      </div>
      {/* Confidence */}
      <div className="col-span-5 rounded-lg border border-border/20 bg-card/20 p-3 flex flex-col justify-between">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono mb-2 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-accent" /> Confiança IA
        </div>
        <div className="space-y-2">
          {[
            { label: "Padrão", pct: 87, c: "bg-primary" },
            { label: "Neural", pct: 74, c: "bg-neon-blue" },
            { label: "Genético", pct: 91, c: "bg-accent" },
            { label: "Monte Carlo", pct: 82, c: "bg-neon-purple" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className="text-[7px] text-muted-foreground font-mono w-14 shrink-0">{item.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-border/20 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 1, delay: 0.5 }} className={`h-full rounded-full ${item.c}`} />
              </div>
              <span className="text-[7px] font-mono text-foreground/70 w-5 text-right">{item.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EstatisticasScreen({ cycle }: { cycle: number }) {
  const heatData = [
    [8, 5, 9, 3, 7, 6, 4, 8, 2, 9],
    [3, 7, 4, 8, 5, 9, 6, 3, 7, 4],
    [6, 2, 8, 5, 9, 3, 7, 4, 8, 6],
    [9, 4, 3, 7, 2, 8, 5, 9, 3, 7],
    [4, 8, 6, 2, 8, 5, 9, 6, 4, 3],
  ];
  return (
    <div className="grid grid-cols-12 gap-2.5">
      {/* Heatmap */}
      <div className="col-span-7 rounded-lg border border-border/20 bg-card/20 p-2.5">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono mb-2 flex items-center gap-1">
          <PieChart className="w-2.5 h-2.5 text-neon-amber" /> Mapa de Calor — Frequência
        </div>
        <div className="grid gap-[2px]">
          {heatData.map((row, ri) => (
            <div key={ri} className="flex gap-[2px]">
              {row.map((val, ci) => (
                <motion.div
                  key={ci}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: ri * 0.05 + ci * 0.03 }}
                  className="flex-1 h-4 rounded-sm flex items-center justify-center text-[6px] font-mono text-foreground/70"
                  style={{
                    background: `hsl(var(--primary) / ${val / 12})`,
                  }}
                >
                  {(ri * 10 + ci + 1).toString().padStart(2, "0")}
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Distribution */}
      <div className="col-span-5 rounded-lg border border-border/20 bg-card/20 p-2.5">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono mb-2 flex items-center gap-1">
          <LineChart className="w-2.5 h-2.5 text-neon-cyan" /> Distribuição
        </div>
        <div className="space-y-1.5">
          {[
            { range: "01-10", pct: 72 },
            { range: "11-20", pct: 85 },
            { range: "21-30", pct: 64 },
            { range: "31-40", pct: 78 },
            { range: "41-50", pct: 55 },
            { range: "51-60", pct: 43 },
          ].map((item) => (
            <div key={item.range} className="flex items-center gap-1.5">
              <span className="text-[7px] text-muted-foreground font-mono w-8 shrink-0">{item.range}</span>
              <div className="flex-1 h-2 rounded-full bg-border/20 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--primary)))` }}
                />
              </div>
              <span className="text-[7px] font-mono text-foreground/70 w-5 text-right">{item.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SimuladorScreen() {
  return (
    <div className="grid grid-cols-12 gap-2.5">
      <div className="col-span-12 rounded-lg border border-border/20 bg-card/20 p-3">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono mb-2 flex items-center gap-1">
          <Dices className="w-2.5 h-2.5 text-neon-purple" /> Simulação Massiva — 1.000.000 jogos
        </div>
        <div className="grid grid-cols-3 gap-2.5 mb-3">
          {[
            { label: "Jogos", val: "1.000.000", c: "text-foreground" },
            { label: "Acertos 6/6", val: "0", c: "text-neon-red" },
            { label: "Acertos 5/6", val: "47", c: "text-accent" },
          ].map((s) => (
            <div key={s.label} className="rounded-md border border-border/20 bg-card/30 p-2 text-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-sm font-bold font-mono ${s.c}`}>{s.val}</motion.div>
              <div className="text-[7px] text-muted-foreground uppercase">{s.label}</div>
            </div>
          ))}
        </div>
        {/* Simulated progress */}
        <div className="space-y-1.5">
          {[
            { label: "Quadra (4/6)", pct: 98, val: "5.124" },
            { label: "Terno (3/6)", pct: 100, val: "89.746" },
            { label: "Duque (2/6)", pct: 100, val: "423.891" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-[7px] text-muted-foreground font-mono w-14 shrink-0">{item.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-border/20 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full rounded-full bg-neon-purple"
                />
              </div>
              <span className="text-[7px] font-mono text-foreground/70 w-10 text-right">{item.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ──
export function HeroDemoPreview() {
  const [activeScreen, setActiveScreen] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreen((s) => (s + 1) % screens.length);
      setCycle((c) => c + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const d = setInterval(() => setDots((v) => (v % 3) + 1), 500);
    return () => clearInterval(d);
  }, []);

  const statusMsg = statusMessages[activeScreen % statusMessages.length];

  const handleTabClick = useCallback((idx: number) => {
    setActiveScreen(idx);
    setCycle((c) => c + 1);
  }, []);

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
          boxShadow: "0 0 40px hsl(var(--primary) / 0.12), 0 0 80px hsl(var(--primary) / 0.06), 0 25px 60px hsl(var(--primary) / 0.1)",
        }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/2 -right-1/4 w-96 h-96 rounded-full"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.08), transparent 70%)" }}
          />
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1.1, 1, 1.1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-1/3 -left-1/4 w-80 h-80 rounded-full"
            style={{ background: "radial-gradient(circle, hsl(var(--neon-blue) / 0.06), transparent 70%)" }}
          />
        </div>

        {/* Title bar */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border/20 bg-card/50 relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-neon-red/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-neon-amber/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/60 ml-2">Titan Loterias</span>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[9px] font-mono text-primary/70">LIVE</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 px-3 pt-2 pb-0 relative z-10 border-b border-border/10">
          {screens.map((screen, idx) => {
            const Icon = screen.icon;
            const isActive = idx === activeScreen;
            return (
              <button
                key={screen.id}
                onClick={() => handleTabClick(idx)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider transition-colors rounded-t-md ${
                  isActive
                    ? "text-primary bg-card/40 border border-border/20 border-b-transparent -mb-px"
                    : "text-muted-foreground/50 hover:text-muted-foreground"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{screen.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
          {/* Auto-progress indicator */}
          <div className="ml-auto flex items-center gap-1.5">
            {screens.map((_, idx) => (
              <div key={idx} className="w-4 h-[2px] rounded-full bg-border/30 overflow-hidden">
                {idx === activeScreen && (
                  <motion.div
                    key={`prog-${activeScreen}-${cycle}`}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4, ease: "linear" }}
                    className="h-full bg-primary/60 rounded-full"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Screen content */}
        <div className="p-3 md:p-4 relative z-10 min-h-[180px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeScreen === 0 && <DashboardScreen cycle={cycle} />}
              {activeScreen === 1 && <GeradorScreen cycle={cycle} />}
              {activeScreen === 2 && <EstatisticasScreen cycle={cycle} />}
              {activeScreen === 3 && <SimuladorScreen />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom status bar */}
        <div className="px-3 py-1.5 border-t border-border/10 bg-card/30 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-3 h-3">
              <Cpu className="w-3 h-3 text-primary" />
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.span key={statusMsg} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="text-[8px] font-mono text-muted-foreground">
                {statusMsg}{".".repeat(dots)}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[7px] font-mono text-muted-foreground/50">GPU: 24%</span>
            <span className="text-[7px] font-mono text-muted-foreground/50">RAM: 1.2GB</span>
            <span className="text-[7px] font-mono text-primary/70">● Online</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
