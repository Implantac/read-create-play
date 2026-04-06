import { motion } from "framer-motion";
import { X, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { burstConfetti } from "@/lib/confetti";

const comparisons = [
  { traditional: "Escolhe números por palpite ou data", titan: "Gera combinações com análise de 10.000+ sorteios" },
  { traditional: "Joga sempre os mesmos números", titan: "Adapta estratégias com IA a cada novo resultado" },
  { traditional: "Não sabe se a combinação é boa", titan: "Score de qualidade e backtesting antes de apostar" },
  { traditional: "Gasta sem controle", titan: "Fechamentos otimizados que reduzem custo" },
  { traditional: "Zero informação sobre probabilidades", titan: "Simulação Monte Carlo com milhões de cenários" },
  { traditional: "Repete erros sem perceber", titan: "Ranking de estratégias mostra o que funciona" },
];

export function ComparisonSection() {
  const navigate = useNavigate();

  const handleCta = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    burstConfetti(e);
    setTimeout(() => navigate("/signup"), 500);
  }, [navigate]);

  return (
    <section className="py-20 md:py-28 bg-card/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Método tradicional vs{" "}
            <span className="gradient-brand-text">Titan Loterias</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Veja a diferença entre apostar no escuro e usar inteligência de dados.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                <X className="w-3 h-3" /> Método Tradicional
              </span>
            </div>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <Check className="w-3 h-3" /> Com Titan Loterias
              </span>
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-3">
            {comparisons.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-start gap-2.5 p-4 rounded-xl border border-destructive/10 bg-destructive/[0.03]">
                  <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{c.traditional}</span>
                </div>
                <div className="flex items-start gap-2.5 p-4 rounded-xl border border-primary/10 bg-primary/[0.03]">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/90">{c.titan}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Button size="lg" onClick={handleCta} className="gradient-brand text-primary-foreground shadow-lg shadow-primary/20 gap-2 px-8 h-11">
              Quero jogar com inteligência <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
