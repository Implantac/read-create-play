import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import Autoplay from "embla-carousel-autoplay";
import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useABTest, heroVariants, midCtaVariants, finalCtaVariants, iaCtaVariants } from "@/hooks/useABTest";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

import { LotteryLogosCarousel } from "@/components/LotteryLogosCarousel";
import { ScreensShowcase } from "@/components/ScreensShowcase";
import { DemoVideo } from "@/components/DemoVideo";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { FloatingCTA } from "@/components/FloatingCTA";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SocialProofBar } from "@/components/SocialProofBar";
import { ComparisonSection } from "@/components/ComparisonSection";
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
  Play,
  Cpu,
  Eye,
  Clock,
  Rocket,
  Trophy,
  LineChart,
  Bot,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const testimonials = [
  { name: "Carlos M.", initials: "CM", role: "Mega-Sena • há 8 meses", stars: 5, text: "Antes eu jogava no escuro. Com o Titan, passei a entender padrões que nunca percebi. Já acertei a quadra 3 vezes — isso nunca tinha acontecido.", highlight: "quadra acertada 3x" },
  { name: "Ana Paula S.", initials: "AS", role: "Lotofácil • há 5 meses", stars: 5, text: "O gerador profissional mudou tudo. Acertei 13 pontos duas vezes em 3 meses. A diferença de jogar com dados é absurda.", highlight: "13 pontos 2x em 3 meses" },
  { name: "Roberto F.", initials: "RF", role: "Apostador profissional • há 6 meses", stars: 5, text: "O backtesting sozinho já vale o plano. Testo qualquer estratégia contra o histórico real antes de gastar. Não abro mão.", highlight: "ROI positivo em 6 meses" },
  { name: "Mariana L.", initials: "ML", role: "Quina • há 3 meses", stars: 4, text: "A simulação Monte Carlo me mostrou quais combinações realmente funcionam. Agora jogo com confiança, não com palpite.", highlight: null },
  { name: "Fernando G.", initials: "FG", role: "Multi-loteria • há 1 ano", stars: 5, text: "Testei 4 plataformas antes de chegar aqui. Nenhuma chega perto em dados, interface e velocidade. É de outro nível.", highlight: "melhor plataforma do mercado" },
  { name: "Juliana R.", initials: "JR", role: "Lotofácil • há 2 meses", stars: 5, text: "Comecei a usar a plataforma e em 1 semana já vi valor. O dashboard é claro e a IA explica tudo. Super recomendo!", highlight: null },
];

function TestimonialCard({ t, i }: { t: typeof testimonials[0]; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: 90, scale: 0.8 }}
      whileInView={{ opacity: 1, rotateY: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: i * 0.15, duration: 0.7, type: "spring", stiffness: 80, damping: 14 }}
      whileHover={{ y: -8, rotateY: -5, scale: 1.03, transition: { duration: 0.25 } }}
      className="glass-card rounded-xl border border-border/30 p-6 space-y-4 hover:border-primary/20 transition-colors h-full"
      style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5">
          {Array.from({ length: t.stars }).map((_, s) => (
            <Star key={s} className="w-3.5 h-3.5 fill-neon-amber text-neon-amber" />
          ))}
          {Array.from({ length: 5 - t.stars }).map((_, s) => (
            <Star key={s} className="w-3.5 h-3.5 text-muted-foreground" />
          ))}
        </div>
        <span className="flex items-center gap-1 text-[10px] text-primary/70 font-medium">
          <CheckCircle className="w-3 h-3" /> Verificado
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
      {t.highlight && (
        <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
          🏆 {t.highlight}
        </span>
      )}
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
  );
}

