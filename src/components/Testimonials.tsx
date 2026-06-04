import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Ricardo Silva",
    role: "Analista de Dados",
    content: "O Titan Loterias mudou completamente minha forma de enxergar os sorteios. A precisão da IA é assustadora.",
    initials: "RS",
  },
  {
    name: "Ana Oliveira",
    role: "Jogadora Profissional",
    content: "As ferramentas de backtest me economizaram centenas de reais em apostas sem sentido. Agora só jogo com estratégia.",
    initials: "AO",
  },
  {
    name: "Marcos Santos",
    role: "Entusiasta de Matemática",
    content: "Melhor plataforma do Brasil. O otimizador de matrizes é simplesmente fantástico para quem busca cobertura real.",
    initials: "MS",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 md:py-40 bg-card/20 border-y border-border/40">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
            Quem usa, <span className="gradient-brand-text">Aprova</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-medium text-lg opacity-70">
            Junte-se a milhares de jogadores que já profissionalizaram suas estratégias.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 rounded-2xl border border-border/40 relative group hover:border-primary/30 transition-all"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
              <div className="flex items-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-lg font-medium mb-8 italic opacity-90 leading-relaxed">
                "{t.content}"
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{t.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-foreground">{t.name}</h4>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
