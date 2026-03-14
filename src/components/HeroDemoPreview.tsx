import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Brain, TrendingUp, Zap, Activity, Sparkles,
  Target, Dices, PieChart, Cpu, LineChart, Settings,
  Home, Layers, History, Award, ChevronRight, Bell,
  Search, User, Grid3X3, Shield, CheckCircle2,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

// ── Screens ──
const screens = [
  { id: "dashboard", label: "Dashboard", icon: Home, color: "text-primary" },
  { id: "gerador", label: "Gerador IA", icon: Target, color: "text-neon-blue" },
  { id: "estatisticas", label: "Estatísticas", icon: BarChart3, color: "text-accent" },
  { id: "simulador", label: "Simulações", icon: Dices, color: "text-neon-purple" },
  { id: "ia", label: "IA Autônoma", icon: Brain, color: "text-primary" },
  { id: "fechamentos", label: "Fechamentos", icon: Grid3X3, color: "text-neon-cyan" },
];

const sidebarItems = [
  { icon: Home, label: "Dashboard" },
  { icon: BarChart3, label: "Estatísticas" },
  { icon: Target, label: "Gerador" },
  { icon: Dices, label: "Simulações" },
  { icon: Brain, label: "IA" },
  { icon: Layers, label: "Estratégias" },
  { icon: History, label: "Histórico" },
  { icon: Award, label: "Apostas" },
];

const statusMessages = [
  "Analisando padrões de frequência...",
  "Gerando combinações otimizadas...",
  "Modelo neural processando dados...",
  "Simulação Monte Carlo em progresso...",
  "Aprendizado autônomo ativo...",
];

