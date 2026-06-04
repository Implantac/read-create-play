import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

import { LotteryLogosCarousel } from "@/components/LotteryLogosCarousel";
import { ScreensShowcase } from "@/components/ScreensShowcase";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { FloatingCTA } from "@/components/FloatingCTA";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SocialProofBar } from "@/components/SocialProofBar";
import { Testimonials } from "@/components/Testimonials";
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
  MessageCircle,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const colorMap = {
  green: "from-primary/20 to-primary/5 border-primary/20 text-primary",
  blue: "from-neon-blue/20 to-neon-blue/5 border-neon-blue/20 text-neon-blue",
  amber: "from-accent/20 to-accent/5 border-accent/20 text-accent",
  red: "from-neon-red/20 to-neon-red/5 border-neon-red/20 text-neon-red",
  purple: "from-neon-purple/20 to-neon-purple/5 border-neon-purple/20 text-neon-purple",
  cyan: "from-neon-cyan/20 to-neon-cyan/5 border-neon-cyan/20 text-neon-cyan",
};

const LAUNCH_SPOTS = 100;

export default function LandingPage() {
  const { t } = useTranslation();
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

  const heroY = useTransform(heroProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(heroProgress, [0, 0.6], [1, 0]);
  const heroScale = useTransform(heroProgress, [0, 0.6], [1, 0.92]);
  const gridY = useTransform(heroProgress, [0, 1], [0, 80]);
  const featuresRotateX = useTransform(featuresProgress, [0, 0.5], [4, 0]);

  const features = [
    {
      icon: BarChart3,
      title: t("landing.features.items.xray.title"),
      description: t("landing.features.items.xray.description"),
      color: "green" as const,
    },
    {
      icon: Brain,
      title: t("landing.features.items.ia.title"),
      description: t("landing.features.items.ia.description"),
      color: "blue" as const,
    },
    {
      icon: Target,
      title: t("landing.features.items.optimizer.title"),
      description: t("landing.features.items.optimizer.description"),
      color: "amber" as const,
    },
    {
      icon: TrendingUp,
      title: t("landing.features.items.backtest.title"),
      description: t("landing.features.items.backtest.description"),
      color: "red" as const,
    },
    {
      icon: Dices,
      title: t("landing.features.items.simulation.title"),
      description: t("landing.features.items.simulation.description"),
      color: "purple" as const,
    },
    {
      icon: Shield,
      title: t("landing.features.items.sync.title"),
      description: t("landing.features.items.sync.description"),
      color: "cyan" as const,
    },
  ];

  const stats = [
    { value: "10.000+", label: t("landing.stats.draws") },
    { value: "8", label: t("landing.stats.lotteries") },
    { value: "14+", label: t("landing.stats.algorithms") },
    { value: "99.9%", label: t("landing.stats.uptime") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden antialiased">
      <FloatingCTA />
      
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
              <span className="text-[9px] font-black tracking-[0.3em] uppercase opacity-40">Neural Core v5.3</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/signup" className="text-[10px] font-black uppercase tracking-widest text-neon-amber hover:text-neon-amber/80 transition-all">{t("common.vital_access")}</Link>
            <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">{t("common.login")}</Link>
            <Link to="/signup">
              <Button size="sm" className="h-10 px-8 rounded-xl gradient-brand text-primary-foreground font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                {t("common.join_network")} <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section ref={heroRef} className="relative pt-32 pb-20 md:pt-48 md:pb-32 gradient-mesh overflow-hidden">
        <FloatingLotteryBalls />
        <motion.div className="absolute inset-0 opacity-[0.05]" style={{
          y: gridY,
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        <motion.div className="container mx-auto px-4 relative" style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}>
          <motion.div initial="hidden" animate="visible" className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div custom={0} variants={fadeUp} className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-neon-amber/10 border-2 border-neon-amber/30 text-neon-amber text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-neon-amber/5 backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-neon-amber animate-pulse shadow-[0_0_8px_rgba(var(--neon-amber),1)]" />
              {t("landing.hero.badge", { count: LAUNCH_SPOTS })}
            </motion.div>

            <motion.h1 custom={1} variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] uppercase italic">
              {t("landing.hero.title")}{" "}
              <span className="gradient-brand-text block mt-4">{t("landing.hero.subtitle")}</span>
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium opacity-80">
              {t("landing.hero.description")}
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/30">
                <Button size="lg" onClick={(e) => handleCtaClick(e, "/signup")} className="gradient-brand text-primary-foreground h-16 px-10 text-lg font-black uppercase tracking-widest gap-3">
                  {t("landing.hero.cta_primary")} <ChevronRight className="w-5 h-5" />
                </Button>
              </motion.div>
              <Link to="/login">
                <Button size="lg" variant="outline" className="h-16 px-10 text-lg font-black uppercase tracking-widest border-white/10 bg-white/5 hover:bg-white/10 transition-all rounded-2xl border-2">
                  {t("landing.hero.cta_secondary")}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <LotteryLogosCarousel />
      <SocialProofBar />

      <section ref={featuresRef} className="py-24 md:py-40 relative" style={{ perspective: "1200px" }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(160,84,45,0.05),transparent)] pointer-events-none" />
        <motion.div style={{ rotateX: featuresRotateX }} className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-24 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
              {t("landing.features.title").split(" ").map((word, i) => i === 2 ? <span key={i} className="gradient-brand-text">{word} </span> : word + " ")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-medium text-lg opacity-70">
              {t("landing.features.subtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} whileHover={{ y: -12, scale: 1.05 }} className={`rounded-2xl glass-card border-2 bg-gradient-to-b ${colorMap[f.color]} p-10 transition-all duration-500 hover:shadow-2xl group`}>
                <div className="w-16 h-16 rounded-2xl bg-background/50 border border-white/10 flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                  <f.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight italic mb-4">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium opacity-80">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <ScreensShowcase />

      <section className="py-24 md:py-40 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
                Como <span className="gradient-brand-text">Funciona?</span>
              </h2>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Coleta de Big Data", desc: "Nossos servidores monitoram resultados de todas as loterias oficiais em tempo real." },
                  { step: "02", title: "Processamento Neural", desc: "A IA processa mais de 1 milhão de combinações para cada sorteio buscando anomalias." },
                  { step: "03", title: "Geração de Estratégias", desc: "Algoritmos genéticos criam matrizes de jogos com o maior equilíbrio estatístico possível." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start group">
                    <span className="text-5xl font-black text-primary/10 group-hover:text-primary transition-colors italic leading-none">{item.step}</span>
                    <div className="space-y-1">
                      <h4 className="text-xl font-bold uppercase italic">{item.title}</h4>
                      <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square glass-panel rounded-3xl border border-primary/20 p-8 flex items-center justify-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/5 animate-pulse" />
              <Terminal className="w-full h-full text-primary/10" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <Brain className="w-20 h-20 text-primary animate-bounce" />
                <div className="space-y-2">
                  <p className="font-mono text-primary text-xs uppercase tracking-[0.3em]">Status do Sistema</p>
                  <p className="text-2xl font-black italic uppercase">Operando em Alta Fidelidade</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Testimonials />
      
      <section className="py-24 bg-card/30 border-y border-border/40">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12">
            {stats.map((s, i) => (
              <div key={i} className="text-center space-y-2">
                <p className="text-5xl font-black tracking-tighter italic text-primary">{s.value}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section ref={faqRef} className="py-24 md:py-40">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
              {t("landing.faq.title")}
            </h2>
          </motion.div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-border/40 rounded-2xl px-6 bg-card/30 overflow-hidden">
                <AccordionTrigger className="text-left font-bold text-lg hover:no-underline py-6">
                  {t(`landing.faq.q${i}` as any)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  {t(`landing.faq.a${i}` as any)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <footer className="py-12 border-t border-border/30">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Titan" className="w-8 h-8" />
              <span className="text-sm font-black uppercase italic tracking-widest">Titan Loterias © 2026</span>
           </div>
           <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
             <Link to="/suporte" className="hover:text-primary transition-colors">{t("common.support")}</Link>
             <Link to="/planos" className="hover:text-primary transition-colors">{t("common.network")}</Link>
             <Link to="/login" className="hover:text-primary transition-colors">{t("common.access")}</Link>
           </div>
        </div>
      </footer>

      <WhatsAppButton />
    </div>
  );
}
