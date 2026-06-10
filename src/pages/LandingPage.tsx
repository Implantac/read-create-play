import { useScroll, useTransform } from "framer-motion";
import { useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";

import { LotteryLogosCarousel } from "@/components/LotteryLogosCarousel";
import { ScreensShowcase } from "@/components/ScreensShowcase";
import { FloatingCTA } from "@/components/FloatingCTA";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SocialProofBar } from "@/components/SocialProofBar";
import { Testimonials } from "@/components/Testimonials";
import { PricingSection } from "@/components/PricingSection";
import { TitanCommandCenter } from "@/components/TitanCommandCenter";

import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FAQSection } from "@/components/landing/FAQSection";

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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden antialiased">
      <Helmet>
        <title>Titan Loterias | Inteligência Artificial e Ciência de Dados</title>
        <meta name="description" content="Aumente suas chances na Mega-Sena e Lotofácil com inteligência artificial e análise estatística profissional. Transforme sua sorte em ciência." />
        <meta property="og:title" content="Titan Loterias | Transforme Sorte em Ciência" />
        <meta property="og:description" content="Pare de apostar no escuro. Utilize inteligência artificial de elite para decifrar padrões e otimizar suas apostas." />
        <meta property="og:type" content="website" />
        <meta name="keywords" content="Mega-Sena, Lotofácil, Quina, Inteligência Artificial, Loterias, Gerador de Apostas, Probabilidade, Estatística" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [1, 2, 3, 4, 5, 6].map((i) => ({
              "@type": "Question",
              "name": t(`landing.faq.q${i}` as any),
              "acceptedAnswer": {
                "@type": "Answer",
                "text": t(`landing.faq.a${i}` as any)
              }
            }))
          })}
        </script>
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

      <LotteryLogosCarousel />
      <SocialProofBar />

      <FeaturesSection 
        featuresRef={featuresRef} 
        featuresRotateX={featuresRotateX} 
        fadeUp={fadeUp} 
      />

      <ScreensShowcase />

      <section className="py-24 md:py-40 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] bg-primary/10 text-primary border border-primary/20 mb-4">
              Poder de Processamento Real
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
              Neural <span className="gradient-brand-text">Command Center</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-4 font-medium">
              Monitore em tempo real o processamento dos nossos algoritmos de elite.
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <TitanCommandCenter />
          </div>
        </div>
      </section>

      <HowItWorksSection />
      
      <Testimonials />
      <PricingSection />
      <FAQSection />

      <footer className="py-20 border-t border-white/5 bg-black/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-30" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 space-y-6">
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="Titan Loterias" className="w-12 h-12 grayscale opacity-50" />
                <span className="text-xl font-black uppercase tracking-tighter italic">Titan<span className="text-primary/50">Loterias</span></span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Titan Loterias é a plataforma definitiva de inteligência analítica para apostadores profissionais. Unimos ciência de dados, IA e estatística para elevar suas chances ao próximo nível.
              </p>
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-widest text-[10px] text-primary mb-6">Plataforma</h4>
              <ul className="space-y-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <li><Link to="/gerador" className="hover:text-primary transition-colors">Gerador de Apostas</Link></li>
                <li><Link to="/analise" className="hover:text-primary transition-colors">Central de Análise</Link></li>
                <li><Link to="/fechamentos" className="hover:text-primary transition-colors">Fechamentos</Link></li>
                <li><Link to="/planos" className="hover:text-primary transition-colors">Assinaturas</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-widest text-[10px] text-primary mb-6">Suporte</h4>
              <ul className="space-y-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <li><Link to="/suporte" className="hover:text-primary transition-colors">Ajuda & FAQ</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} Titan Loterias. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <WhatsAppButton />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