function makePath(pts: number[], width = 260) {
  const step = width / (pts.length - 1);
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${100 - p}`).join(" ");
}

// ── Screen: Dashboard ──
function DashboardScreen() {
  const bars = [65, 42, 78, 35, 90, 55, 70, 48, 82, 60, 45, 73, 38, 85, 52, 62, 50, 88];
  const line = [20, 65, 40, 80, 55, 35, 70, 45, 85, 60, 72, 48];
  const path = makePath(line);
  return (
    <div className="space-y-2.5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
        {[
          { label: "Sorteios", val: "3.248", icon: BarChart3, c: "text-primary", bg: "bg-primary/10", delta: "+12" },
          { label: "Padrões IA", val: "152", icon: Brain, c: "text-neon-blue", bg: "bg-neon-blue/10", delta: "+8" },
          { label: "Win Rate", val: "71%", icon: TrendingUp, c: "text-primary", bg: "bg-primary/10", delta: "+3%" },
          { label: "Score", val: "A+", icon: Zap, c: "text-accent", bg: "bg-accent/10", delta: "Top 5%" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-lg border border-border/20 bg-card/40 p-2 text-center"
          >
            <div className={`w-5 h-5 rounded-md ${s.bg} flex items-center justify-center mx-auto mb-1`}>
              <s.icon className={`w-3 h-3 ${s.c}`} />
            </div>
            <div className="text-xs font-bold font-mono text-foreground">{s.val}</div>
            <div className="text-[6px] text-muted-foreground uppercase">{s.label}</div>
            <div className={`text-[6px] font-mono ${s.c} mt-0.5`}>{s.delta}</div>
          </motion.div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        <div className="sm:col-span-3 rounded-lg border border-border/20 bg-card/20 p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8px] text-muted-foreground uppercase font-mono">Frequência dos Números</span>
            <div className="flex gap-1">
              {["7D", "30D", "ALL"].map((l, i) => (
                <span key={l} className={`text-[7px] font-mono px-1 py-0.5 rounded ${i === 1 ? "bg-primary/20 text-primary" : "text-muted-foreground/40"}`}>{l}</span>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-[2px] h-16">
            {bars.map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.5, delay: i * 0.02 }}
                className="flex-1 rounded-t-sm relative overflow-hidden"
                style={{ background: `linear-gradient(to top, hsl(var(--primary) / 0.85), hsl(var(--primary) / 0.2))` }}
              />
            ))}
          </div>
        </div>
        <div className="sm:col-span-2 rounded-lg border border-border/20 bg-card/20 p-2.5">
          <div className="flex items-center gap-1 mb-1">
            <Activity className="w-2.5 h-2.5 text-neon-blue" />
            <span className="text-[8px] text-muted-foreground uppercase font-mono">Tendência</span>
            <span className="ml-auto text-[7px] font-mono text-primary">+2.4%</span>
          </div>
          <svg viewBox="0 0 260 100" className="w-full h-12" preserveAspectRatio="none">
            <defs>
              <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--neon-blue))" stopOpacity="0.25" />
                <stop offset="100%" stopColor="hsl(var(--neon-blue))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} d={`${path} L 260 100 L 0 100 Z`} fill="url(#dGrad)" />
            <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} d={path} fill="none" stroke="hsl(var(--neon-blue))" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      {/* Recent draws mini */}
      <div className="rounded-lg border border-border/20 bg-card/20 p-2.5">
        <span className="text-[8px] text-muted-foreground uppercase font-mono">Últimos Resultados</span>
        <div className="flex gap-2 sm:gap-3 mt-1.5 overflow-x-auto scrollbar-hide">
          {[
            { c: "3248", nums: [7, 13, 22, 34, 41, 58] },
            { c: "3247", nums: [3, 18, 25, 37, 44, 52] },
          ].map((draw) => (
            <div key={draw.c} className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <span className="text-[7px] font-mono text-muted-foreground/60">#{draw.c}</span>
              {draw.nums.map((n) => (
                <div key={n} className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-primary/20 flex items-center justify-center text-[5px] sm:text-[6px] font-mono text-primary font-bold">
                  {n.toString().padStart(2, "0")}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Screen: Gerador ──
function GeradorScreen() {
  const nums = [7, 13, 22, 34, 41, 58];
  return (
    <div className="space-y-2.5">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[8px] text-muted-foreground uppercase font-mono flex items-center gap-1">
            <Target className="w-2.5 h-2.5 text-primary" /> Mega-Sena — Aposta Otimizada
          </span>
          <span className="text-[7px] font-mono text-primary bg-primary/10 rounded px-1.5 py-0.5">Algoritmo Genético</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 py-1 flex-wrap">
          <AnimatePresence mode="popLayout">
            {nums.map((n, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, scale: 0, rotateY: 180 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 260, damping: 20 }}
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-[10px] sm:text-xs font-bold font-mono relative"
                style={{ boxShadow: "0 3px 15px hsl(var(--primary) / 0.35)" }}
              >
                <motion.div
                  animate={{ boxShadow: ["0 0 0px hsl(var(--primary)/0)", "0 0 15px hsl(var(--primary)/0.4)", "0 0 0px hsl(var(--primary)/0)"] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  className="absolute inset-0 rounded-full"
                />
                {n.toString().padStart(2, "0")}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="text-center mt-1.5">
          <span className="text-[8px] font-mono text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5">
            Score: 94/100 — Grau A+
          </span>
        </div>
      </div>
      {/* Confidence bars */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border/20 bg-card/20 p-2.5">
          <span className="text-[8px] text-muted-foreground uppercase font-mono flex items-center gap-1 mb-1.5">
            <Sparkles className="w-2.5 h-2.5 text-accent" /> Confiança por Modelo
          </span>
          {[
            { l: "Padrão", v: 87, c: "bg-primary" },
            { l: "Neural", v: 74, c: "bg-neon-blue" },
            { l: "Genético", v: 91, c: "bg-accent" },
            { l: "Monte Carlo", v: 82, c: "bg-neon-purple" },
          ].map((item) => (
            <div key={item.l} className="flex items-center gap-1.5 mb-1">
              <span className="text-[6px] text-muted-foreground font-mono w-12">{item.l}</span>
              <div className="flex-1 h-1.5 rounded-full bg-border/20 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${item.v}%` }} transition={{ duration: 1 }} className={`h-full rounded-full ${item.c}`} />
              </div>
              <span className="text-[6px] font-mono text-foreground/60 w-5 text-right">{item.v}%</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border/20 bg-card/20 p-2.5">
          <span className="text-[8px] text-muted-foreground uppercase font-mono mb-1.5 block">Métricas da Aposta</span>
          {[
            { l: "Soma", v: "174" },
            { l: "Paridade", v: "3P/3I" },
            { l: "Consecutivos", v: "0" },
            { l: "Faixas", v: "6/6" },
          ].map((m) => (
            <div key={m.l} className="flex justify-between mb-0.5">
              <span className="text-[6px] text-muted-foreground font-mono">{m.l}</span>
              <span className="text-[6px] font-mono text-foreground font-semibold">{m.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Screen: Estatísticas ──
function EstatisticasScreen() {
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {/* Heatmap */}
        <div className="sm:col-span-3 rounded-lg border border-border/20 bg-card/20 p-2.5">
          <span className="text-[8px] text-muted-foreground uppercase font-mono flex items-center gap-1 mb-1.5">
            <PieChart className="w-2.5 h-2.5 text-accent" /> Mapa de Calor
          </span>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-[1.5px]">
            {Array.from({ length: 60 }, (_, i) => {
              const heat = [0.75, 0.3, 0.6, 0.15, 0.9, 0.45, 0.55, 0.2, 0.8, 0.35, 0.65, 0.5, 0.25, 0.85, 0.4, 0.7, 0.1, 0.95, 0.38, 0.62, 0.48, 0.72, 0.28, 0.58, 0.42, 0.88, 0.18, 0.78, 0.32, 0.68, 0.52, 0.22, 0.82, 0.36, 0.66, 0.46, 0.76, 0.12, 0.92, 0.34, 0.64, 0.44, 0.74, 0.24, 0.84, 0.38, 0.56, 0.16, 0.86, 0.3, 0.7, 0.5, 0.2, 0.8, 0.4, 0.6, 0.1, 0.9, 0.35, 0.65][i];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className="aspect-square rounded-[2px] flex items-center justify-center text-[5px] font-mono"
                  style={{
                    background: `hsl(var(--primary) / ${heat * 0.7 + 0.05})`,
                    color: heat > 0.5 ? "hsl(var(--primary-foreground) / 0.8)" : "hsl(var(--foreground) / 0.5)",
                  }}
                >
                  {(i + 1).toString().padStart(2, "0")}
                </motion.div>
              );
            })}
          </div>
        </div>
        {/* Distribution + delay */}
        <div className="sm:col-span-2 space-y-2">
          <div className="rounded-lg border border-border/20 bg-card/20 p-2.5">
            <span className="text-[8px] text-muted-foreground uppercase font-mono flex items-center gap-1 mb-1.5">
              <LineChart className="w-2.5 h-2.5 text-neon-cyan" /> Distribuição
            </span>
            {[
              { r: "01-10", p: 72 }, { r: "11-20", p: 85 }, { r: "21-30", p: 64 },
              { r: "31-40", p: 78 }, { r: "41-50", p: 55 }, { r: "51-60", p: 43 },
            ].map((item) => (
              <div key={item.r} className="flex items-center gap-1 mb-0.5">
                <span className="text-[6px] text-muted-foreground font-mono w-6">{item.r}</span>
                <div className="flex-1 h-1.5 rounded-full bg-border/20 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.p}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: "linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--primary)))" }} />
                </div>
                <span className="text-[6px] font-mono text-foreground/60 w-5 text-right">{item.p}%</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border/20 bg-card/20 p-2.5">
            <span className="text-[8px] text-muted-foreground uppercase font-mono mb-1 block">Top Atrasados</span>
            {[{ n: "07", d: 12 }, { n: "34", d: 10 }, { n: "51", d: 8 }].map((item) => (
              <div key={item.n} className="flex items-center justify-between mb-0.5">
                <div className="w-4 h-4 rounded-full bg-neon-red/20 flex items-center justify-center text-[5px] font-mono text-neon-red font-bold">{item.n}</div>
                <span className="text-[6px] font-mono text-muted-foreground">{item.d} sorteios</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Screen: Simulador ──
function SimuladorScreen() {
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
        {[
          { l: "Jogos", v: "1.000.000", c: "text-foreground", bg: "bg-muted/30" },
          { l: "Sena (6/6)", v: "0", c: "text-neon-red", bg: "bg-neon-red/10" },
          { l: "Quina (5/6)", v: "47", c: "text-accent", bg: "bg-accent/10" },
          { l: "Quadra (4/6)", v: "5.124", c: "text-primary", bg: "bg-primary/10" },
        ].map((s, i) => (
          <motion.div key={s.l} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} className={`rounded-lg border border-border/20 ${s.bg} p-2 text-center`}>
            <div className={`text-sm font-bold font-mono ${s.c}`}>{s.v}</div>
            <div className="text-[6px] text-muted-foreground uppercase">{s.l}</div>
          </motion.div>
        ))}
      </div>
      <div className="rounded-lg border border-border/20 bg-card/20 p-2.5">
        <span className="text-[8px] text-muted-foreground uppercase font-mono mb-1.5 block">Distribuição de Acertos</span>
        {[
          { l: "Terno (3/6)", v: "89.746", p: 85 },
          { l: "Duque (2/6)", v: "423.891", p: 100 },
          { l: "Unidade (1/6)", v: "812.345", p: 100 },
        ].map((item) => (
          <div key={item.l} className="flex items-center gap-2 mb-1">
            <span className="text-[6px] text-muted-foreground font-mono w-14 shrink-0">{item.l}</span>
            <div className="flex-1 h-2 rounded-full bg-border/20 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${item.p}%` }} transition={{ duration: 1.2 }} className="h-full rounded-full bg-neon-purple" />
            </div>
            <span className="text-[6px] font-mono text-foreground/70 w-12 text-right">{item.v}</span>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-neon-purple/20 bg-neon-purple/5 p-2 text-center">
        <span className="text-[7px] font-mono text-neon-purple">ROI estimado: -R$ 1.247.350 em 1M de jogos · Probabilidade Sena: 1 em 50.063.860</span>
      </div>
    </div>
  );
}

// ── Screen: IA Autônoma ──
function IAScreen() {
  return (
    <div className="space-y-2.5">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
        <div className="flex items-center gap-2 mb-1.5">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
            <Brain className="w-4 h-4 text-primary" />
          </motion.div>
          <span className="text-[9px] font-mono text-primary uppercase tracking-wider">Análise Autônoma em Tempo Real</span>
        </div>
        <div className="text-[9px] text-foreground/80 leading-relaxed">
          O modelo identificou <span className="text-primary font-semibold">3 padrões recorrentes</span> nos últimos 50 sorteios da Mega-Sena.
          Números quentes: <span className="font-mono text-primary">07, 13, 34</span>. Tendência de soma entre <span className="font-mono text-accent">140-180</span>.
          Recomendação: priorizar faixa 21-40 com paridade equilibrada.
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
        {[
          { l: "Precisão", v: "78%", c: "text-primary" },
          { l: "Modelos", v: "5", c: "text-neon-blue" },
          { l: "Padrões", v: "12", c: "text-accent" },
          { l: "Confiança", v: "Alto", c: "text-primary" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-border/20 bg-card/30 p-2 text-center">
            <div className={`text-xs font-bold font-mono ${s.c}`}>{s.v}</div>
            <div className="text-[6px] text-muted-foreground uppercase">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border/20 bg-card/20 p-2.5">
        <span className="text-[8px] text-muted-foreground uppercase font-mono mb-1 block">Aprendizado Contínuo</span>
        <div className="grid grid-cols-3 gap-1.5">
          {["Frequência", "Consecutivos", "Soma", "Paridade", "Atraso", "Faixas"].map((tag) => (
            <motion.div key={tag} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }} className="text-[6px] font-mono text-primary/70 bg-primary/5 border border-primary/10 rounded px-1.5 py-0.5 text-center">
              {tag}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ──
export function HeroDemoPreview() {
  const [activeScreen, setActiveScreen] = useState(0);
  const [dots, setDots] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const resetInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveScreen((s) => (s + 1) % screens.length);
    }, 4500);
  }, []);

  useEffect(() => {
    resetInterval();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [resetInterval]);

  useEffect(() => {
    const d = setInterval(() => setDots((v) => (v % 3) + 1), 500);
    return () => clearInterval(d);
  }, []);

  const handleTabClick = useCallback((idx: number) => {
    setActiveScreen(idx);
    resetInterval();
  }, [resetInterval]);

  const statusMsg = statusMessages[activeScreen % statusMessages.length];
  const activeScreenData = screens[activeScreen];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
      className="mt-6 sm:mt-12 mx-auto max-w-5xl px-2 sm:px-0"
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
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.15, 1] }}
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
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 rounded-md border border-border/20 bg-card/30 px-2 py-0.5">
              <Search className="w-2.5 h-2.5 text-muted-foreground/40" />
              <span className="text-[8px] font-mono text-muted-foreground/40">Buscar...</span>
            </div>
            <Bell className="w-3 h-3 text-muted-foreground/40 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[9px] font-mono text-primary/70">LIVE</span>
            </div>
          </div>
        </div>

        {/* Body with sidebar */}
        <div className="flex relative z-10">
          {/* Sidebar */}
          <div className="hidden md:flex flex-col w-[52px] border-r border-border/10 bg-card/30 py-2 shrink-0">
            {sidebarItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = idx === activeScreen || (idx === 0 && activeScreen === 0) || (idx === 1 && activeScreen === 2) || (idx === 2 && activeScreen === 1) || (idx === 3 && activeScreen === 3) || (idx === 4 && activeScreen === 4);
              return (
                <div
                  key={item.label}
                  className={`flex flex-col items-center py-1.5 px-1 cursor-default transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground/30"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[5px] mt-0.5 font-mono">{item.label}</span>
                </div>
              );
            })}
            <div className="mt-auto flex flex-col items-center py-1.5 text-muted-foreground/30">
              <Settings className="w-3.5 h-3.5" />
              <span className="text-[5px] mt-0.5 font-mono">Config</span>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumb + page title */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/10">
              <div className="flex items-center gap-1">
                <Home className="w-2.5 h-2.5 text-muted-foreground/40" />
                <ChevronRight className="w-2 h-2 text-muted-foreground/20" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeScreenData.label}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    className={`text-[9px] font-mono font-semibold ${activeScreenData.color}`}
                  >
                    {activeScreenData.label}
                  </motion.span>
                </AnimatePresence>
              </div>
              {/* Tabs */}
              <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
                {screens.map((screen, idx) => {
                  const Icon = screen.icon;
                  const isActive = idx === activeScreen;
                  return (
                    <button
                      key={screen.id}
                      onClick={() => handleTabClick(idx)}
                      className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 text-[6px] sm:text-[7px] font-mono uppercase tracking-wider rounded transition-colors shrink-0 ${
                        isActive
                          ? `${screen.color} bg-card/60 border border-border/20`
                          : "text-muted-foreground/30 hover:text-muted-foreground/60"
                      }`}
                    >
                      <Icon className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                      <span className="hidden sm:inline">{screen.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Screen content */}
            <div className="p-2 sm:p-3 min-h-[180px] sm:min-h-[200px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeScreen}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  {activeScreen === 0 && <DashboardScreen />}
                  {activeScreen === 1 && <GeradorScreen />}
                  {activeScreen === 2 && <EstatisticasScreen />}
                  {activeScreen === 3 && <SimuladorScreen />}
                  {activeScreen === 4 && <IAScreen />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="px-2 sm:px-3 py-1.5 border-t border-border/10 bg-card/30 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-3 h-3 shrink-0">
              <Cpu className="w-3 h-3 text-primary" />
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.span key={statusMsg} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="text-[7px] sm:text-[8px] font-mono text-muted-foreground truncate">
                {statusMsg}{".".repeat(dots)}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Progress dots */}
            <div className="flex gap-0.5 sm:gap-1">
              {screens.map((_, idx) => (
                <div key={idx} className="w-3 sm:w-5 h-[2px] rounded-full bg-border/30 overflow-hidden">
                  {idx === activeScreen && (
                    <motion.div
                      key={`prog-${activeScreen}`}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 4.5, ease: "linear" }}
                      className="h-full bg-primary/60 rounded-full"
                    />
                  )}
                </div>
              ))}
            </div>
            <span className="text-[7px] font-mono text-muted-foreground/40 hidden sm:inline">GPU: 24%</span>
            <span className="text-[7px] font-mono text-muted-foreground/40 hidden sm:inline">RAM: 1.2GB</span>
            <span className="text-[7px] font-mono text-primary/70">● Online</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
