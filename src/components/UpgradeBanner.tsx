import { motion } from "framer-motion";
import { Crown, Sparkles, TrendingUp, Brain, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const highlights = [
  { icon: Sparkles, text: "Gerador Profissional com filtros" },
  { icon: TrendingUp, text: "Simulador Monte Carlo" },
  { icon: Brain, text: "IA preditiva avançada" },
];

export function UpgradeBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] via-transparent to-accent/[0.06]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,hsl(var(--primary)/0.08),transparent_60%)]" />

      <div className="relative flex flex-col md:flex-row items-center gap-5 p-5 md:p-6">
        {/* Icon */}
        <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Zap className="w-6 h-6 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <h3 className="text-base font-semibold text-foreground">
            Desbloqueie o potencial completo da plataforma
          </h3>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            {highlights.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1 border border-border/30"
              >
                <h.icon className="w-3 h-3 text-primary" />
                {h.text}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link to="/planos" className="shrink-0">
          <Button className="gradient-brand text-primary-foreground shadow-md shadow-primary/20 gap-2 px-5">
            <Crown className="w-4 h-4" />
            Ver Planos
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
