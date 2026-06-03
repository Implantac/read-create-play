import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Loader2, Save, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import React from "react";

export interface PlanData {
  id: string;
  name: string;
  price: string;
  period: string;
  icon: LucideIcon;
  description: string;
  savedBetsLimit: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  isLifetime?: boolean;
  annualTotal?: string;
}

interface PlanCardProps {
  plan: PlanData;
  index: number;
  isCurrent: boolean;
  isUpgrade: boolean;
  isLoading: boolean;
  onCheckout: (planId: string) => void;
}

export function PlanCard({ plan, index, isCurrent, isUpgrade, isLoading, onCheckout }: PlanCardProps) {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    e.currentTarget.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03,1.03,1.03)`;
    const glowEl = e.currentTarget.querySelector('[data-glow]') as HTMLElement;
    if (glowEl) {
      glowEl.style.opacity = '1';
      glowEl.style.background = `radial-gradient(250px circle at ${x}px ${y}px, hsl(var(--primary) / 0.15), transparent 70%)`;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = `perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`;
    const glowEl = e.currentTarget.querySelector('[data-glow]') as HTMLElement;
    if (glowEl) {
      glowEl.style.opacity = '0';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -60 : 60, rotateY: index % 2 === 0 ? 12 : -12, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
      transition={{ delay: index * 0.15, duration: 0.6, type: "spring", stiffness: 80, damping: 15 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: "transform 0.15s ease-out", transformStyle: "preserve-3d" }}
      className="relative group/card"
    >
      {/* Animated border glow on hover */}
      <div
        className="pointer-events-none absolute -inset-[1px] rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 z-0"
        style={{
          background: 'conic-gradient(from var(--border-angle, 0deg), hsl(var(--primary) / 0.6), hsl(var(--neon-blue) / 0.6), hsl(var(--neon-purple) / 0.4), hsl(var(--primary) / 0.6))',
          animation: 'border-rotate 3s linear infinite',
        }}
      />
      {/* Inner bg to mask border glow center */}
      <div className="pointer-events-none absolute inset-[1px] rounded-[11px] bg-card z-[1] opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
      {/* Radial glow following cursor */}
      <div data-glow className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 z-[2]" />

      <Card
        className={`relative flex flex-col h-full overflow-hidden z-[3] ${
          plan.highlight
            ? "border-primary/50 bg-card/90 shadow-lg shadow-primary/10 scale-[1.02]"
            : plan.isLifetime
            ? "border-accent/40 bg-card/90 shadow-lg shadow-accent/10"
            : isCurrent
            ? "border-primary/30 bg-card/90 ring-2 ring-primary/20"
            : "border-border/40 bg-card/80"
        }`}
      >
        {/* Top accent line */}
        {plan.highlight && !isCurrent && (
          <div className="absolute top-0 left-0 right-0 h-1 gradient-brand" />
        )}
        {plan.isLifetime && !isCurrent && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent/80 to-accent" />
        )}

        <div className="relative z-[3] flex flex-col h-full">
          {/* Badge */}
          <div className="flex justify-center pt-5">
            {plan.highlight && !isCurrent && (
              <Badge className="gradient-brand text-primary-foreground border-0 shadow-lg shadow-primary/20 text-xs px-3">
                ⭐ Mais popular
              </Badge>
            )}
            {plan.isLifetime && !isCurrent && (
              <Badge className="bg-accent text-accent-foreground border-0 shadow-lg shadow-accent/20 text-xs px-3">
                💎 Pagamento único
              </Badge>
            )}
            {isCurrent && (
              <Badge className="bg-primary text-primary-foreground border-0 text-xs px-3">
                ✓ Seu plano
              </Badge>
            )}
          </div>

          <CardHeader className="text-center pb-2 pt-3">
            <div
              className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-110 ${
                plan.highlight
                  ? "gradient-brand shadow-lg shadow-primary/25"
                  : plan.isLifetime
                  ? "bg-accent/15 border-2 border-accent/30"
                  : "bg-muted/60 border border-border/40"
              }`}
            >
              <plan.icon
                className={`w-7 h-7 ${
                  plan.highlight ? "text-primary-foreground" : plan.isLifetime ? "text-accent" : "text-primary"
                }`}
              />
            </div>
            <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
            <CardDescription className="text-xs mt-1">{plan.description}</CardDescription>
            <div className="mt-4 mb-1">
              <span className="text-4xl font-extrabold text-foreground font-mono tracking-tight">{plan.price}</span>
              <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
            </div>
            {plan.annualTotal && (
              <p className="text-xs text-muted-foreground mt-1">
                Cobrado <span className="font-semibold text-foreground">{plan.annualTotal}</span>
              </p>
            )}
          </CardHeader>

          <CardContent className="flex-1 pt-2">
            {/* Saved bets limit */}
            <div
              className={`flex items-center gap-2 mb-5 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                plan.id === "free"
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-primary/10 text-primary border border-primary/20"
              }`}
            >
              <Save className="w-3.5 h-3.5 shrink-0" />
              {plan.savedBetsLimit}
            </div>

            <ul className="space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="pt-4 pb-6">
            <Button
              className={`w-full gap-2 h-11 font-semibold transition-all duration-200 ${
                plan.highlight && isUpgrade
                  ? "gradient-brand text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02]"
                  : plan.isLifetime && isUpgrade
                  ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:scale-[1.02]"
                  : ""
              }`}
              variant={isCurrent ? "secondary" : plan.highlight ? "default" : "outline"}
              disabled={isCurrent || plan.id === "free" || isLoading}
              onClick={() => isUpgrade && onCheckout(plan.id)}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isCurrent ? (
                "Plano atual"
              ) : plan.id === "free" ? (
                "Gratuito"
              ) : (
                <>
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </div>
      </Card>
    </motion.div>
  );
}
