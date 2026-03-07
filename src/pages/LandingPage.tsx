import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Zap,
  BarChart3,
  Brain,
  Shield,
  TrendingUp,
  Target,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Dices,
  Star,
  CheckCircle,
  Users,
  Database,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const features = [
  {
    icon: BarChart3,
    title: "Análise Estatística",
    description: "Frequência, atraso, paridade, soma e distribuição por faixa de todos os sorteios históricos.",
    color: "green" as const,
  },
  {
    icon: Brain,
    title: "Inteligência Artificial",
    description: "Modelos de ML e redes neurais que identificam padrões ocultos nos resultados.",
    color: "blue" as const,
  },
  {
    icon: Target,
    title: "Gerador Profissional",
    description: "Gere apostas otimizadas com algoritmos genéticos, simulated annealing e Monte Carlo.",
    color: "amber" as const,
  },
  {
    icon: TrendingUp,
    title: "Backtesting",
    description: "Teste suas estratégias contra todo o histórico e veja a performance real.",
    color: "red" as const,
  },
  {
    icon: Dices,
    title: "Simulação Massiva",
    description: "Simule milhões de jogos em segundos e descubra probabilidades reais.",
    color: "purple" as const,
  },
  {
    icon: Shield,
    title: "Banco de Dados Completo",
    description: "Todos os sorteios da Caixa sincronizados automaticamente em tempo real.",
    color: "cyan" as const,
  },
];

const colorMap = {
  green: "from-primary/20 to-primary/5 border-primary/20 text-primary",
  blue: "from-neon-blue/20 to-neon-blue/5 border-neon-blue/20 text-neon-blue",
  amber: "from-accent/20 to-accent/5 border-accent/20 text-accent",
  red: "from-neon-red/20 to-neon-red/5 border-neon-red/20 text-neon-red",
  purple: "from-neon-purple/20 to-neon-purple/5 border-neon-purple/20 text-neon-purple",
  cyan: "from-neon-cyan/20 to-neon-cyan/5 border-neon-cyan/20 text-neon-cyan",
};

const lotteries = ["Mega-Sena", "Lotofácil", "Quina", "Lotomania", "Dupla Sena", "Timemania"];

const stats = [
  { value: "10.000+", label: "Sorteios analisados" },
  { value: "6", label: "Loterias suportadas" },
  { value: "12+", label: "Algoritmos de IA" },
  { value: "99.9%", label: "Uptime" },
];

const plans = [
  {
    name: "Grátis",
    price: "R$ 0",
    period: "/mês",
    features: ["Dashboard básico", "Frequência e atraso", "1 loteria", "Gerador simples"],
    cta: "Começar Grátis",
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$ 29",
    period: "/mês",
    features: [
      "Todas as loterias",
      "IA e Machine Learning",
      "Gerador profissional",
      "Backtesting completo",
      "Simulação massiva",
      "Suporte prioritário",
    ],
    cta: "Assinar Pro",
    highlight: true,
  },
  {
    name: "Titan",
    price: "R$ 59",
    period: "/mês",
    features: [
      "Tudo do Pro",
      "Motor HP exclusivo",
      "Algoritmos genéticos",
      "Otimizador combinatorial",
      "API dedicada",
      "Consultoria personalizada",
    ],
    cta: "Assinar Titan",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-border/30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Titan <span className="text-primary text-glow-green">Loterias</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Entrar
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gradient-brand text-primary-foreground shadow-lg shadow-primary/20 gap-1.5">
                Criar Conta <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 gradient-mesh">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <motion.div custom={0} variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Motor Estatístico v4.0 + IA
            </motion.div>

            <motion.h1 custom={1} variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Análise de loterias{" "}
              <span className="gradient-brand-text">com inteligência artificial</span>
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A plataforma mais avançada do Brasil para análise estatística, geração de apostas e simulação de loterias.
              Algoritmos de Machine Learning analisando milhares de sorteios.
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link to="/signup">
                <Button size="lg" className="gradient-brand text-primary-foreground shadow-xl shadow-primary/25 gap-2 text-base px-8 h-12">
                  Começar Grátis <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12 border-border/50 hover:border-primary/30 hover:text-primary">
                  Já tenho conta
                </Button>
              </Link>
            </motion.div>

            {/* Supported lotteries */}
            <motion.div custom={4} variants={fadeUp} className="pt-8 flex flex-wrap items-center justify-center gap-2">
              {lotteries.map((name) => (
                <span key={name} className="px-3 py-1 rounded-full bg-muted/50 border border-border/30 text-xs font-medium text-muted-foreground">
                  {name}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/30 bg-card/30 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl md:text-3xl font-bold font-mono gradient-brand-text">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Tudo que você precisa para{" "}
              <span className="gradient-brand-text">jogar melhor</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ferramentas profissionais de análise e geração de apostas, alimentadas por dados reais e inteligência artificial.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`rounded-xl bg-gradient-to-b ${colorMap[f.color]} border p-6 hover:translate-y-[-2px] transition-transform duration-300`}
              >
                <f.icon className="w-8 h-8 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28 bg-card/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Como funciona
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Em 3 passos simples, comece a usar o poder da análise estatística.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", icon: Database, title: "Dados Sincronizados", desc: "Todos os sorteios históricos são importados automaticamente da API da Caixa." },
              { step: "02", icon: Brain, title: "IA Analisa", desc: "Nossos algoritmos de Machine Learning processam padrões, frequências e tendências." },
              { step: "03", icon: Target, title: "Apostas Otimizadas", desc: "Receba sugestões de jogos baseados em análise profunda e probabilidades reais." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center space-y-4"
              >
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 rounded-2xl gradient-brand opacity-20" />
                  <div className="relative w-full h-full rounded-2xl border border-primary/20 flex items-center justify-center">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 rounded-full w-6 h-6 flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Planos para cada{" "}
              <span className="gradient-brand-text">jogador</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comece grátis e evolua quando quiser. Sem surpresas.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-xl p-6 border transition-all duration-300 hover:translate-y-[-2px] ${
                  plan.highlight
                    ? "glass-card border-primary/30 glow-green relative"
                    : "glass-card border-border/30"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full gradient-brand text-primary-foreground text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                      <Star className="w-3 h-3" /> Mais Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button
                    className={`w-full ${
                      plan.highlight
                        ? "gradient-brand text-primary-foreground shadow-lg shadow-primary/20"
                        : ""
                    }`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 gradient-mesh">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center space-y-6 rounded-2xl glass-card p-10 md:p-14 border border-primary/10 glow-green"
          >
            <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
              <Zap className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Pronto para jogar com{" "}
              <span className="gradient-brand-text">inteligência</span>?
            </h2>
            <p className="text-muted-foreground">
              Junte-se a milhares de jogadores que já usam o Titan Loterias para tomar decisões baseadas em dados.
            </p>
            <Link to="/signup">
              <Button size="lg" className="gradient-brand text-primary-foreground shadow-xl shadow-primary/25 gap-2 text-base px-10 h-12">
                Criar Conta Grátis <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md gradient-brand flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold">Titan Loterias</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link to="/login" className="hover:text-foreground transition-colors">Entrar</Link>
              <Link to="/signup" className="hover:text-foreground transition-colors">Criar Conta</Link>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-mono tracking-wider">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse-glow" />
              © {new Date().getFullYear()} Titan Loterias
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
