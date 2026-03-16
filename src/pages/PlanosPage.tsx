import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, Sparkles, ArrowRight, Save, Infinity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { motion } from "framer-motion";

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
  const { profile } = useAuth();
  const currentPlan = profile?.plan ?? "free";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planos"
        description="Desbloqueie todo o poder do motor estatístico e algoritmos de IA"
        icon={Crown}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, i) => {
          const isCurrent = currentPlan === plan.id;
          const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;
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
            if (glowEl) glowEl.style.opacity = '0';
          };
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40, rotateY: i % 2 === 0 ? 8 : -8, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
              transition={{ delay: i * 0.12, duration: 0.6, type: "spring", stiffness: 80, damping: 15 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ transition: "transform 0.15s ease-out", transformStyle: "preserve-3d" }}
            >
              <Card
                className={`relative flex flex-col h-full overflow-hidden group/card ${
                  plan.highlight
                    ? "border-primary/40 glow-green glass-card"
                    : (plan as any).isLifetime
                    ? "border-neon-amber/40 glass-card shadow-lg shadow-neon-amber/10"
                    : "border-border/30 glass-card"
                }`}
              >
                {/* Animated border glow */}
                <div className="pointer-events-none absolute -inset-[1px] rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 z-0"
                  style={{
                    background: 'conic-gradient(from var(--border-angle, 0deg), hsl(var(--primary) / 0.6), hsl(var(--neon-blue) / 0.6), hsl(var(--neon-purple) / 0.4), hsl(var(--primary) / 0.6))',
                    animation: 'border-rotate 3s linear infinite',
                  }}
                />
                <div className="pointer-events-none absolute inset-[1px] rounded-[calc(var(--radius)-1px)] bg-card z-[1] opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                <div data-glow className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 z-[2]" />
                <div className="relative z-[3] flex flex-col h-full">
                {plan.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-brand text-primary-foreground border-0 shadow-lg shadow-primary/20">
                    Mais popular
                  </Badge>
                )}
                {(plan as any).isLifetime && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neon-amber text-background border-0 shadow-lg shadow-neon-amber/20">
                    Pagamento único
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                    plan.highlight ? "gradient-brand shadow-lg shadow-primary/20" : (plan as any).isLifetime ? "bg-neon-amber/20 border border-neon-amber/30 shadow-lg shadow-neon-amber/10" : "bg-muted/50 border border-border/30"
                  }`}>
                    <plan.icon className={`w-6 h-6 ${plan.highlight ? "text-primary-foreground" : (plan as any).isLifetime ? "text-neon-amber" : "text-primary"}`} />
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
                      plan.highlight && !isCurrent
                        ? "gradient-brand text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30"
                        : (plan as any).isLifetime && !isCurrent
                        ? "bg-neon-amber text-background hover:bg-neon-amber/90 shadow-lg shadow-neon-amber/20"
                        : ""
                    }`}
                    variant={isCurrent ? "secondary" : plan.highlight ? "default" : "outline"}
                    disabled={isCurrent}
                  >
                    {isCurrent ? "Plano atual" : plan.cta}
                    {!isCurrent && <ArrowRight className="w-4 h-4" />}
                  </Button>
                </CardFooter>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
