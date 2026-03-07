import { Feature, usePlanAccess } from "@/hooks/usePlanAccess";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface PlanGateProps {
  feature: Feature;
  children: React.ReactNode;
  fallbackMessage?: string;
}

const PLAN_LABELS = { free: "Gratuito", premium: "Premium", professional: "Profissional" };

export function PlanGate({ feature, children, fallbackMessage }: PlanGateProps) {
  const { hasAccess, getMinPlan } = usePlanAccess();

  if (hasAccess(feature)) return <>{children}</>;

  const required = getMinPlan(feature);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card className="border-dashed border-border/30 glass-card overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] to-accent/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4 relative">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              {fallbackMessage || "Recurso bloqueado"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Disponível a partir do plano{" "}
              <span className="font-bold text-accent">{PLAN_LABELS[required]}</span>
            </p>
          </div>
          <Link to="/planos">
            <Button variant="outline" className="gap-2 border-accent/20 hover:border-accent/40 hover:bg-accent/5 text-accent transition-colors">
              <Crown className="w-4 h-4" />
              Ver planos
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
