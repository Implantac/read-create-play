import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    id: "free",
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    icon: Zap,
    description: "Motor estatístico básico",
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
];

export default function PlanosPage() {
  const { profile } = useAuth();
  const currentPlan = profile?.plan ?? "free";

  return (
    <div className="min-h-screen bg-background gradient-mesh py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Desbloqueie todo o poder do motor estatístico e algoritmos de IA para maximizar suas chances.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.highlight
                    ? "border-primary/50 glow-green bg-card/90"
                    : "border-border/50 bg-card/60"
                }`}
              >
                {plan.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Mais popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <div className="mx-auto w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <plan.icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-3">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "secondary" : plan.highlight ? "default" : "outline"}
                    disabled={isCurrent}
                  >
                    {isCurrent ? "Plano atual" : plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
