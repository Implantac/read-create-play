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

const plans: PlanData[] = [
  {
    id: "free",
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    icon: Zap,
    description: "Motor estatístico básico",
    savedBetsLimit: "3 jogos salvos por loteria",
    features: [
      "Dashboard com estatísticas",
      "Gerador básico de números",
      "Histórico de concursos",
      "Conferidor de apostas",
    ],
    cta: "Plano atual",
  },
  {
    id: "premium",
    name: "Premium",
    price: "R$ 29,90",
    period: "/mês",
    icon: Sparkles,
    description: "Ferramentas avançadas de geração",
    savedBetsLimit: "Jogos salvos ilimitados",
    features: [
      "Tudo do plano Gratuito",
      "Gerador Profissional com filtros",
      "Fechamentos inteligentes",
      "Simulador massivo",
      "Exportação PDF profissional",
    ],
    cta: "Assinar Premium",
    highlight: true,
  },
  {
    id: "professional",
    name: "Profissional",
    price: "R$ 59,90",
    period: "/mês",
    icon: Crown,
    description: "IA + Otimização completa",
    savedBetsLimit: "Jogos salvos ilimitados",
    features: [
      "Tudo do plano Premium",
      "Machine Learning preditivo",
      "Motor HP Matemático",
      "Analytics avançado",
      "Algoritmo Genético + Simulated Annealing",
      "Suporte prioritário",
    ],
    cta: "Assinar Profissional",
  },
  {
    id: "lifetime",
    name: "Vitalício",
    price: "R$ 497",
    period: " único",
    icon: Infinity,
    description: "Acesso permanente a tudo",
    savedBetsLimit: "Jogos salvos ilimitados",
    features: [
      "Tudo do plano Profissional",
      "Acesso vitalício garantido",
      "Todas as atualizações futuras",
      "Prioridade máxima no suporte",
      "Sem mensalidades nunca mais",
      "Acesso antecipado a novidades",
    ],
    cta: "Comprar Vitalício",
    isLifetime: true,
  },
];

export default function PlanosPage() {
  const { profile, session } = useAuth();
  const currentPlan = profile?.plan ?? "free";
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const navigate = useNavigate();

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
      toast.error("Erro ao iniciar checkout: " + (e.message || "Tente novamente"));
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
      toast.error("Erro ao abrir portal: " + (e.message || "Tente novamente"));
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
        className="text-center pt-8 pb-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5">
          <Crown className="w-3.5 h-3.5" />
          Escolha seu plano
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-3">
          Desbloqueie o poder da{" "}
          <span className="gradient-brand-text">análise inteligente</span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
          Motor estatístico, IA preditiva e algoritmos avançados para maximizar suas chances
        </p>
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
