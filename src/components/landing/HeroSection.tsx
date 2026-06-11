import { motion, MotionValue } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { FloatingLotteryBalls } from "@/components/lottery/FloatingLotteryBalls";

interface HeroSectionProps {
  heroRef: React.RefObject<HTMLDivElement>;
  heroY: MotionValue<number>;
  heroOpacity: MotionValue<number>;
  heroScale: MotionValue<number>;
  handleCtaClick: (e: React.MouseEvent, to: string) => void;
  fadeUp: any;
}

export function HeroSection({ heroRef, heroY, heroOpacity, heroScale, handleCtaClick, fadeUp }: HeroSectionProps) {
  const { t } = useTranslation();

  return (
    <section ref={heroRef} className="relative min-h-[100vh] flex items-center justify-center pt-24 pb-32 px-6 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-primary/10 rounded-full blur-[160px] opacity-20 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[140px] opacity-10" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      </div>

      <FloatingLotteryBalls />

      <motion.div 
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        className="container max-w-screen-2xl mx-auto relative z-10 text-center space-y-12"
      >
        <motion.div 
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
          className="inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-primary/5 border border-primary/20 backdrop-blur-md shadow-2xl mb-4"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
          </span>
          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary italic">INTELIGÊNCIA ARTIFICIAL APLICADA</span>
        </motion.div>

        <div className="space-y-8">
          <motion.h1 
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="text-4xl md:text-[6rem] lg:text-[7.5rem] font-black tracking-tighter uppercase italic leading-[0.85] mb-8"
          >
            <span className="block text-foreground drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]">INTELIGÊNCIA ARTIFICIAL PARA</span>
            <span className="block gradient-brand-text not-italic leading-none text-[3.5rem] md:text-[5rem] lg:text-[7rem]">LOTERIAS BRASILEIRAS</span>
          </motion.h1>
          
          <motion.p 
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Analise milhares de concursos, descubra padrões ocultos e gere apostas utilizando estratégias matemáticas avançadas e IA. O Titan Loterias é a plataforma definitiva de inteligência aplicada às loterias brasileiras.
          </motion.p>
        </div>

        <motion.div 
          initial="hidden"
          animate="visible"
          custom={3}
          variants={fadeUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-10"
        >
          <Button 
            size="lg" 
            variant="premium"
            onClick={(e) => handleCtaClick(e, "/signup")}
            className="group h-20 px-12 text-sm font-black uppercase tracking-widest rounded-2xl shadow-[0_30px_60px_-12px_hsl(var(--primary)/0.5)] hover:shadow-[0_40px_80px_-12px_hsl(var(--primary)/0.7)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Testar Gratuitamente
            <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Link to="/login" className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors italic px-4 py-2">
            Já sou um Titan
          </Link>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={4}
          variants={fadeUp}
          className="flex flex-col items-center gap-3 pt-8 opacity-70"
        >
          <div className="flex -space-x-3">
            <div className="w-9 h-9 rounded-full border-2 border-background bg-gradient-to-br from-primary/40 to-primary/10" />
            <div className="w-9 h-9 rounded-full border-2 border-background bg-gradient-to-br from-accent/40 to-accent/10" />
            <div className="w-9 h-9 rounded-full border-2 border-background bg-gradient-to-br from-neon-blue/40 to-neon-blue/10" />
            <div className="w-9 h-9 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[9px] font-black text-primary tracking-tight">
              +2k
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground">
            Mais de 2.400 membros ativos na rede neural
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
