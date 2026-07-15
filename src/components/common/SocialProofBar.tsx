import { motion } from "framer-motion";
import { Shield, Lock, Users, Award } from "lucide-react";

const badges = [
  { icon: Shield, label: "Conformidade com a LGPD" },
  { icon: Lock, label: "Login seguro com 2FA" },
  { icon: Users, label: "+4.800 apostadores ativos" },
  { icon: Award, label: "Plataforma nº 1 em estatística de loterias" },
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
