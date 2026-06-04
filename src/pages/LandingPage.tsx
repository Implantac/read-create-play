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
    title: "Raio-X dos Sorteios",
    description: "Veja em segundos quais dezenas estão quentes, frias e atrasadas — com gráficos que a Caixa nunca vai te mostrar.",
    color: "green" as const,
  },
  {
    icon: Brain,
    title: "IA que Aprende com Você",
    description: "Redes neurais treinadas em +10.000 sorteios reais identificam padrões invisíveis ao olho humano.",
    color: "blue" as const,
  },
  {
    icon: Target,
    title: "Gerador Cirúrgico",
    description: "Algoritmos genéticos e Monte Carlo criam jogos otimizados — pare de apostar no chute, comece a apostar com matemática.",
    color: "amber" as const,
  },
  {
    icon: TrendingUp,
    title: "Backtest Brutal",
    description: "Teste qualquer estratégia contra TODO o histórico oficial. Descubra na prática o que funciona — antes de gastar 1 real.",
    color: "red" as const,
  },
  {
    icon: Dices,
    title: "1 Milhão de Simulações",
    description: "Rode 1.000.000 de cenários em segundos e enxergue as probabilidades reais de cada combinação.",
    color: "purple" as const,
  },
  {
    icon: Shield,
    title: "Dados Oficiais 24/7",
    description: "Sincronização automática com a Caixa. Resultado novo? Sua análise já está atualizada antes de você abrir o app.",
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
    "Tudo destravado. Para sempre. Sem upsell, sem trava, sem pegadinha.",
    "8 loterias completas: Mega, Lotofácil, Quina, Lotomania, Dupla, Timemania, Dia de Sorte e Super Sete",
    "IA + Machine Learning + Motor HP — exclusivos do Titan",
    "Gerador profissional, otimizador combinatorial e fechamentos garantidos",
    "Backtesting e simulação massiva ilimitados (1M+ jogos)",
    "Todas as atualizações futuras grátis — para sempre",
    "Suporte VIP no WhatsApp com resposta em minutos",
    "Garantia incondicional de 7 dias: não gostou, devolvemos 100%",
  ],
  cta: "QUERO MINHA VAGA AGORA",
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
      <nav className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-border/40 h-20 flex items-center">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-110 transition-all duration-500 overflow-hidden border border-white/10 bg-background/50">
              <img src="/logo.png" alt="Titan Loterias" className="w-12 h-12 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter uppercase italic leading-none">
                Titan<span className="gradient-brand-text ml-0.5">Loterias</span>
              </span>
              <span className="text-[9px] font-black tracking-[0.3em] uppercase opacity-40">Neural Engine v5.3</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/signup" className="text-[10px] font-black uppercase tracking-widest text-neon-amber hover:text-neon-amber/80 transition-all">Acesso Vitalício</Link>
            <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">Login</Link>
            <Link to="/signup">
              <Button size="sm" className="h-10 px-6 rounded-xl gradient-brand text-primary-foreground font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                Join Network <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </Link>
          </div>
          {/* Mobile menu button could go here */}
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
            <motion.div custom={0} variants={fadeUp} className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-neon-amber/10 border-2 border-neon-amber/30 text-neon-amber text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-neon-amber/5 backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-neon-amber animate-pulse shadow-[0_0_8px_rgba(var(--neon-amber),1)]" />
              Protocolo Elite • {LAUNCH_SPOTS} vagas vitalícias restantes
            </motion.div>

            <motion.h1 custom={1} variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] uppercase italic">
              Pare de apostar no escuro.{" "}
              <span className="gradient-brand-text block mt-4">Jogue com Matemática.</span>
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium opacity-80">
              A única plataforma do Brasil que funde <span className="text-foreground font-black italic underline decoration-primary decoration-4 underline-offset-4">+10.000 sorteios</span>, redes neurais e 14 algoritmos de elite.
            </motion.p>


            <motion.div custom={3} variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <motion.div
                  whileHover={{ scale: 1.06, boxShadow: "0 0 30px hsl(var(--primary) / 0.5)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="rounded-md"
                >
                  <Button size="lg" onClick={(e) => handleCtaClick(e, "/signup")} className="gradient-brand text-primary-foreground shadow-2xl shadow-primary/30 gap-3 text-lg px-10 h-16 rounded-2xl font-black uppercase tracking-widest transition-all">
                    Unlock Lifetime Access <ChevronRight className="w-5 h-5" />
                  </Button>
                </motion.div>
              <Link to="/login">
                <Button size="lg" variant="outline" className="gap-3 text-lg px-10 h-16 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-foreground font-black uppercase tracking-widest transition-all border-2">
                  Member Login
                </Button>
              </Link>

            </motion.div>

            <motion.p custom={3} variants={fadeUp} className="text-xs text-muted-foreground/80 font-mono pt-1">
              ✓ Pagamento único &nbsp;•&nbsp; ✓ Sem mensalidade nunca &nbsp;•&nbsp; ✓ 7 dias de garantia
            </motion.p>


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
              6 armas que transformam{" "}
              <span className="gradient-brand-text">azar em estratégia</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Enquanto o resto do Brasil aposta no chute, você joga com o mesmo arsenal usado por analistas quantitativos.
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
              De curioso a jogador estratégico em <span className="gradient-brand-text">3 minutos</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Sem planilha, sem manual de 200 páginas. Você abre, escolhe a loteria e a inteligência trabalha por você.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", icon: Database, title: "Conecte-se aos dados", desc: "Em 1 clique, você acessa 10.000+ sorteios oficiais da Caixa, atualizados em tempo real." },
              { step: "02", icon: Brain, title: "A IA faz o trabalho pesado", desc: "Redes neurais e algoritmos quantitativos varrem milhões de combinações enquanto você toma um café." },
              { step: "03", icon: Target, title: "Receba jogos otimizados", desc: "Apostas filtradas por probabilidade real, paridade e dispersão. Você só joga — sem achismo." },

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
              Pague <span className="gradient-brand-text">UMA vez</span>.
              <br className="hidden md:block" /> Use para <span className="gradient-brand-text">SEMPRE</span>.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg">
              Enquanto os concorrentes cobram R$ 97/mês (R$ 1.164/ano), você trava o Titan completo por menos de <span className="text-foreground font-semibold">3 mensalidades</span> — e nunca mais paga nada.
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
                    O arsenal completo. Por menos do que você gasta no bolão do mês.
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
                { q: "Vou ganhar na loteria garantido?", a: "Quem promete isso está te enganando. Loteria é jogo de azar — ninguém garante prêmio. O que o Titan faz é tirar o achismo da jogada: você decide com base em 10.000+ sorteios reais, IA e estatística pesada, jogando com vantagem matemática em vez de palpite." },
                { q: "Funciona pra qual loteria?", a: "Todas as 8 principais da Caixa: Mega-Sena, Lotofácil, Quina, Lotomania, Dupla Sena, Timemania, Dia de Sorte e Super Sete — com dados oficiais sincronizados em tempo real." },
                { q: "Sou leigo. Vou conseguir usar?", a: "Sim. Você não precisa entender nada de estatística. Escolhe a loteria, clica em \"Gerar\" e recebe os jogos já otimizados. Os relatórios traduzem tudo em linguagem simples — tipo \"esse jogo tem alinhamento alto com os padrões dos últimos 200 sorteios\"." },
                { q: "Vitalício é vitalício mesmo? Sem pegadinha?", a: "Vitalício de verdade. Um pagamento de R$ 297, acesso completo PARA SEMPRE, com todas as atualizações futuras inclusas. Sem mensalidade, sem renovação, sem cartão recorrente. Nunca." },
                { q: "Por que essa promoção é limitada?", a: "São apenas 100 vagas vitalícias no preço de lançamento (R$ 297 em vez de R$ 997). Depois que encerrarem, voltamos para o modelo de assinatura mensal a R$ 97/mês. Quem entrar agora trava o acesso pra vida toda." },
                { q: "E se eu não gostar?", a: "Devolvemos 100% do seu dinheiro em até 7 dias. Sem perguntas, sem burocracia, sem ressentimento. Você só corre risco se NÃO testar." },
                { q: "Preciso instalar alguma coisa?", a: "Não. Funciona 100% no navegador — computador, tablet ou celular. Em 30 segundos você já está rodando análises." },
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
              Daqui a 1 ano você vai estar na <span className="gradient-brand-text">mesma situação</span> — ou jogando de outro nível.
            </h2>
            <p className="text-muted-foreground">
              R$ 297 hoje. Para sempre. Ou R$ 1.164/ano nos concorrentes. A matemática já fez a escolha por você.
            </p>
              <motion.div
                whileHover={{ scale: 1.06, boxShadow: "0 0 30px hsl(var(--primary) / 0.5)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="rounded-md inline-block"
              >
                <Button size="lg" onClick={(e) => handleCtaClick(e, "/signup")} className="gradient-brand text-primary-foreground shadow-xl shadow-primary/25 gap-2 text-base px-10 h-12">
                  QUERO MINHA VAGA POR R$ 297 <ArrowRight className="w-4 h-4" />
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
