import { Feature, usePlanAccess } from "@/hooks/usePlanAccess";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
    <Card className="border-dashed border-border/50 bg-card/30">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {fallbackMessage || "Recurso bloqueado"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Disponível a partir do plano{" "}
            <span className="font-bold text-accent">{PLAN_LABELS[required]}</span>
          </p>
        </div>
        <Link to="/planos">
          <Button variant="outline" className="gap-2">
            <Crown className="w-4 h-4" />
            Ver planos
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
