import { Crown, Zap, Sparkles, Infinity, Settings, Loader2 } from "lucide-react";
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
    id: "free",
    name: "Gratuito",
    monthlyPrice: "R$ 0",
    annualPrice: "R$ 0",
    period: "/mês",
    annualPeriod: "/mês",
    icon: Zap,
    description: "Explore a plataforma e descubra o poder dos dados",
    savedBetsLimit: "3 jogos salvos por loteria",
    features: [
      "Dashboard com estatísticas reais",
      "Gerador básico com análise de frequência",
      "Histórico completo de concursos",
      "Conferidor automático de apostas",
    ],
    cta: "Plano atual",
  },
  {
    id: "premium",
    annualId: "premium_annual",
    name: "Premium",
    monthlyPrice: "R$ 29,90",
    annualPrice: "R$ 23,92",
    annualTotal: "R$ 287,00/ano",
    period: "/mês",
    annualPeriod: "/mês",
    icon: Sparkles,
    description: "Para quem quer jogar com estratégia real",
    savedBetsLimit: "Jogos salvos ilimitados",
    features: [
      "Tudo do plano Gratuito",
      "Gerador Profissional com 14+ filtros",
      "Fechamentos que reduzem custos em até 80%",
      "Simulador com milhões de cenários",
      "Exportação PDF pronta para lotérica",
    ],
    cta: "Começar 7 dias grátis",
    highlight: true,
  },
  {
    id: "professional",
    annualId: "professional_annual",
    name: "Profissional",
    monthlyPrice: "R$ 59,90",
    annualPrice: "R$ 47,92",
    annualTotal: "R$ 575,00/ano",
    period: "/mês",
    annualPeriod: "/mês",
    icon: Crown,
    description: "IA preditiva + otimização de nível avançado",
    savedBetsLimit: "Jogos salvos ilimitados",
    features: [
      "Tudo do plano Premium",
      "Machine Learning com dados de 10.000+ sorteios",
      "Motor HP com Algoritmo Genético",
      "Analytics profundo + padrões ocultos",
      "Comparador avançado de estratégias",
      "Suporte prioritário",
    ],
    cta: "Começar 7 dias grátis",
  },
  {
    id: "lifetime",
    name: "Vitalício",
    monthlyPrice: "R$ 497",
    annualPrice: "R$ 497",
    period: " único",
    annualPeriod: " único",
    icon: Infinity,
    description: "Pague uma vez, use para sempre",
    savedBetsLimit: "Jogos salvos ilimitados",
    features: [
      "Tudo do plano Profissional",
      "Acesso vitalício garantido por contrato",
      "Todas as atualizações futuras incluídas",
      "Prioridade máxima no suporte",
      "Sem mensalidades nunca mais",
      "Acesso antecipado a novos recursos",
    ],
    cta: "Garantir acesso vitalício",
    isLifetime: true,
  },
];

export default function PlanosPage() {
  const { profile, session } = useAuth();
  const currentPlan = profile?.plan ?? "free";
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const navigate = useNavigate();

  const plans: PlanData[] = basePlans.map((p) => ({
    id: p.id,
    name: p.name,
    price: billingCycle === "annual" ? p.annualPrice : p.monthlyPrice,
    period: billingCycle === "annual" ? p.annualPeriod : p.period,
    icon: p.icon,
    description: p.description,
    savedBetsLimit: p.savedBetsLimit,
    features: p.features,
    cta: p.cta,
    highlight: p.highlight,
    isLifetime: p.isLifetime,
    annualTotal: billingCycle === "annual" ? (p as any).annualTotal : undefined,
  }));

  const handleCheckout = async (planId: string) => {
    if (!session) {
      navigate("/login");
      return;
    }

    // Map to annual variant if annual billing selected
    let checkoutPlanId = planId;
    if (billingCycle === "annual" && (planId === "premium" || planId === "professional")) {
      const base = basePlans.find((p) => p.id === planId);
      checkoutPlanId = (base as any)?.annualId || planId;
    }

    setLoadingPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planId: checkoutPlanId },
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
          Escolha seu plano
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-3">
          Pare de apostar no escuro.{" "}
          <span className="gradient-brand-text">Use inteligência.</span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-3">
          Motor estatístico, IA preditiva e algoritmos avançados — tudo para você tomar decisões melhores.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold animate-pulse">
          🔥 7 dias grátis em todos os planos pagos — sem cartão
        </div>
      </motion.div>

      {/* Billing Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="flex justify-center mb-8"
      >
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted/50 border border-border/30">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              billingCycle === "monthly"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 relative ${
              billingCycle === "annual"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Anual
            <span className="absolute -top-2.5 -right-3 px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold leading-none">
              -20%
            </span>
          </button>
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
            Gerenciar assinatura
          </Button>
        </motion.div>
      )}

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
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

      {/* Trust Bar */}
      <PlanTrustBar />

      {/* Comparison Table */}
      <PlanComparisonTable />

      {/* FAQ */}
      <PlanFAQ />
    </div>
  );
}
