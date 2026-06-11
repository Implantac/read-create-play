import { useScroll, useTransform } from "framer-motion";
import { useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";

import { LotteryLogosCarousel } from "@/components/lottery/LotteryLogosCarousel";
import { ScreensShowcase } from "@/components/common/ScreensShowcase";
import { FloatingCTA } from "@/components/common/FloatingCTA";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { SocialProofBar } from "@/components/common/SocialProofBar";
import { Testimonials } from "@/components/common/Testimonials";
import { PricingSection } from "@/components/common/PricingSection";
import { TitanCommandCenter } from "@/components/common/TitanCommandCenter";

import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { LeadCaptureForm } from "@/components/landing/LeadCaptureForm";

import { burstConfetti } from "@/lib/confetti";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

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
  const featuresRotateX = useTransform(featuresProgress, [0, 0.5], [4, 0]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden antialiased selection:bg-primary selection:text-white">
      <Helmet>
        <title>Titan Loterias | Inteligência Artificial e Ciência de Dados</title>
        <meta name="description" content="Aumente suas chances na Mega-Sena e Lotofácil com inteligência artificial e análise estatística profissional. Transforme sua sorte em ciência." />
        <meta property="og:title" content="Titan Loterias | Transforme Sorte em Ciência" />
        <meta property="og:description" content="Pare de apostar no escuro. Utilize inteligência artificial de elite para decifrar padrões e otimizar suas apostas." />
        <meta property="og:type" content="website" />
        <meta name="keywords" content="Mega-Sena, Lotofácil, Quina, Inteligência Artificial, Loterias, Gerador de Apostas, Probabilidade, Estatística" />
      </Helmet>
      
      <FloatingCTA />
      <Navbar />

      <HeroSection 
        heroRef={heroRef} 
        heroY={heroY} 
        heroOpacity={heroOpacity} 
        heroScale={heroScale} 
        handleCtaClick={handleCtaClick} 
        fadeUp={fadeUp} 
      />

      <section className="py-12 border-y border-white/5 bg-black/20 overflow-hidden">
        <div className="container mx-auto px-6">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground text-center mb-8 opacity-40">
            Poder de processamento e inteligência analítica de elite
          </p>
          <LotteryLogosCarousel />
        </div>
      </section>

      <SocialProofBar />

      <FeaturesSection 
        featuresRef={featuresRef} 
        featuresRotateX={featuresRotateX} 
        fadeUp={fadeUp} 
      />

      <ScreensShowcase />

      <section className="py-24 md:py-48 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-30" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] bg-primary/10 text-primary border border-primary/20 mb-6 backdrop-blur-sm">
              Processamento em Tempo Real
            </div>
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] mb-6">
              Neural <span className="gradient-brand-text">Command Center</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-medium text-lg opacity-60">
              Acompanhe o processamento dos nossos algoritmos e a detecção de padrões em tempo real.
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <TitanCommandCenter />
          </div>
        </div>
      </section>

      <HowItWorksSection />
      
      <Testimonials />
      <PricingSection />
      <FAQSection />

      <LeadCaptureForm />

      <footer className="py-24 border-t border-white/5 bg-black/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-20" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-4 gap-16 mb-24">
            <div className="col-span-2 space-y-8">
              <div className="flex items-center gap-4 group">
                <img src="/logo.png" alt="Titan Loterias" className="w-12 h-12 grayscale opacity-50" />
                <span className="text-2xl font-black uppercase tracking-tighter italic leading-none">
                  Titan<span className="text-primary/70">Loterias</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed font-medium">
                Titan Loterias é a plataforma definitiva de inteligência analítica para apostadores profissionais. Unimos ciência de dados, IA e estatística para elevar suas chances ao próximo nível.
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
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">
              © {new Date().getFullYear()} USE MODA PLM AI. MADE IN ITALY • ENGINEERED GLOBALLY.
            </p>
            <div className="flex items-center gap-8">
              <WhatsAppButton />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
