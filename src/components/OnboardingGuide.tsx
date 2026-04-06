import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Brain,
  FlaskConical,
  Sparkles,
  Target,
  ChevronRight,
  ChevronLeft,
  Rocket,
  Shield,
  Layers,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OnboardingStep {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  features: string[];
}

const steps: OnboardingStep[] = [
  {
    icon: Rocket,
    iconColor: "text-primary",
    title: "Bem-vindo ao Titan Loterias!",
    description:
      "A plataforma mais avançada de inteligência para loterias brasileiras. Análise estatística, IA e simulação — tudo para decisões mais inteligentes.",
    features: [
      "Dados oficiais sincronizados com a Caixa",
      "Sem promessas de ganho — só dados e lógica",
      "Funciona com todas as loterias brasileiras",
    ],
  },
  {
    icon: BarChart3,
    iconColor: "text-chart-1",
    title: "1. Analise os Dados",
    description:
      "O Dashboard mostra estatísticas reais de milhares de sorteios: frequência, atraso, paridade, distribuição por faixa e muito mais.",
    features: [
      "Heatmap de frequência das dezenas",
      "Gráfico de atraso e tendências",
      "Distribuição de somas e paridade",
    ],
  },
  {
    icon: FlaskConical,
    iconColor: "text-chart-2",
    title: "2. Simule Estratégias",
    description:
      "Teste suas ideias contra sorteios passados antes de apostar de verdade. Monte Carlo, backtesting e comparador de estratégias.",
    features: [
      "Simulação Monte Carlo com milhões de cenários",
      "Backtesting com resultados reais",
      "Ranking de estratégias por performance",
    ],
  },
  {
    icon: Sparkles,
    iconColor: "text-chart-3",
    title: "3. Gere Jogos Otimizados",
    description:
      "O gerador usa IA e filtros avançados para criar combinações com score de qualidade, cobertura combinatória e fechamentos profissionais.",
    features: [
      "Gerador com 14+ algoritmos integrados",
      "Fechamentos que reduzem custo",
      "Score de qualidade antes de apostar",
    ],
  },
  {
    icon: Target,
    iconColor: "text-chart-4",
    title: "4. Valide e Confira",
    description:
      "Confira seus jogos contra os resultados, salve apostas e acompanhe sua evolução com o dashboard de ROI.",
    features: [
      "Conferidor automático de apostas",
      "Histórico de jogos salvos",
      "Dashboard de retorno sobre investimento",
    ],
  },
];

const ONBOARDING_KEY = "titan_onboarding_completed";

export function OnboardingGuide() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
  };

  const handleStartExploring = () => {
    handleComplete();
    navigate("/");
  };

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleSkip(); }}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border-primary/20">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Icon className={`w-8 h-8 ${step.iconColor}`} />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-center text-foreground mb-2">
                {step.title}
              </h2>

              {/* Description */}
              <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
                {step.description}
              </p>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {step.features.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 + 0.15 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Shield className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-foreground/80">{feature}</span>
                  </motion.div>
                ))}
              </div>

              {/* Step indicator */}
              <div className="flex justify-center gap-1.5 mb-6">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? "w-6 bg-primary"
                        : i < currentStep
                        ? "w-1.5 bg-primary/40"
                        : "w-1.5 bg-muted-foreground/20"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            {isFirst ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                Pular
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep((s) => s - 1)}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Voltar
              </Button>
            )}

            {isLast ? (
              <Button
                onClick={handleStartExploring}
                className="gradient-brand text-primary-foreground gap-2 px-6"
              >
                Começar a Explorar <Rocket className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentStep((s) => s + 1)}
                className="gap-1 px-5"
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
