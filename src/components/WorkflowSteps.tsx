import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, FlaskConical, Sparkles, CheckCircle, ArrowRight } from "lucide-react";

const steps = [
  {
    number: 1,
    label: "Analisar",
    description: "Dados históricos, padrões e frequências",
    icon: Search,
    url: "/estatisticas",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/20",
  },
  {
    number: 2,
    label: "Simular",
    description: "Teste estratégias contra sorteios reais",
    icon: FlaskConical,
    url: "/simulacoes",
    color: "text-primary",
    bgColor: "bg-primary/10 border-primary/20",
  },
  {
    number: 3,
    label: "Gerar",
    description: "Crie jogos com IA e múltiplas estratégias",
    icon: Sparkles,
    url: "/gerador",
    color: "text-primary",
    bgColor: "bg-primary/10 border-primary/20",
  },
  {
    number: 4,
    label: "Validar",
    description: "Confira desempenho e otimize suas apostas",
    icon: CheckCircle,
    url: "/ai-analyst",
    color: "text-accent",
    bgColor: "bg-accent/10 border-accent/20",
  },
];

export function WorkflowSteps() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {steps.map((step, i) => (
        <motion.div
          key={step.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <Link
            to={step.url}
            className={`group relative flex flex-col gap-2 rounded-xl border p-4 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg ${step.bgColor}`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-bold ${step.color}`}>
                0{step.number}
              </span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${step.bgColor}`}>
                <step.icon className={`w-3.5 h-3.5 ${step.color}`} />
              </div>
            </div>
            <div>
              <p className={`text-sm font-bold ${step.color}`}>{step.label}</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                {step.description}
              </p>
            </div>
            <ArrowRight className={`w-3.5 h-3.5 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity ${step.color}`} />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
