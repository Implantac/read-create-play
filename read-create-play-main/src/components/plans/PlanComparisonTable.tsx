import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { name: "Dashboard estatístico", free: true, premium: true, pro: true },
  { name: "Gerador básico", free: true, premium: true, pro: true },
  { name: "Histórico de concursos", free: true, premium: true, pro: true },
  { name: "Conferidor de apostas", free: true, premium: true, pro: true },
  { name: "Jogos salvos ilimitados", free: false, premium: true, pro: true },
  { name: "Geradores avançados (Extremo, IA, Evolutivo)", free: false, premium: true, pro: true },
  { name: "Gerador Profissional", free: false, premium: true, pro: true },
  { name: "Fechamentos inteligentes", free: false, premium: true, pro: true },
  { name: "Simulações (Monte Carlo, Backtesting)", free: false, premium: true, pro: true },
  { name: "Exportação PDF", free: false, premium: true, pro: true },
  { name: "Estratégias (Padrões, Comparação)", free: false, premium: true, pro: true },
  { name: "Dashboard de ROI", free: false, premium: true, pro: true },
  { name: "Machine Learning preditivo", free: false, premium: false, pro: true },
  { name: "Motor HP Matemático", free: false, premium: false, pro: true },
  { name: "Analytics avançado", free: false, premium: false, pro: true },
  { name: "Algoritmo Genético + SA", free: false, premium: false, pro: true },
  { name: "IA Autônoma", free: false, premium: false, pro: true },
  { name: "AI Analyst (Chat IA)", free: false, premium: false, pro: true },
  { name: "Suporte prioritário", free: false, premium: false, pro: true },
];

function CellIcon({ available }: { available: boolean }) {
  return available ? (
    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
      <Check className="w-3 h-3 text-primary" />
    </div>
  ) : (
    <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
  );
}

export function PlanComparisonTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="mt-16 max-w-3xl mx-auto"
    >
      <h2 className="text-xl font-bold text-foreground text-center mb-8">
        Comparação detalhada
      </h2>

      <div className="rounded-xl border border-border/30 overflow-hidden bg-card/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/30">
                <th className="text-left px-5 py-3.5 font-semibold text-foreground">Funcionalidade</th>
                <th className="text-center px-4 py-3.5 font-semibold text-foreground w-24">Gratuito</th>
                <th className="text-center px-4 py-3.5 font-semibold text-primary w-24">Premium</th>
                <th className="text-center px-4 py-3.5 font-semibold text-foreground w-24">Pro</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={f.name} className={`border-b border-border/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-5 py-3 text-foreground/80">{f.name}</td>
                  <td className="px-4 py-3"><CellIcon available={f.free} /></td>
                  <td className="px-4 py-3 bg-primary/[0.03]"><CellIcon available={f.premium} /></td>
                  <td className="px-4 py-3"><CellIcon available={f.pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
