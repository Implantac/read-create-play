import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, Sparkles, ArrowRight, Save, Infinity, Loader2, Settings, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const plans = [
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
    highlight: false,
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
    highlight: false,
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
    highlight: false,
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
      if (data?.url) {
        window.open(data.url, "_blank");
      }
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
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (e: any) {
      toast.error("Erro ao abrir portal: " + (e.message || "Tente novamente"));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      <PageHeader
        title="Planos"
        description="Desbloqueie todo o poder do motor estatístico e algoritmos de IA"
        icon={Crown}
      />

      {currentPlan !== "free" && (
        <div className="flex justify-end">
          <Button variant="outline" className="gap-2" onClick={handleManageSubscription} disabled={loadingPlan === "manage"}>
            {loadingPlan === "manage" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
            Gerenciar assinatura
          </Button>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, i) => {
          const isCurrent = currentPlan === plan.id;
          const isUpgrade = plan.id !== "free" && !isCurrent;
          const isLoading = loadingPlan === plan.id;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40, rotateY: i % 2 === 0 ? 8 : -8, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
              transition={{ delay: i * 0.12, duration: 0.6, type: "spring", stiffness: 80, damping: 15 }}
            >
              <Card
                className={`relative flex flex-col h-full overflow-hidden group/card ${
                  plan.highlight
                    ? "border-primary/40 glow-green glass-card"
                    : plan.isLifetime
                    ? "border-neon-amber/40 glass-card shadow-lg shadow-neon-amber/10"
                    : isCurrent
                    ? "border-primary/30 glass-card ring-2 ring-primary/20"
                    : "border-border/30 glass-card"
                }`}
              >
                <div className="relative z-[3] flex flex-col h-full">
                  {plan.highlight && !isCurrent && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-brand text-primary-foreground border-0 shadow-lg shadow-primary/20">
                      Mais popular
                    </Badge>
                  )}
                  {plan.isLifetime && !isCurrent && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neon-amber text-background border-0 shadow-lg shadow-neon-amber/20">
                      Pagamento único
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-0">
                      Seu plano
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                      plan.highlight ? "gradient-brand shadow-lg shadow-primary/20" : plan.isLifetime ? "bg-neon-amber/20 border border-neon-amber/30" : "bg-muted/50 border border-border/30"
                    }`}>
                      <plan.icon className={`w-6 h-6 ${plan.highlight ? "text-primary-foreground" : plan.isLifetime ? "text-neon-amber" : "text-primary"}`} />
                    </div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription className="text-xs">{plan.description}</CardDescription>
                    <div className="mt-3">
                      <span className="text-3xl font-bold text-foreground font-mono">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-xs font-medium ${
                      plan.id === "free"
                        ? "bg-destructive/10 text-destructive border border-destructive/20"
                        : "bg-primary/10 text-primary border border-primary/20"
                    }`}>
                      <Save className="w-3.5 h-3.5 shrink-0" />
                      {plan.savedBetsLimit}
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                          <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 text-primary" />
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={`w-full gap-2 ${
                        plan.highlight && isUpgrade
                          ? "gradient-brand text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30"
                          : plan.isLifetime && isUpgrade
                          ? "bg-neon-amber text-background hover:bg-neon-amber/90 shadow-lg shadow-neon-amber/20"
                          : ""
                      }`}
                      variant={isCurrent ? "secondary" : plan.highlight ? "default" : "outline"}
                      disabled={isCurrent || plan.id === "free" || isLoading}
                      onClick={() => isUpgrade && handleCheckout(plan.id)}
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
        })}
      </div>

      <div className="mt-12 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Perguntas Frequentes</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-2">
          {[
            { q: "Como funciona o período de teste?", a: "Você pode usar o plano Gratuito sem limite de tempo. Ao assinar um plano pago, você terá acesso imediato a todas as funcionalidades do plano escolhido." },
            { q: "Posso trocar de plano a qualquer momento?", a: "Sim! Você pode fazer upgrade ou downgrade do seu plano quando quiser. Ao fazer upgrade, a diferença será cobrada proporcionalmente. Ao fazer downgrade, o novo valor será aplicado no próximo ciclo de cobrança." },
            { q: "Como cancelo minha assinatura?", a: "Você pode cancelar a qualquer momento clicando em \"Gerenciar assinatura\" nesta página. O cancelamento é imediato, mas você mantém o acesso até o final do período já pago." },
            { q: "O plano Vitalício inclui atualizações futuras?", a: "Sim! O plano Vitalício garante acesso permanente a todas as funcionalidades atuais e futuras da plataforma, sem nenhum custo adicional." },
            { q: "Quais formas de pagamento são aceitas?", a: "Aceitamos cartões de crédito e débito (Visa, Mastercard, Elo, American Express) e Pix, tudo processado de forma segura pelo Stripe." },
            { q: "Posso solicitar reembolso?", a: "Sim, oferecemos reembolso integral em até 7 dias após a compra, sem perguntas. Basta entrar em contato com nosso suporte." },
          ].map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border border-border/30 rounded-lg px-4 glass-card">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
