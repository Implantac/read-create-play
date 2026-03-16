import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

import { LotteryLogosCarousel } from "@/components/LotteryLogosCarousel";
import { ScreensShowcase } from "@/components/ScreensShowcase";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { FloatingCTA } from "@/components/FloatingCTA";
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
    title: "Análise Estatística",
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
    title: "Gerador Profissional",
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
    title: "Simulação Massiva",
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

const plans = [
  {
    name: "Grátis",
    price: "R$ 0",
    period: "/mês",
    features: ["Dashboard básico", "Frequência e atraso", "1 loteria", "Gerador simples"],
    cta: "Começar Grátis",
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$ 29",
    period: "/mês",
    features: [
      "Todas as loterias",
      "IA e Machine Learning",
      "Gerador profissional",
      "Backtesting completo",
      "Simulação massiva",
      "Suporte prioritário",
    ],
    cta: "Assinar Pro",
    highlight: true,
  },
  {
    name: "Titan",
    price: "R$ 59",
    period: "/mês",
    features: [
      "Tudo do Pro",
      "Motor HP exclusivo",
      "Algoritmos genéticos",
      "Otimizador combinatorial",
      "Suporte prioritário",
    ],
    cta: "Assinar Titan",
    highlight: false,
  },
  {
    name: "Vitalício",
    price: "R$ 497",
    period: " único",
    features: [
      "Tudo incluso para sempre",
      "Todas as atualizações futuras",
      "Prioridade máxima",
      "Sem mensalidades",
    ],
    cta: "Comprar Vitalício",
    highlight: false,
    isLifetime: true,
  },
];

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
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Titan <span className="text-primary text-glow-green">Loterias</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/planos">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Planos
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
              Análise de loterias{" "}
              <span className="gradient-brand-text">com inteligência artificial</span>
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A plataforma mais avançada do Brasil para análise estatística, geração de apostas e simulação de loterias.
              Algoritmos de Machine Learning analisando milhares de sorteios.
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link to="/signup">
                <motion.div
                  whileHover={{ scale: 1.06, boxShadow: "0 0 30px hsl(var(--primary) / 0.5)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="rounded-md"
                >
                  <Button size="lg" onClick={(e) => burstConfetti(e)} className="gradient-brand text-primary-foreground shadow-xl shadow-primary/25 gap-2 text-base px-8 h-12 w-full">
                    Começar Grátis <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              </Link>
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
      <section className="border-y border-border/30 bg-card/30 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <AnimatedCounter key={s.label} value={s.value} label={s.label} index={i} />
            ))}
          </div>
        </div>
      </section>

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
              { step: "01", icon: Database, title: "Dados Sincronizados", desc: "Todos os sorteios históricos são importados automaticamente da API da Caixa." },
              { step: "02", icon: Brain, title: "IA Analisa", desc: "Nossos algoritmos de Machine Learning processam padrões, frequências e tendências." },
              { step: "03", icon: Target, title: "Apostas Otimizadas", desc: "Receba sugestões de jogos baseados em análise profunda e probabilidades reais." },
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

      {/* Pricing */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Planos para cada{" "}
              <span className="gradient-brand-text">jogador</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comece grátis e evolua quando quiser. Sem surpresas.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, i) => {
              const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;
                e.currentTarget.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03,1.03,1.03)`;
                // Update glow overlay position
                const glowEl = e.currentTarget.querySelector('[data-glow]') as HTMLElement;
                if (glowEl) {
                  glowEl.style.opacity = '1';
                  glowEl.style.background = `radial-gradient(250px circle at ${x}px ${y}px, hsl(var(--primary) / 0.15), transparent 70%)`;
                }
              };
              const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = `perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`;
                const glowEl = e.currentTarget.querySelector('[data-glow]') as HTMLElement;
                if (glowEl) {
                  glowEl.style.opacity = '0';
                }
              };
              return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60, rotateY: i % 2 === 0 ? 12 : -12, scale: 0.9 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.15, duration: 0.6, type: "spring", stiffness: 80, damping: 15 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ transition: "transform 0.15s ease-out", transformStyle: "preserve-3d" }}
                className={`rounded-xl p-6 border relative overflow-hidden group/card ${
                  plan.highlight
                    ? "glass-card border-primary/30 glow-green"
                    : (plan as any).isLifetime
                    ? "glass-card border-neon-amber/30 shadow-lg shadow-neon-amber/5"
                    : "glass-card border-border/30"
                }`}
              >
                {/* Animated border glow */}
                <div className="pointer-events-none absolute -inset-[1px] rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 z-0"
                  style={{
                    background: 'conic-gradient(from var(--border-angle, 0deg), hsl(var(--primary) / 0.6), hsl(var(--neon-blue) / 0.6), hsl(var(--neon-purple) / 0.4), hsl(var(--primary) / 0.6))',
                    animation: 'border-rotate 3s linear infinite',
                  }}
                />
                {/* Inner background to mask the border glow center */}
                <div className="pointer-events-none absolute inset-[1px] rounded-[11px] bg-card z-[1] opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                <div data-glow className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 z-[2]" />
                <div className="relative z-[3]">
                {(plan as any).isLifetime && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-neon-amber text-background text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
                      Pagamento Único
                    </span>
                  </div>
                )}
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full gradient-brand text-primary-foreground text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                      <Star className="w-3 h-3" /> Mais Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button
                    onClick={(e) => burstConfetti(e)}
                    className={`w-full ${
                      plan.highlight
                        ? "gradient-brand text-primary-foreground shadow-lg shadow-primary/20"
                        : (plan as any).isLifetime
                        ? "bg-neon-amber text-background hover:bg-neon-amber/90 shadow-lg shadow-neon-amber/20"
                        : ""
                    }`}
                    variant={plan.highlight ? "default" : (plan as any).isLifetime ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              O que nossos{" "}
              <span className="gradient-brand-text">jogadores</span> dizem
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Milhares de usuários já transformaram sua forma de jogar nas loterias.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto" style={{ perspective: "1000px" }}>
            {[
              { name: "Carlos M.", initials: "CM", role: "Jogador da Mega-Sena", text: "Com o Titan Loterias, comecei a entender padrões que nunca havia percebido. A análise de frequência e atraso me ajudou a montar jogos muito mais estratégicos." },
              { name: "Ana Paula S.", initials: "AS", role: "Jogadora da Lotofácil", text: "O gerador profissional é sensacional! Já acertei 13 pontos duas vezes desde que comecei a usar. A IA realmente faz diferença nas escolhas." },
              { name: "Roberto F.", initials: "RF", role: "Apostador profissional", text: "Uso o plano Pro há 6 meses e o backtesting mudou completamente minha estratégia. Consigo testar minhas ideias antes de investir dinheiro real." },
              { name: "Mariana L.", initials: "ML", role: "Jogadora da Quina", text: "A simulação massiva me mostrou que algumas combinações são muito mais prováveis do que eu imaginava. Ferramenta indispensável!" },
              { name: "Fernando G.", initials: "FG", role: "Jogador assíduo", text: "Já testei várias plataformas, mas nenhuma chega perto do Titan. Os dados são sempre atualizados e a interface é muito intuitiva." },
              { name: "Juliana R.", initials: "JR", role: "Jogadora casual", text: "Mesmo no plano grátis, já consegui informações valiosas. O dashboard é lindo e fácil de entender. Super recomendo!" },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, rotateY: 90, scale: 0.8 }}
                whileInView={{ opacity: 1, rotateY: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  delay: i * 0.15,
                  duration: 0.7,
                  type: "spring",
                  stiffness: 80,
                  damping: 14,
                }}
                whileHover={{ y: -8, rotateY: -5, scale: 1.03, transition: { duration: 0.25 } }}
                className="glass-card rounded-xl border border-border/30 p-6 space-y-4 hover:border-primary/20 transition-colors"
                style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
              >
                <Quote className="w-6 h-6 text-primary/40" />
                <p className="text-sm text-muted-foreground leading-relaxed">{t.text}</p>
                <div className="flex items-center gap-3 pt-2 border-t border-border/20">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{t.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    <div className="text-[11px] text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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
                { q: "Posso cancelar meu plano a qualquer momento?", a: "Sim! Você pode cancelar ou mudar de plano quando quiser, sem multas ou taxas adicionais." },
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
            <Link to="/signup">
              <motion.div
                whileHover={{ scale: 1.06, boxShadow: "0 0 30px hsl(var(--primary) / 0.5)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="rounded-md inline-block"
              >
                <Button size="lg" onClick={(e) => burstConfetti(e)} className="gradient-brand text-primary-foreground shadow-xl shadow-primary/25 gap-2 text-base px-10 h-12">
                  Criar Conta Grátis <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md gradient-brand flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold">Titan Loterias</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link to="/planos" className="hover:text-foreground transition-colors">Planos</Link>
              <Link to="/login" className="hover:text-foreground transition-colors">Entrar</Link>
              <Link to="/signup" className="hover:text-foreground transition-colors">Criar Conta</Link>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-mono tracking-wider">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse-glow" />
              © {new Date().getFullYear()} Titan Loterias
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
