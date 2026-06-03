import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

import { LotteryLogosCarousel } from "@/components/LotteryLogosCarousel";
import { ScreensShowcase } from "@/components/ScreensShowcase";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { FloatingCTA } from "@/components/FloatingCTA";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SocialProofBar } from "@/components/SocialProofBar";
import { FloatingLotteryBalls } from "@/components/FloatingLotteryBalls";
import { burstConfetti } from "@/lib/confetti";
import {
  Zap,
  BarChart3,
  Brain,
  Shield,
  TrendingUp,
  Target,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Dices,
  HelpCircle,
  Star,
  CheckCircle,
  Users,
  Database,
  Quote,
  Activity,
  Terminal,
  History,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: BarChart3,
    title: "Intelligence Hub",
    description: "Frequência, atraso, paridade, soma e distribuição por faixa de todos os sorteios históricos.",
    color: "green" as const,
  },
  {
    icon: Brain,
    title: "Inteligência Artificial",
    description: "Modelos de ML e redes neurais que identificam padrões ocultos nos resultados.",
    color: "blue" as const,
  },
  {
    icon: Target,
    title: "Otimizador Combinatorial",
    description: "Gere apostas otimizadas com algoritmos genéticos, simulated annealing e Monte Carlo.",
    color: "amber" as const,
  },
  {
    icon: TrendingUp,
    title: "Backtesting",
    description: "Teste suas estratégias contra todo o histórico e veja a performance real.",
    color: "red" as const,
  },
  {
    icon: Dices,
    title: "Monte Carlo Engine",
    description: "Simule milhões de jogos em segundos e descubra probabilidades reais.",
    color: "purple" as const,
  },
  {
    icon: Shield,
    title: "Banco de Dados Completo",
    description: "Todos os sorteios da Caixa sincronizados automaticamente em tempo real.",
    color: "cyan" as const,
  },
];

const colorMap = {
  green: "from-primary/20 to-primary/5 border-primary/20 text-primary",
  blue: "from-neon-blue/20 to-neon-blue/5 border-neon-blue/20 text-neon-blue",
  amber: "from-accent/20 to-accent/5 border-accent/20 text-accent",
  red: "from-neon-red/20 to-neon-red/5 border-neon-red/20 text-neon-red",
  purple: "from-neon-purple/20 to-neon-purple/5 border-neon-purple/20 text-neon-purple",
  cyan: "from-neon-cyan/20 to-neon-cyan/5 border-neon-cyan/20 text-neon-cyan",
};

const lotteries = ["Mega-Sena", "Lotofácil", "Quina", "Lotomania", "Dupla Sena", "Timemania", "Dia de Sorte", "Super Sete"];

const stats = [
  { value: "10.000+", label: "Sorteios analisados" },
  { value: "8", label: "Loterias suportadas" },
  { value: "14+", label: "Algoritmos de IA" },
  { value: "99.9%", label: "Uptime" },
];

const LAUNCH_PRICE = "R$ 297";
const LAUNCH_ORIGINAL = "R$ 997";
const LAUNCH_SPOTS = 100;

const lifetimePlan = {
  name: "Acesso Vitalício",
  price: LAUNCH_PRICE,
  originalPrice: LAUNCH_ORIGINAL,
  period: " pagamento único",
  features: [
    "Acesso vitalício a todas as funcionalidades",
    "Todas as 8 loterias suportadas",
    "IA, Machine Learning e Motor HP exclusivo",
    "Gerador profissional + Otimizador combinatorial",
    "Backtesting e simulação massiva ilimitados",
    "Todas as atualizações futuras incluídas",
    "Suporte prioritário VIP",
    "Sem mensalidades — pague uma vez e use para sempre",
  ],
  cta: "Garantir Acesso Vitalício",
};

