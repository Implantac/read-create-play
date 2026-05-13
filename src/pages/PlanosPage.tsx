import { Crown, Infinity, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PlanCard, type PlanData } from "@/components/plans/PlanCard";
import { PlanFAQ } from "@/components/plans/PlanFAQ";
import { PlanTrustBar } from "@/components/plans/PlanTrustBar";
import { PlanComparisonTable } from "@/components/plans/PlanComparisonTable";
import { refineError } from "@/lib/error-handler";

const basePlans = [
  {
    id: "lifetime",
    name: "Vitalício",
    price: "R$ 79,90",
    period: " único",
    icon: Infinity,
    description: "Pague uma vez, use para sempre. Acesso completo a todas as ferramentas.",
    savedBetsLimit: "Jogos salvos ilimitados",
    features: [
      "Todas as 8 loterias",
      "IA + Machine Learning",
      "Gerador Profissional com 14+ filtros",
      "Backtesting contra histórico real",
      "Acesso vitalício garantido",
      "Todas as atualizações futuras incluídas",
      "Sem mensalidades nunca mais",
      "Suporte prioritário",
    ],
    cta: "Garantir acesso vitalício",
    isLifetime: true,
    highlight: true,
  },
];

export default function PlanosPage() {
  const { profile, session } = useAuth();
  const currentPlan = profile?.plan ?? "free";
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const navigate = useNavigate();

  const plans: PlanData[] = basePlans.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    period: p.period,
    icon: p.icon,
    description: p.description,
    savedBetsLimit: p.savedBetsLimit,
    features: p.features,
    cta: p.cta,
    highlight: p.highlight,
    isLifetime: p.isLifetime,
  }));

  const handleCheckout = async (planId: string) => {
    if (!session) {
      navigate("/login");
      return;
    }

    setLoadingPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      const refined = refineError(e);
      toast.error(`${refined.title}: ${refined.description} ${refined.recommendation}`);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!session) return;
    setLoadingPlan("manage");
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      const refined = refineError(e);
      toast.error(`${refined.title}: ${refined.description} ${refined.recommendation}`);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-16">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center pt-8 pb-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5">
          <Crown className="w-3.5 h-3.5" />
          Plano Vitalício
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-3">
          Pare de apostar no escuro.{" "}
          <span className="gradient-brand-text">Use inteligência.</span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-3">
          Acesso vitalício ao Titan Loterias. Pague uma vez e tenha todas as ferramentas de IA para sempre.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold">
          🔥 Oferta especial por tempo limitado
        </div>
      </motion.div>

      {/* Manage subscription */}
      {currentPlan !== "free" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center mb-8"
        >
          <Button variant="outline" className="gap-2" onClick={handleManageSubscription} disabled={loadingPlan === "manage"}>
            {loadingPlan === "manage" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
            Gerenciar acesso
          </Button>
        </motion.div>
      )}

      {/* Grid container for centered single card */}
      <div className="flex justify-center mb-12">
        <div className="w-full max-w-md">
          {plans.map((plan, i) => {
            const isCurrent = currentPlan === plan.id;
            const isUpgrade = plan.id !== "free" && !isCurrent;
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={i}
                isCurrent={isCurrent}
                isUpgrade={isUpgrade}
                isLoading={loadingPlan === plan.id}
                onCheckout={handleCheckout}
              />
            );
          })}
        </div>
      </div>

      {/* Trust Bar */}
      <PlanTrustBar />

      {/* Comparison Table */}
      <PlanComparisonTable />

      {/* FAQ */}
      <PlanFAQ />
    </div>
  );
}
