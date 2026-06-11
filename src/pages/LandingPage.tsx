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
        <title>USE MODA PLM AI | A Revolução Digital na Moda</title>
        <meta name="description" content="A primeira plataforma de PLM com IA generativa e ERP nativo. Transforme sua indústria com inteligência preditiva e gestão 360º." />
        <meta property="og:title" content="USE MODA PLM AI | O Futuro da Moda é Inteligente" />
        <meta property="og:description" content="Substitua o caos por previsibilidade. A plataforma definitiva para marcas de moda de elite." />
        <meta property="og:type" content="website" />
        <meta name="keywords" content="PLM Moda, ERP Moda, Inteligência Artificial Moda, Gestão de Coleções, Ficha Técnica Moda, Indústria Têxtil" />
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
            Poder de processamento utilizado pelas maiores holdings de moda
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
              Neural <span className="gradient-brand-text">Trend Monitor</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-medium text-lg opacity-60">
              Acompanhe a IA processando tendências globais e otimizando mix de produtos em microssegundos.
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

      <footer className="py-24 border-t border-white/5 bg-black/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-20" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-4 gap-16 mb-24">
            <div className="col-span-2 space-y-8">
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center font-black text-xl italic transition-all group-hover:border-primary/40">
                  UM
                </div>
                <span className="text-2xl font-black uppercase tracking-tighter italic leading-none">
                  USE<span className="text-primary/70">MODA</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed font-medium">
                USE MODA PLM AI é a plataforma definitiva de inteligência para a indústria fashion global. Unimos IA generativa, ERP nativo e análise preditiva para escalar marcas com perfeição técnica.
              </p>
            </div>
            <div>
              <h4 className="font-black uppercase tracking-[0.3em] text-[10px] text-primary mb-8 italic">Ecossistema</h4>
              <ul className="space-y-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                <li><Link to="/ai-analyst" className="hover:text-primary transition-colors">USE AI Analyst</Link></li>
                <li><Link to="/plm" className="hover:text-primary transition-colors">PLM Hub</Link></li>
                <li><Link to="/erp" className="hover:text-primary transition-colors">ERP Nativo</Link></li>
                <li><Link to="/bi" className="hover:text-primary transition-colors">Business Intelligence</Link></li>
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
