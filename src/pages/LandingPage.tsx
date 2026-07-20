import { useScroll, useTransform } from "framer-motion";
import { useRef, useCallback, lazy, Suspense, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ComplianceDisclaimer } from "@/components/common/ComplianceDisclaimer";

import { burstConfetti } from "@/lib/confetti";

// Below-the-fold sections – code-split to keep the initial landing chunk tiny
const LotteryLogosCarousel = lazy(() =>
  import("@/components/lottery/LotteryLogosCarousel").then((m) => ({ default: m.LotteryLogosCarousel }))
);
const SocialProofBar = lazy(() =>
  import("@/components/common/SocialProofBar").then((m) => ({ default: m.SocialProofBar }))
);
const FeaturesSection = lazy(() =>
  import("@/components/landing/FeaturesSection").then((m) => ({ default: m.FeaturesSection }))
);
const ScreensShowcase = lazy(() =>
  import("@/components/landing/ScreensShowcase").then((m) => ({ default: m.ScreensShowcase }))
);
const TitanCommandCenter = lazy(() =>
  import("@/components/common/TitanCommandCenter").then((m) => ({ default: m.TitanCommandCenter }))
);
const HowItWorksSection = lazy(() =>
  import("@/components/landing/HowItWorksSection").then((m) => ({ default: m.HowItWorksSection }))
);
const SupportedLotteries = lazy(() =>
  import("@/components/landing/SupportedLotteries").then((m) => ({ default: m.SupportedLotteries }))
);
const Testimonials = lazy(() =>
  import("@/components/common/Testimonials").then((m) => ({ default: m.Testimonials }))
);
const PricingSection = lazy(() =>
  import("@/components/common/PricingSection").then((m) => ({ default: m.PricingSection }))
);
const FAQSection = lazy(() =>
  import("@/components/landing/FAQSection").then((m) => ({ default: m.FAQSection }))
);
const FloatingCTA = lazy(() =>
  import("@/components/common/FloatingCTA").then((m) => ({ default: m.FloatingCTA }))
);
const WhatsAppButton = lazy(() =>
  import("@/components/common/WhatsAppButton").then((m) => ({ default: m.WhatsAppButton }))
);

