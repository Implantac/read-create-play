import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowLeft, MessageSquare, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/landing/Navbar";

export default function ThankYouPage() {
  const { t } = useTranslation();

  const nextSteps = [
    { icon: MessageSquare, text: t("landing.thanks.step1") },
    { icon: ChevronRight, text: t("landing.thanks.step2") },
    { icon: CheckCircle, text: t("landing.thanks.step3") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary selection:text-white">
      <Navbar />
      
      <main className="container mx-auto px-6 pt-40 pb-24 flex items-center justify-center">
        <div className="max-w-3xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl shadow-primary/20">
                <CheckCircle className="w-12 h-12 text-primary" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
                {t("landing.thanks.title")}
              </h1>
              <p className="text-xl text-muted-foreground font-medium opacity-80">
                {t("landing.thanks.subtitle")}
              </p>
            </div>

            <Card className="glass-card p-8 md:p-12 border-primary/20 rounded-[2.5rem] bg-black/40 backdrop-blur-2xl text-left">
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                {t("landing.thanks.description")}
              </p>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">
                  {t("landing.thanks.next_steps_title")}
                </h3>
                <div className="grid gap-4">
                  {nextSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5"
                    >
                      <step.icon className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-sm font-bold text-muted-foreground">{step.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-12">
                <a 
                  href="https://wa.me/5543998581400" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full h-16 rounded-2xl text-xs font-black uppercase tracking-widest gradient-brand text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all gap-3">
                    <MessageSquare className="w-5 h-5" />
                    {t("landing.thanks.whatsapp_button")}
                  </Button>
                </a>
                <Link to="/landing" className="flex-1">
                  <Button variant="outline" className="w-full h-16 rounded-2xl text-xs font-black uppercase tracking-widest border-white/10 bg-white/5 hover:bg-white/10 transition-all gap-3">
                    <ArrowLeft className="w-5 h-5" />
                    {t("landing.thanks.back_button")}
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
