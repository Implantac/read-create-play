import { Feature, usePlanAccess } from "@/hooks/usePlanAccess";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Crown, ArrowRight, Sparkles, TrendingUp, Brain, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface PlanGateProps {
  feature: Feature;
  children: React.ReactNode;
  fallbackMessage?: string;
}

const PLAN_LABELS = { free: "Gratuito", lifetime: "Vitalício", elite: "Elite Cloud" };

const FEATURE_BENEFITS: Record<string, { title: string; benefit: string; icon: React.ElementType }> = {
  gerador_profissional: {
    title: "Gerador Profissional",
    benefit: "Gere jogos com filtros avançados, score de qualidade e 14+ algoritmos integrados",
    icon: Sparkles,
  },
  gerador_avancado: {
    title: "Gerador Avançado",
    benefit: "Acesse combinações otimizadas com IA e análise de padrões históricos",
    icon: Brain,
  },
  fechamentos: {
    title: "Fechamentos Inteligentes",
    benefit: "Reduza custos cobrindo mais combinações com menos jogos",
    icon: Shield,
  },
  simulacoes: {
    title: "Simulador Completo",
    benefit: "Teste estratégias contra milhares de sorteios antes de apostar",
    icon: TrendingUp,
  },
  simulacoes_avancadas: {
    title: "Simulação Monte Carlo",
    benefit: "Execute milhões de cenários para validar sua estratégia",
    icon: TrendingUp,
  },
  estrategias_ml: {
    title: "Machine Learning",
    benefit: "Modelos preditivos treinados com dados reais de sorteios",
    icon: Brain,
  },
  estrategias_hp: {
    title: "Motor HP Matemático",
    benefit: "Otimização avançada com algoritmos genéticos e simulated annealing",
    icon: Brain,
  },
  ia_autonoma: {
    title: "IA Autônoma",
    benefit: "Assistente inteligente que aprende com seus padrões de jogo",
    icon: Brain,
  },
  ai_analyst: {
    title: "Analista IA",
    benefit: "Análise profunda com explicações detalhadas de cada recomendação",
    icon: Brain,
  },
  export_pdf: {
    title: "Exportação PDF",
    benefit: "Exporte seus jogos em formato profissional pronto para impressão",
    icon: Sparkles,
  },
  roi_dashboard: {
    title: "Dashboard de ROI",
    benefit: "Acompanhe seu retorno sobre investimento e evolução",
    icon: TrendingUp,
  },
};

export function PlanGate({ feature, children, fallbackMessage }: PlanGateProps) {
  const { hasAccess, getMinPlan } = usePlanAccess();

  if (hasAccess(feature)) return <>{children}</>;

  const required = getMinPlan(feature);
  const featureInfo = FEATURE_BENEFITS[feature];
  const Icon = featureInfo?.icon || Lock;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="border-dashed border-primary/20 overflow-hidden relative group hover:border-primary/40 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-accent/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-4 relative">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-base font-semibold text-foreground">
              {featureInfo?.title || fallbackMessage || "Recurso Exclusivo"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {featureInfo?.benefit || `Disponível a partir do plano ${PLAN_LABELS[required]}`}
            </p>
          </div>
          <Link to="/planos">
            <Button className="gap-2 gradient-brand text-primary-foreground shadow-md shadow-primary/20 mt-1">
              <Crown className="w-4 h-4" />
              Ativar Acesso Vitalício
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            Pagamento único • R$ 79,90
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
