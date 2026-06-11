import { motion, MotionValue } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Layers, Sparkles, Clipboard, BarChart3, Box, MessageSquare } from "lucide-react";

interface FeaturesSectionProps {
  featuresRef: React.RefObject<HTMLDivElement>;
  featuresRotateX: MotionValue<number>;
  fadeUp: any;
}

const colorMap = {
  green: "hover:border-primary/50 group-hover:shadow-primary/10",
  blue: "hover:border-neon-blue/50 group-hover:shadow-neon-blue/10",
  amber: "hover:border-accent/50 group-hover:shadow-accent/10",
  red: "hover:border-neon-red/50 group-hover:shadow-neon-red/10",
  purple: "hover:border-neon-purple/50 group-hover:shadow-neon-purple/10",
  cyan: "hover:border-neon-cyan/50 group-hover:shadow-neon-cyan/10",
};

export function FeaturesSection({ featuresRef, featuresRotateX, fadeUp }: FeaturesSectionProps) {
  const { t } = useTranslation();

  const features = [
    {
      icon: Layers,
      title: "Análise Histórica Avançada",
      description: "Processamos milhões de dados de concursos oficiais para identificar tendências de frequência, atraso e distribuição.",
      color: "green" as const,
    },
    {
      icon: Sparkles,
      title: "Titan AI Core",
      description: "Nossa rede neural aplica modelos matemáticos complexos para detectar padrões ocultos que desafiam a sorte comum.",
      color: "blue" as const,
    },
    {
      icon: Clipboard,
      title: "Motor de Probabilidade",
      description: "Geramos apostas estratégicas com base em modelos de Fibonacci, Monte Carlo e Cadeias de Markov.",
      color: "amber" as const,
    },
    {
      icon: BarChart3,
      title: "Simulador de Performance",
      description: "Execute sua estratégia contra concursos passados e descubra o ROI teórico e a eficiência real antes de apostar.",
      color: "red" as const,
    },
    {
      icon: Box,
      title: "Laboratório de Estratégias",
      description: "Acesse uma biblioteca profissional de fechamentos, distribuições balanceadas e estratégias proprietárias.",
      color: "purple" as const,
    },
    {
      icon: MessageSquare,
      title: "Sincronização Oficial",
      description: "Dados coletados e atualizados em tempo real diretamente das fontes oficiais, garantindo 100% de precisão.",
      color: "cyan" as const,
    },
  ];

  return (
    <section ref={featuresRef} className="py-24 md:py-40 relative" style={{ perspective: "1200px" }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(160,84,45,0.05),transparent)] pointer-events-none" />
      <motion.div style={{ rotateX: featuresRotateX }} className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-24 space-y-4">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
            CENTRO DE <span className="gradient-brand-text">INTELIGÊNCIA</span> TITAN
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-medium text-lg opacity-70">
            O sistema abandona qualquer aparência de simples gerador e se posiciona como uma Plataforma de Inteligência Estatística para Loterias Brasileiras.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} whileHover={{ y: -12, scale: 1.02 }} className={`relative rounded-[2rem] glass-card border border-white/10 p-10 transition-all duration-500 hover:shadow-2xl ${colorMap[f.color]} group overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
              <div className="w-16 h-16 rounded-2xl bg-background/50 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:border-primary/30 transition-all duration-500 shadow-inner relative z-10">
                <f.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-foreground uppercase tracking-tight italic mb-4">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium opacity-80">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
