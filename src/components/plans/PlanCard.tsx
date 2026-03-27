import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Loader2, Save, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, type: "spring", stiffness: 100, damping: 18 }}
      className="relative"
    >
      {/* Glow effect for highlighted card */}
      {plan.highlight && (
        <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-primary/40 via-primary/10 to-transparent blur-sm" />
      )}
      {plan.isLifetime && (
        <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-accent/30 via-accent/5 to-transparent blur-sm" />
      )}

      <Card
        className={`relative flex flex-col h-full overflow-hidden transition-all duration-300 ${
          plan.highlight
            ? "border-primary/50 bg-card/90 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/15 scale-[1.02]"
            : plan.isLifetime
            ? "border-accent/40 bg-card/90 shadow-lg shadow-accent/10 hover:shadow-xl hover:shadow-accent/15"
            : isCurrent
            ? "border-primary/30 bg-card/90 ring-2 ring-primary/20"
            : "border-border/40 bg-card/80 hover:border-border/60 hover:shadow-md"
        }`}
      >
        {/* Top badge */}
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