export default function LandingPage() {
  const navigate = useNavigate();
  
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const handleCtaClick = useCallback((e: React.MouseEvent, to: string) => {
    e.preventDefault();
    burstConfetti(e);
    setTimeout(() => navigate(to), 500);
  }, [navigate]);

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const { scrollYProgress: featuresProgress } = useScroll({
    target: featuresRef,
    offset: ["start end", "end start"],
  });
  const { scrollYProgress: ctaProgress } = useScroll({
    target: ctaRef,
    offset: ["start end", "end start"],
  });

  const heroY = useTransform(heroProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(heroProgress, [0, 0.6], [1, 0]);
  const heroScale = useTransform(heroProgress, [0, 0.6], [1, 0.92]);
  const gridY = useTransform(heroProgress, [0, 1], [0, 80]);
  const featuresRotateX = useTransform(featuresProgress, [0, 0.5], [4, 0]);
  const { scrollYProgress: faqProgress } = useScroll({
    target: faqRef,
    offset: ["start end", "end start"],
  });
  const faqY = useTransform(faqProgress, [0, 1], [60, -30]);
  const faqRotateX = useTransform(faqProgress, [0, 0.4, 0.6], [6, 0, -2]);
  const faqScale = useTransform(faqProgress, [0, 0.4], [0.92, 1]);

  const ctaScale = useTransform(ctaProgress, [0, 0.5], [0.85, 1]);
  const ctaOpacity = useTransform(ctaProgress, [0, 0.4], [0, 1]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <FloatingCTA />
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-border/30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-110 transition-all duration-300 overflow-hidden">
              <img src="/logo.png" alt="Titan Loterias" className="w-10 h-10 object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Titan <span className="text-primary text-glow-green">Loterias</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/signup">
              <Button variant="ghost" size="sm" className="text-neon-amber hover:text-neon-amber/80 font-semibold">
                Acesso Vitalício
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Entrar
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gradient-brand text-primary-foreground shadow-lg shadow-primary/20 gap-1.5">
                Criar Conta <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative pt-32 pb-20 md:pt-44 md:pb-32 gradient-mesh overflow-hidden">
        {/* Floating lottery balls */}
        <FloatingLotteryBalls />
        {/* Grid pattern with parallax */}
        <motion.div className="absolute inset-0 opacity-[0.03]" style={{
          y: gridY,
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Floating orbs with parallax */}
        <motion.div
          className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-primary/5 blur-[100px]"
          style={{ y: useTransform(heroProgress, [0, 1], [0, 200]) }}
        />
        <motion.div
          className="absolute bottom-10 right-[15%] w-96 h-96 rounded-full bg-neon-purple/5 blur-[120px]"
          style={{ y: useTransform(heroProgress, [0, 1], [0, -100]) }}
        />

        <motion.div className="container mx-auto px-4 relative" style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}>
          <motion.div
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <motion.div custom={0} variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Motor Estatístico v4.0 + IA
            </motion.div>

            <motion.h1 custom={1} variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Inteligência de Dados{" "}
              <span className="gradient-brand-text">aplicada a loterias</span>
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              O Terminal de Inteligência mais avançado do país para análise de padrões, modelos de ML e otimização de matrizes estatísticas.
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <motion.div
                  whileHover={{ scale: 1.06, boxShadow: "0 0 30px hsl(var(--primary) / 0.5)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="rounded-md"
                >
                  <Button size="lg" onClick={(e) => handleCtaClick(e, "/signup")} className="gradient-brand text-primary-foreground shadow-xl shadow-primary/25 gap-2 text-base px-8 h-12 w-full">
                    Começar Grátis <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              <Link to="/login">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12 border-border/50 hover:border-primary/30 hover:text-primary">
                  Já tenho conta
                </Button>
              </Link>
            </motion.div>

            {/* Supported lotteries */}
            <motion.div custom={4} variants={fadeUp} className="pt-8 flex flex-wrap items-center justify-center gap-2">
              {lotteries.map((name) => (
                <span key={name} className="px-3 py-1 rounded-full bg-muted/50 border border-border/30 text-xs font-medium text-muted-foreground">
                  {name}
                </span>
              ))}
            </motion.div>

          </motion.div>
        </motion.div>
      </section>

      {/* Lotteries carousel */}
      <LotteryLogosCarousel />

      {/* Social proof badges */}
      <SocialProofBar />

      {/* Stats bar */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="border-y border-border/30 bg-card/30 backdrop-blur-lg"
      >
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <AnimatedCounter key={s.label} value={s.value} label={s.label} index={i} />
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <section ref={featuresRef} className="py-20 md:py-28" style={{ perspective: "1200px" }}>
        <motion.div style={{ rotateX: featuresRotateX }} className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Tudo que você precisa para{" "}
              <span className="gradient-brand-text">jogar melhor</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ferramentas profissionais de análise e geração de apostas, alimentadas por dados reais e inteligência artificial.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                className={`rounded-xl bg-gradient-to-b ${colorMap[f.color]} border p-6 transition-shadow duration-300 hover:shadow-lg`}
              >
                <f.icon className="w-8 h-8 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Screens showcase carousel */}
      <ScreensShowcase />

      {/* How it works */}
      <section className="py-20 md:py-28 bg-card/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Como funciona
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Em 3 passos simples, comece a usar o poder da análise estatística.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", icon: Database, title: "Data Ingestion", desc: "Integração via API com sincronização atômica de todos os sorteios históricos." },
              { step: "02", icon: Brain, title: "Neural Analysis", desc: "Modelos proprietários identificam anomalias estatísticas e padrões de retenção." },
              { step: "03", icon: Target, title: "Optimal Outputs", desc: "Entrega de matrizes otimizadas baseadas em filtros de alta probabilidade real." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center space-y-4"
              >
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 rounded-2xl gradient-brand opacity-20" />
                  <div className="relative w-full h-full rounded-2xl border border-primary/20 flex items-center justify-center">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 rounded-full w-6 h-6 flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Terminal Preview Section */}
      <section className="py-20 md:py-28 overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl border border-white/10 p-4 md:p-8 bg-black/60 shadow-2xl relative"
          >
            <div className="absolute -top-3 left-10 flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg shadow-primary/40">
              <Activity className="w-3 h-3" /> Live Technical Data
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tighter">Performance de nível Bloomberg</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                    Monitore indicadores técnicos em tempo real, calculados em nanossegundos por nossa engine proprietária. Identifique anomalias estatísticas antes que elas aconteçam.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "VIX-L Volatility", value: "14.22", trend: "up", color: "text-primary" },
                    { label: "Momentum IA", value: "84.5", trend: "up", color: "text-primary" },
                    { label: "Entropy Index", value: "0.42", trend: "down", color: "text-destructive" },
                    { label: "Signal Strength", value: "92%", trend: "up", color: "text-accent" },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">{stat.label}</p>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xl font-mono font-bold ${stat.color}`}>{stat.value}</span>
                        <span className={`text-[10px] ${stat.trend === 'up' ? 'text-primary' : 'text-destructive'}`}>
                          {stat.trend === 'up' ? '↑' : '↓'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-black/80 rounded-xl border border-white/5 p-4 font-mono text-[10px] space-y-2 overflow-hidden relative">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                  <span className="text-primary font-bold">TITAN_OS_TERMINAL</span>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-destructive/50" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                    <div className="w-2 h-2 rounded-full bg-primary/50" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-primary/70">{`> initializing quantum_core...`}</p>
                  <p className="text-muted-foreground">{`> status: nominal`}</p>
                  <p className="text-muted-foreground">{`> loading historical_matrix[mega_sena]`}</p>
                  <p className="text-emerald-500">{`> matrix_sync: complete [2,842 nodes]`}</p>
                  <p className="text-primary/70">{`> executing monte_carlo_sim(1m)`}</p>
                  <p className="text-muted-foreground">{`> signal: 0.8422 correlation detected`}</p>
                  <p className="text-accent animate-pulse">{`> alert: hot_streak pattern detected`}</p>
                  <p className="text-muted-foreground mt-4">{`> recommendation: deploy coverage_strategy`}</p>
                  <div className="w-full h-1 bg-muted/30 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      whileInView={{ width: "80%" }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing — Launch Promo: Lifetime Only */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-neon-amber/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-amber/10 border border-neon-amber/30 text-neon-amber text-xs font-mono font-bold tracking-widest uppercase mb-5 animate-pulse-glow">
              <Sparkles className="w-3.5 h-3.5" />
              Promoção de Lançamento • Vagas Limitadas
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Acesso{" "}
              <span className="gradient-brand-text">vitalício</span> por
              <br className="hidden md:block" /> pagamento único
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg">
              Sem mensalidades. Sem renovação. Sem letras miúdas.
              <br />Garanta o Titan Loterias <span className="text-foreground font-semibold">para sempre</span> pelo preço de lançamento.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, type: "spring", stiffness: 80, damping: 16 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative rounded-2xl p-8 md:p-10 glass-card border-2 border-neon-amber/40 shadow-2xl shadow-neon-amber/10 overflow-hidden">
              {/* Rotating border glow */}
              <div
                className="pointer-events-none absolute -inset-[2px] rounded-2xl opacity-60 z-0"
                style={{
                  background:
                    "conic-gradient(from var(--border-angle, 0deg), hsl(var(--neon-amber) / 0.6), hsl(var(--primary) / 0.5), hsl(var(--neon-purple) / 0.4), hsl(var(--neon-amber) / 0.6))",
                  animation: "border-rotate 5s linear infinite",
                }}
              />
              <div className="pointer-events-none absolute inset-[2px] rounded-2xl bg-card z-[1]" />

              <div className="relative z-[2]">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                  <span className="px-4 py-1.5 rounded-full bg-neon-amber text-background text-[11px] font-mono font-bold uppercase tracking-widest whitespace-nowrap shadow-lg shadow-neon-amber/30">
                    💎 Pagamento Único
                  </span>
                </div>

                <div className="text-center mb-6">
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    {lifetimePlan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tudo. Para sempre. Por um único pagamento.
                  </p>
                </div>

                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-3 mb-2">
                    <span className="text-xl text-muted-foreground line-through font-mono">
                      {lifetimePlan.originalPrice}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-destructive/15 text-destructive text-xs font-bold">
                      -70%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl md:text-6xl font-extrabold font-mono gradient-brand-text">
                      {lifetimePlan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">{lifetimePlan.period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 font-mono">
                    🔥 Apenas <span className="text-neon-amber font-bold">{LAUNCH_SPOTS} vagas</span> ao preço de lançamento
                  </p>
                </div>

                <ul className="space-y-3 mb-8 max-w-md mx-auto">
                  {lifetimePlan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/90">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Button
                    size="lg"
                    onClick={(e) => handleCtaClick(e, "/signup")}
                    className="w-full bg-neon-amber text-background hover:bg-neon-amber/90 shadow-xl shadow-neon-amber/30 gap-2 text-base h-14 font-bold"
                  >
                    {lifetimePlan.cta} <ArrowRight className="w-5 h-5" />
                  </Button>
                </motion.div>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  ✓ Pagamento 100% seguro &nbsp;•&nbsp; ✓ Acesso imediato &nbsp;•&nbsp; ✓ Garantia de 7 dias
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>


      {/* FAQ */}
      <section ref={faqRef} className="py-20 md:py-28 bg-card/20" style={{ perspective: 1200 }}>
        <motion.div
          className="container mx-auto px-4"
          style={{ y: faqY, rotateX: faqRotateX, scale: faqScale }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Perguntas{" "}
              <span className="gradient-brand-text">frequentes</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Tire suas dúvidas sobre a plataforma.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <Accordion type="single" collapsible className="space-y-3">
              {[
                { q: "O Titan Loterias garante que vou ganhar?", a: "Não. Loterias são jogos de azar e nenhuma ferramenta pode garantir prêmios. O Titan oferece análises estatísticas e algoritmos para ajudar você a tomar decisões mais informadas." },
                { q: "Quais loterias são suportadas?", a: "Atualmente suportamos Mega-Sena, Lotofácil, Quina, Lotomania, Dupla Sena, Timemania, Dia de Sorte e Super Sete. Todas com dados sincronizados da Caixa." },
                { q: "Como funciona a inteligência artificial?", a: "Nossos modelos de Machine Learning analisam padrões históricos como frequência, atraso, paridade e distribuição para gerar apostas estatisticamente otimizadas." },
                { q: "O acesso vitalício é realmente para sempre?", a: "Sim! Com um único pagamento você garante acesso completo ao Titan Loterias para sempre, incluindo todas as atualizações futuras. Sem mensalidades, sem renovações, sem cobranças recorrentes." },
                { q: "Por que a promoção de lançamento é por tempo limitado?", a: "Estamos lançando o Titan Loterias com vagas limitadas ao preço promocional de R$ 297 (de R$ 997). Após o encerramento das vagas, o valor retorna ao preço normal e os planos passam a ser mensais." },
                { q: "Os dados dos sorteios são confiáveis?", a: "Sim. Todos os resultados são sincronizados automaticamente a partir das fontes oficiais da Caixa Econômica Federal." },
                { q: "Preciso instalar algum aplicativo?", a: "Não. O Titan Loterias funciona 100% no navegador, em qualquer dispositivo — computador, tablet ou celular." },
              ].map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="glass-card border border-border/30 rounded-xl px-5 data-[state=open]:border-primary/20">
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline gap-3">
                    <span className="flex items-center gap-2.5 text-left">
                      <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                      {item.q}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pl-7">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="py-20 md:py-28 gradient-mesh overflow-hidden">
        <motion.div className="container mx-auto px-4" style={{ scale: ctaScale, opacity: ctaOpacity }}>
          <div className="max-w-2xl mx-auto text-center space-y-6 rounded-2xl glass-card p-10 md:p-14 border border-primary/10 glow-green">
            <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
              <Zap className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Pronto para jogar com{" "}
              <span className="gradient-brand-text">inteligência</span>?
            </h2>
            <p className="text-muted-foreground">
              Junte-se a milhares de jogadores que já usam o Titan Loterias para tomar decisões baseadas em dados.
            </p>
              <motion.div
                whileHover={{ scale: 1.06, boxShadow: "0 0 30px hsl(var(--primary) / 0.5)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="rounded-md inline-block"
              >
                <Button size="lg" onClick={(e) => handleCtaClick(e, "/signup")} className="gradient-brand text-primary-foreground shadow-xl shadow-primary/25 gap-2 text-base px-10 h-12">
                  Criar Conta Grátis <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="border-t border-border/30 py-8"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md gradient-brand flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold">Titan Loterias</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link to="/signup" className="hover:text-foreground transition-colors">Vitalício</Link>
              <Link to="/login" className="hover:text-foreground transition-colors">Entrar</Link>
              <Link to="/signup" className="hover:text-foreground transition-colors">Criar Conta</Link>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-mono tracking-wider">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse-glow" />
              © {new Date().getFullYear()} Titan Loterias
            </div>
          </div>
        </div>
      </motion.footer>
      <WhatsAppButton />
    </div>
  );
}
