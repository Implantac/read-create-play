import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, FlaskConical, Sparkles, CheckCircle, ArrowRight } from "lucide-react";

const steps = [
  {
    number: 1,
    label: "Analisar",
    description: "Explore padrões estatísticos",
    icon: Search,
    url: "/estatisticas",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    number: 2,
    label: "Simular",
    description: "Valide suas estratégias",
    icon: FlaskConical,
    url: "/simulacoes",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    number: 3,
    label: "Gerar",
    description: "Crie jogos otimizados",
    icon: Sparkles,
    url: "/gerador",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    number: 4,
    label: "Validar",
    description: "Performance em tempo real",
    icon: CheckCircle,
    url: "/ai-analyst",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
];

export function WorkflowSteps() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {steps.map((step, i) => (
        <motion.div
          key={step.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Link
            to={step.url}
            className="group relative flex flex-col gap-4 rounded-2xl bg-muted/20 border border-border/40 p-5 transition-all duration-300 hover:bg-muted/30 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 h-full overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 w-16 h-16 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <step.icon className="w-full h-full" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${step.bg} border border-white/5 shadow-inner`}>
                <step.icon className={`w-5 h-5 ${step.color}`} />
              </div>
              <span className="text-[10px] font-black font-mono text-muted-foreground/40 tracking-widest">
                STEP 0{step.number}
              </span>
            </div>
            
            <div>
              <p className="text-sm font-black text-foreground tracking-tight uppercase group-hover:text-primary transition-colors">
                {step.label}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-1">
                {step.description}
              </p>
            </div>
            
            <div className="mt-auto pt-2 flex items-center gap-1 text-[9px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
              Acessar <ArrowRight className="w-2.5 h-2.5" />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
