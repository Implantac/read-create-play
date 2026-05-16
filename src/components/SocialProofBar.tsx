import { motion } from "framer-motion";
import { Shield, Lock, Users, Award } from "lucide-react";

const badges = [
  { icon: Shield, label: "Dados Oficiais da Caixa" },
  { icon: Lock, label: "Criptografia SSL 256-bit" },
   { icon: Users, label: "7.000+ Jogadores Ativos" },
   { icon: Award, label: "Padrão de Segurança Enterprise" },
];

export function SocialProofBar() {
  return (
    <section className="border-b border-border/20 bg-card/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {badges.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <b.icon className="w-4 h-4 text-primary/70" />
              <span className="text-xs font-medium tracking-wide">{b.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
