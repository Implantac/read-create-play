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
          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary italic">{t("landing.hero.badge")}</span>
        </motion.div>

        <div className="space-y-8">
          <motion.h1 
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="text-4xl md:text-[6rem] lg:text-[8rem] font-black tracking-tighter uppercase italic leading-[0.8] mb-8"
          >
            <span className="block text-foreground drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]">{t("landing.hero.title")}</span>
            <span className="block gradient-brand-text not-italic leading-none">{t("landing.hero.subtitle")}</span>
          </motion.h1>
          
          <motion.p 
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed"
          >
            {t("landing.hero.description")}
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
            className="group h-24 px-16 text-xs font-black uppercase tracking-[0.3em] rounded-full shadow-[0_30px_60px_-12px_hsl(var(--primary)/0.5)] hover:shadow-[0_40px_80px_-12px_hsl(var(--primary)/0.7)] transition-all hover:scale-[1.05] active:scale-[0.95]"
          >
            {t("landing.hero.cta_primary")}
            <ArrowRight className="ml-4 w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </Button>

          <button 
            onClick={(e) => handleCtaClick(e, "/login")}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-all italic border-b-2 border-transparent hover:border-primary pb-1"
          >
            {t("landing.hero.cta_secondary")}
          </button>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={4}
          variants={fadeUp}
          className="flex flex-col items-center gap-4 pt-16 opacity-60"
        >
          <div className="flex -space-x-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-11 h-11 rounded-full border-4 border-background bg-gradient-to-br from-white/20 to-transparent backdrop-blur-sm" />
            ))}
            <div className="w-11 h-11 rounded-full border-4 border-background bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary tracking-tighter">
              +500
            </div>
          </div>
          <p className="text-[9px] uppercase tracking-[0.4em] font-black text-muted-foreground">
            Liderando a transformação digital em +500 indústrias
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