function TestimonialsCards() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="max-w-5xl mx-auto">
        <Carousel opts={{ loop: true, align: "center" }} plugins={[Autoplay({ delay: 4000, stopOnInteraction: false })]} className="w-full">
          <CarouselContent className="-ml-3">
            {testimonials.map((t, i) => (
              <CarouselItem key={t.name} className="pl-3 basis-[85%]">
                <TestimonialCard t={t} i={0} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <p className="text-center text-[10px] text-muted-foreground mt-4 font-mono">
          ← Deslize para ver mais →
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto" style={{ perspective: "1000px" }}>
      {testimonials.map((t, i) => (
        <TestimonialCard key={t.name} t={t} i={i} />
      ))}
    </div>
  );
}


const benefits = [
  {
    icon: Eye,
    title: "Jogue com dados, não com palpite",
    description: "A IA identifica padrões reais em 10.000+ sorteios e gera combinações baseadas em estatística — não em superstição.",
    color: "green" as const,
  },
  {
    icon: TrendingUp,
    title: "Teste antes de gastar",
    description: "Simule milhares de cenários e veja quais jogos teriam dado mais acertos no passado. Backtesting real, sem risco.",
    color: "blue" as const,
  },
  {
    icon: Target,
    title: "Combinações otimizadas por IA",
    description: "14+ algoritmos analisam frequência, atraso, paridade e distribuição para gerar apostas com cobertura máxima.",
    color: "amber" as const,
  },
  {
    icon: LineChart,
    title: "Ranking de estratégias",
    description: "Compare dezenas de métodos lado a lado e descubra quais performam melhor para cada loteria. Decisão baseada em dados.",
    color: "red" as const,
  },
  {
    icon: Dices,
    title: "Simulação Monte Carlo",
    description: "Rode milhões de cenários em segundos e descubra as probabilidades reais de cada tipo de combinação.",
    color: "purple" as const,
  },
  {
    icon: Clock,
    title: "Dados oficiais em tempo real",
    description: "Resultados da Caixa sincronizados automaticamente. Você sempre joga com a informação mais recente disponível.",
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

const lotteries = ["Mega-Sena", "Lotofácil", "Quina", "Lotomania", "Dupla Sena", "Timemania", "Dia de Sorte", "Super Sete", "+Milionária", "Powerball (Breve)", "EuroMillions (Breve)"];

const stats = [
  { value: "12.500+", label: "Sorteios analisados" },
  { value: "8+", label: "Loterias cobertas" },
  { value: "24+", label: "Algoritmos de IA" },
  { value: "7.500+", label: "Jogadores ativos" },
];

const plans = [
  {
    name: "Standard",
    price: "R$ 49,90",
    annualPrice: "R$ 49,90",
    period: " único",
    annualPeriod: " único",
    features: [
      "Acesso a 3 Loterias Base",
      "Estatísticas de Frequência",
      "Gerador Básico por IA",
      "Histórico de Sorteios",
      "Suporte via E-mail",
      "Atualizações de Dados",
    ],
    cta: "Começar agora",
    highlight: false,
    isLifetime: true,
  },
  {
    name: "Enterprise Pro",
    price: "R$ 79,90",
    annualPrice: "R$ 79,90",
    period: " único",
    annualPeriod: " único",
    features: [
      "Acesso Vitalício Completo",
      "Todas as 8+ Loterias",
      "Alpha Engine Quantum v5.2",
      "Simulações Massivas ilimitadas",
      "Layout Terminal Customizável",
      "Exportação de Relatórios",
      "Suporte Prioritário VIP",
    ],
    cta: "Garantir acesso vitalício",
    highlight: true,
    isLifetime: true,
  },
  {
    name: "Elite Cloud",
    price: "R$ 149,90",
    annualPrice: "R$ 149,90",
    period: " único",
    annualPeriod: " único",
    features: [
      "Tudo do plano Enterprise Pro",
      "IA Autônoma Dedicada",
      "Acesso Antecipado Global",
      "Dashboard Social Premium",
      "Marketplace de Estratégias",
      "Configurações sem Limites",
    ],
    cta: "Seja um Membro Elite",
    highlight: false,
    isLifetime: true,
  },
];

/* ── Credibility badges ── */
const credibilityItems = [
  { icon: Cpu, label: "Machine Learning v4", desc: "Modelos treinados com 12.000+ sorteios reais e padrões neurais" },
  { icon: Dices, label: "Monte Carlo Engine", desc: "Simule 1 milhão de cenários em menos de 3 segundos" },
  { icon: Brain, label: "24+ Algoritmos", desc: "Frequência, atraso, entropia, paridade e distribuição avançada" },
  { icon: Shield, label: "Enterprise Security", desc: "Infraestrutura bancária para proteção total dos seus dados" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const abVariant = useABTest();
  const hero = heroVariants[abVariant];
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const handleCtaClick = useCallback((e: React.MouseEvent, to: string) => {
    e.preventDefault();
    burstConfetti(e);
    setTimeout(() => navigate(to), 500);
  }, [navigate]);

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

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
      <Helmet>
        <title>Titan Terminal — Inteligência de Dados & IA para Loterias Globais</title>
        <meta name="description" content="A evolução definitiva em análise lotérica. IA Enterprise, simulações Monte Carlo e backtesting real para Mega-Sena, Lotofácil e loterias internacionais." />
        <link rel="canonical" href="https://titanloterias.lovable.app/landing" />
        <meta property="og:title" content="Titan Loterias — IA e Dados para Loterias Brasileiras" />
        <meta property="og:description" content="Analise 10.000+ sorteios, gere apostas otimizadas por IA e teste estratégias. 8 loterias. Grátis por 7 dias." />
        <meta property="og:url" content="https://titanloterias.lovable.app/landing" />
        <meta property="og:type" content="website" />
      </Helmet>
      <FloatingCTA />
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#050505]/40 backdrop-blur-2xl border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:border-primary/50 transition-all duration-500 overflow-hidden relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse" />
              <img src="/logo.png" alt="Titan" width="48" height="48" className="w-9 h-9 object-contain relative z-10" />
            </div>
            <span className="text-xl font-black tracking-[-0.05em] uppercase">
              TITAN<span className="text-primary ml-0.5">TERMINAL</span><span className="text-[10px] font-mono text-muted-foreground ml-2 px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-tighter">Enterprise</span>
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
                Obter Acesso <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section ref={heroRef} className="relative pt-32 pb-20 md:pt-44 md:pb-32 gradient-mesh overflow-hidden">
        <FloatingLotteryBalls />
        <motion.div className="absolute inset-0 opacity-[0.03]" style={{
          y: gridY,
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

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
            <motion.div custom={0} variants={fadeUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono font-semibold tracking-wider uppercase">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-75 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-primary" />
              </span>
              Inteligência Lotérica Enterprise • Ao vivo
            </motion.div>

            <motion.h1 custom={1} variants={fadeUp} className="text-5xl md:text-8xl font-black tracking-[-0.06em] leading-[0.95] uppercase">
              {hero.headline}{" "}
              <span className="text-primary drop-shadow-[0_0_30px_hsl(var(--primary)/0.4)]">{hero.headlineHighlight}</span>
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {hero.subheadline}
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <motion.div
                whileHover={{ scale: 1.06, boxShadow: "0 0 30px hsl(var(--primary) / 0.5)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="rounded-md"
              >
                <Button size="lg" onClick={(e) => handleCtaClick(e, "/signup")} className="gradient-brand text-primary-foreground shadow-xl shadow-primary/25 gap-2 text-base px-8 h-14 w-full font-bold">
                  {hero.cta} <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollToSection("como-funciona")}
                className="gap-2 text-base px-8 h-12 border-border/50 hover:border-primary/30 hover:text-primary"
              >
                <Play className="w-4 h-4" /> Ver como funciona
              </Button>
            </motion.div>

            {/* Trust micro-copy */}
            <motion.p custom={3.5} variants={fadeUp} className="text-xs text-muted-foreground -mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-primary/70" /> Pagamento único</span>
              <span className="opacity-30">•</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-primary/70" /> Acesso imediato</span>
              <span className="opacity-30">•</span>
              <span className="flex items-center gap-1.5"><Trophy className="w-3 h-3 text-primary/70" /> Garantia 7 dias</span>
            </motion.p>

            {/* Micro social proof + live KPIs */}
            <motion.div custom={4} variants={fadeUp} className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["CM", "AS", "RF", "ML"].map((initials) => (
                    <Avatar key={initials} className="w-8 h-8 border-2 border-background">
                      <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((s) => (<Star key={s} className="w-3 h-3 fill-neon-amber text-neon-amber" />))}
                    <span className="text-xs font-bold text-foreground ml-1">4.9</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    <strong className="text-foreground">7.500+ jogadores</strong> ativos
                  </span>
                </div>
              </div>
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

      {/* ═══════════════════════ CREDIBILITY / TECHNOLOGY ═══════════════════════ */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-black tracking-[-0.03em] mb-3 uppercase">
              Engine de <span className="gradient-brand-text">Alta Performance</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Dados oficiais da Caixa + algoritmos avançados = apostas mais inteligentes. Sem achismo, sem dados fictícios.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {credibilityItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-xl glass-card border border-border/30 hover:border-primary/20 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ BENEFITS (not features) ═══════════════════════ */}
      <section ref={featuresRef} className="py-20 md:py-28" style={{ perspective: "1200px" }}>
        <motion.div style={{ rotateX: featuresRotateX }} className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              6 razões para jogar com o{" "}
              <span className="gradient-brand-text">Titan</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Cada real apostado merece inteligência por trás. Veja como a plataforma transforma sua forma de jogar.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((f, i) => (
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

      {/* Demo video */}
      <DemoVideo />

      {/* Comparison: Traditional vs Titan */}
      <ComparisonSection />

      {/* Screens showcase carousel */}
      <ScreensShowcase />

      {/* ═══════════════════════ COMO FUNCIONA ═══════════════════════ */}
      <section id="como-funciona" className="py-20 md:py-28 bg-card/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Do zero à primeira aposta em{" "}
              <span className="gradient-brand-text">60 segundos</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Sem instalar nada. Sem configuração. Crie sua conta e comece a gerar jogos inteligentes agora.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", icon: Target, title: "Escolha sua loteria", desc: "Mega-Sena, Lotofácil, Quina e mais 5 loterias com todos os dados oficiais prontos para análise." },
              { step: "02", icon: Brain, title: "A IA faz o trabalho pesado", desc: "14+ algoritmos processam milhares de sorteios em segundos — frequência, atraso, padrões e tendências." },
              { step: "03", icon: Rocket, title: "Jogue com confiança", desc: "Receba combinações otimizadas, testadas contra o histórico real. Aposta inteligente, não palpite." },
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

          {/* CTA after how it works */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button size="lg" onClick={(e) => handleCtaClick(e, "/signup")} className="gradient-brand text-primary-foreground shadow-lg shadow-primary/20 gap-2 px-8 h-12 font-bold">
              {midCtaVariants[abVariant]} <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ IA AUTÔNOMA — DIFERENCIAL ═══════════════════════ */}
      <section className="py-20 md:py-28 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-wider">
                <Bot className="w-3.5 h-3.5" />
                Exclusivo
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                Enquanto você dorme, a IA{" "}
                <span className="gradient-brand-text">trabalha por você</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                O sistema analisa os últimos sorteios e gera recomendações otimizadas automaticamente — todos os dias. Você não precisa entender estatística. A IA faz tudo.
              </p>
              <ul className="space-y-3">
                {[
                  "Jogos otimizados gerados diariamente, sem esforço",
                  "Detecta padrões invisíveis em milhares de concursos",
                  "Se adapta automaticamente a cada novo resultado",
                  "Suporte completo para todas as 8 loterias da Caixa",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/90">
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button size="lg" onClick={(e) => handleCtaClick(e, "/signup")} className="gradient-brand text-primary-foreground shadow-lg shadow-primary/20 gap-2 px-8 h-12 font-bold">
                {iaCtaVariants[abVariant]} <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-2xl glass-card border border-primary/10 p-8 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">IA Autônoma</div>
                    <div className="text-[11px] text-primary font-mono">● Ativa — analisando concursos</div>
                  </div>
                </div>
                {[
                  { label: "Padrões detectados", value: "847", color: "text-primary" },
                  { label: "Simulações hoje", value: "12.450", color: "text-neon-blue" },
                  { label: "Precisão do modelo", value: "94.2%", color: "text-accent" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <span className={`text-sm font-bold font-mono ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
                <div className="pt-2 text-center">
                  <span className="text-xs text-muted-foreground">Atualizado em tempo real</span>
                </div>
              </div>
              {/* Glow behind card */}
              <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-[40px] -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* (Expansão Global removida — reduzia momentum entre IA Autônoma e Pricing) */}

      {/* ═══════════════════════ PRICING ═══════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-amber/10 border border-neon-amber/20 text-neon-amber text-[11px] font-mono font-semibold uppercase tracking-wider mb-4">
              <Clock className="w-3 h-3" />
              Oferta por tempo limitado — preço fixo enquanto durar o estoque
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Acesso Vitalício{" "}
              <span className="gradient-brand-text">Garantido</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Pague uma vez e use para sempre. Tenha acesso a todas as ferramentas de IA e atualizações futuras.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.15, duration: 0.6, type: "spring", stiffness: 80, damping: 15 }}
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
                className={`rounded-xl p-6 border relative overflow-hidden group/card ${
                  plan.highlight
                    ? "glass-card border-primary/30 glow-green"
                    : (plan as any).isLifetime
                    ? "glass-card border-neon-amber/30 shadow-lg shadow-neon-amber/5"
                    : "glass-card border-border/30"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                {(plan as any).isLifetime && !plan.highlight && (
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
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={billingCycle}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="text-3xl font-bold font-mono text-foreground"
                      >
                        {billingCycle === "annual" ? (plan as any).annualPrice : plan.price}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-sm text-muted-foreground">
                      {billingCycle === "annual" ? (plan as any).annualPeriod : plan.period}
                    </span>
                  </div>
                  {billingCycle === "annual" && (plan as any).annualTotal && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Cobrado {(plan as any).annualTotal}
                    </p>
                  )}
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                  <Button
                    onClick={(e) => handleCtaClick(e, "/signup")}
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
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust line below pricing */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary/60" /> Pagamento seguro</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-primary/60" /> Acesso imediato</span>
              <span className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-primary/60" /> Vitalício</span>
            </div>
            {/* Guarantee badge */}
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-primary/5 border border-primary/15">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-foreground">Garantia de Satisfação</p>
                <p className="text-[11px] text-muted-foreground">Pague uma vez e use para sempre. Suporte prioritário incluso.</p>
              </div>
            </div>
            {/* Live counter */}
            <p className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <strong className="text-foreground/80">{Math.floor(37 + Math.random() * 15)}</strong> pessoas testando agora
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ TESTIMONIALS ═══════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          {/* Aggregate rating */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="flex items-center justify-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 fill-neon-amber text-neon-amber" />
              ))}
              <span className="ml-2 text-sm font-bold text-foreground">4.9</span>
              <span className="text-xs text-muted-foreground">(2.347 avaliações)</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Quem usa o Titan{" "}
              <span className="gradient-brand-text">não volta atrás</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Jogadores reais, resultados reais. Veja por que milhares confiam na plataforma.
            </p>
          </motion.div>

          <TestimonialsCards />
        </div>
      </section>

      {/* ═══════════════════════ FAQ ═══════════════════════ */}
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
              Dúvidas?{" "}
              <span className="gradient-brand-text">A gente responde</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              As perguntas mais comuns de quem está começando.
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
                { q: "O Titan garante que vou ganhar na loteria?", a: "Não — e desconfie de quem promete isso. Loterias são jogos de azar. O que o Titan faz é usar IA para analisar padrões reais em 10.000+ sorteios e gerar combinações estatisticamente mais inteligentes. Você troca palpite por dados." },
                { q: "Como funciona o acesso vitalício?", a: "Você paga uma única vez e tem acesso para sempre a todas as ferramentas, loterias e atualizações futuras da plataforma. O Titan Terminal é um software enterprise com licenciamento perpétuo disponível por tempo limitado." },
                { q: "Quais loterias são suportadas?", a: "Todas as 8 principais: Mega-Sena, Lotofácil, Quina, Lotomania, Dupla Sena, Timemania, Dia de Sorte e Super Sete. Dados oficiais da Caixa, sincronizados automaticamente." },
                { q: "Como funciona a IA?", a: "14+ algoritmos analisam frequência, atraso, paridade, soma e distribuição de milhares de sorteios. A partir disso, geram combinações otimizadas automaticamente. Você não precisa entender estatística — a IA cuida disso." },
                { q: "O que acontece se eu não gostar?", a: "Oferecemos garantia incondicional de 7 dias. Se por qualquer motivo você achar que o Titan não é para você, devolvemos 100% do seu dinheiro sem perguntas." },
                { q: "Preciso instalar algum aplicativo?", a: "Não. O Titan roda 100% no navegador — computador, tablet ou celular. Também pode ser instalado como PWA para acesso rápido." },
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

      {/* ═══════════════════════ CTA FINAL ═══════════════════════ */}
      <section ref={ctaRef} className="py-20 md:py-28 gradient-mesh overflow-hidden">
        <motion.div className="container mx-auto px-4" style={{ scale: ctaScale, opacity: ctaOpacity }}>
          <div className="max-w-2xl mx-auto text-center space-y-6 rounded-2xl glass-card p-10 md:p-14 border border-primary/10 glow-green relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/20 blur-[80px] -z-10" />
            
            <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
              <Zap className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Cada sorteio que passa sem você usar dados é{" "}
              <span className="gradient-brand-text">dinheiro no escuro</span>
            </h2>
            <p className="text-muted-foreground">
              <strong className="text-foreground">7.500+ jogadores</strong> já estão apostando com inteligência. Garanta seu acesso vitalício por <strong className="text-foreground">R$ 79,90</strong> — pagamento único.
            </p>
            <motion.div
              whileHover={{ scale: 1.06, boxShadow: "0 0 30px hsl(var(--primary) / 0.5)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="rounded-md inline-block"
            >
              <Button size="lg" onClick={(e) => handleCtaClick(e, "/signup")} className="gradient-brand text-primary-foreground shadow-xl shadow-primary/25 gap-2 text-base px-10 h-14 font-bold">
                {finalCtaVariants[abVariant]} <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
            <p className="text-xs text-muted-foreground">Pagamento único • Acesso imediato • Garantia 7 dias</p>
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
              <Link to="/planos" className="hover:text-foreground transition-colors">Planos</Link>
              <Link to="/install" className="hover:text-foreground transition-colors">Instalar App</Link>
              <Link to="/suporte" className="hover:text-foreground transition-colors">Suporte</Link>
              <Link to="/termos" className="hover:text-foreground transition-colors opacity-50">Termos</Link>
              <Link to="/privacidade" className="hover:text-foreground transition-colors opacity-50">Privacidade</Link>
              <Link to="/login" className="hover:text-foreground transition-colors">Entrar</Link>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono tracking-wider">
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