const SectionFallback = () => <div className="min-h-[280px]" aria-hidden />;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [deferredReady, setDeferredReady] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  const handleCtaClick = useCallback((e: React.MouseEvent, to: string) => {
    e.preventDefault();
    burstConfetti(e);
    setTimeout(() => navigate(to), 500);
  }, [navigate]);

  // Defer non-critical overlays (floating CTA / WhatsApp) until after paint
  useEffect(() => {
    const idle = (cb: () => void) => {
      const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
      if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(cb);
      else setTimeout(cb, 1200);
    };
    idle(() => setDeferredReady(true));
  }, []);

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
  const featuresRotateX = useTransform(featuresProgress, [0, 0.5], [4, 0]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden antialiased selection:bg-primary selection:text-white">
      <Helmet>
        <title>Titan Loterias | Inteligência Artificial e Ciência de Dados Aplicada</title>
        <meta name="description" content="Titan Loterias é uma plataforma de inteligência aplicada às loterias brasileiras que analisa históricos oficiais, identifica padrões estatísticos e utiliza IA para gerar apostas mais estratégicas." />
        <meta property="og:title" content="Titan Loterias | Inteligência Artificial para Loterias" />
        <meta property="og:description" content="Analise históricos oficiais, identifique padrões estatísticos e utilize IA para gerar apostas estratégicas." />
        <meta property="og:type" content="website" />
        <meta name="keywords" content="Mega-Sena, Lotofácil, Quina, Inteligência Artificial, Loterias, Gerador de Apostas, Probabilidade, Estatística, Análise de Dados" />
      </Helmet>

      {deferredReady && (
        <Suspense fallback={null}>
          <FloatingCTA />
        </Suspense>
      )}
      <Navbar />

      <HeroSection
        heroRef={heroRef}
        heroY={heroY}
        heroOpacity={heroOpacity}
        heroScale={heroScale}
        handleCtaClick={handleCtaClick}
        fadeUp={fadeUp}
      />

      <section className="py-16 border-y border-white/5 bg-black/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 text-center mb-4 opacity-70">
              Poder de processamento e inteligência analítica de elite
            </p>
            <div className="h-px w-20 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              { label: "Concursos Analisados", value: "24.500+" },
              { label: "Apostas Geradas", value: "1,2M+" },
              { label: "Loterias Suportadas", value: "09" },
              { label: "Apostadores Ativos", value: "4.800+" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm group hover:border-primary/20 transition-all">
                <p className="text-3xl md:text-5xl font-black tracking-tighter italic gradient-brand-text mb-2">{stat.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">{stat.label}</p>
              </div>
            ))}
          </div>

          <Suspense fallback={<SectionFallback />}>
            <LotteryLogosCarousel />
          </Suspense>
        </div>
      </section>

      <Suspense fallback={<SectionFallback />}>
        <SocialProofBar />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <FeaturesSection
          featuresRef={featuresRef}
          featuresRotateX={featuresRotateX}
          fadeUp={fadeUp}
        />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <ScreensShowcase />
      </Suspense>

      <section className="py-24 md:py-48 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-20 pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] bg-primary/10 text-primary border border-primary/20 mb-6 backdrop-blur-sm">
              Sincronização em Tempo Real
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight md:tracking-tighter uppercase italic leading-[0.95] md:leading-[0.85] mb-6">
              Central <span className="gradient-brand-text">Neural Titan</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-medium text-lg opacity-60">
              Acompanhe em tempo real o processamento dos concursos oficiais e a detecção de padrões estatísticos pela nossa IA.
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <Suspense fallback={<SectionFallback />}>
              <TitanCommandCenter />
            </Suspense>
          </div>
        </div>
      </section>

      <Suspense fallback={<SectionFallback />}>
        <HowItWorksSection />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <SupportedLotteries />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <Testimonials />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <PricingSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <FAQSection />
      </Suspense>

      <footer className="py-24 border-t border-white/5 bg-black/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-20" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-4 gap-16 mb-24">
            <div className="col-span-2 space-y-8">
              <div className="flex items-center gap-4 group">
                <img src="/logo.png" alt="Titan Loterias" className="w-12 h-12 grayscale opacity-50" loading="lazy" decoding="async" />
                <span className="text-2xl font-black uppercase tracking-tighter italic leading-none">
                  Titan<span className="text-primary/70">Loterias</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed font-medium">
                Plataforma brasileira de inteligência estatística e IA aplicada às loterias oficiais. Analise, simule e monte apostas com base em dados — nunca no achismo.
              </p>
            </div>
            <div>
              <h4 className="font-black uppercase tracking-[0.3em] text-[10px] text-primary mb-8 italic">Plataforma</h4>
              <ul className="space-y-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                <li><Link to="/gerador" className="hover:text-primary transition-colors">Gerador de Apostas</Link></li>
                <li><Link to="/analise" className="hover:text-primary transition-colors">Central de Análise</Link></li>
                <li><Link to="/fechamentos" className="hover:text-primary transition-colors">Fechamentos</Link></li>
                <li><Link to="/planos" className="hover:text-primary transition-colors">Planos</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black uppercase tracking-[0.3em] text-[10px] text-primary mb-8 italic">Empresa</h4>
              <ul className="space-y-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                <li><Link to="/about" className="hover:text-primary transition-colors">Sobre Nós</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Segurança</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Termos</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>
          <div className="mb-12">
            <ComplianceDisclaimer />
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">
              © {new Date().getFullYear()} Titan Loterias. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-8">
              {deferredReady && (
                <Suspense fallback={null}>
                  <WhatsAppButton />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
