import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { name: "Dashboard estatístico", free: true, lifetime: true },
  { name: "Gerador básico", free: true, lifetime: true },
  { name: "Histórico de concursos", free: true, lifetime: true },
  { name: "Conferidor de apostas", free: true, lifetime: true },
  { name: "Jogos salvos ilimitados", free: false, lifetime: true },
  { name: "Geradores avançados (Extremo, IA, Evolutivo)", free: false, lifetime: true },
  { name: "Gerador Profissional", free: false, lifetime: true },
  { name: "Fechamentos inteligentes", free: false, lifetime: true },
  { name: "Simulações (Monte Carlo, Backtesting)", free: false, lifetime: true },
  { name: "Exportação PDF", free: false, lifetime: true },
  { name: "Estratégias (Padrões, Comparação)", free: false, lifetime: true },
  { name: "Dashboard de ROI", free: false, lifetime: true },
  { name: "Machine Learning preditivo", free: false, lifetime: true },
  { name: "Motor HP Matemático", free: false, lifetime: true },
  { name: "Analytics avançado", free: false, lifetime: true },
  { name: "Algoritmo Genético + SA", free: false, lifetime: true },
  { name: "IA Autônoma", free: false, lifetime: true },
  { name: "AI Analyst (Chat IA)", free: false, lifetime: true },
  { name: "Suporte prioritário", free: false, lifetime: true },
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
      className="mt-16 max-w-2xl mx-auto"
    >
      <h2 className="text-xl font-bold text-foreground text-center mb-8">
        Comparação detalhada
      </h2>

      <div className="rounded-xl border border-border/30 overflow-hidden bg-card/50 backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/30">
                <th className="text-left px-5 py-3.5 font-semibold text-foreground">Funcionalidade</th>
                <th className="text-center px-4 py-3.5 font-semibold text-foreground w-28">Gratuito</th>
                <th className="text-center px-4 py-3.5 font-semibold text-primary w-28">Vitalício (R$ 79,90)</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={f.name} className={`border-b border-border/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-5 py-3 text-foreground/80">{f.name}</td>
                  <td className="px-4 py-3"><CellIcon available={f.free} /></td>
                  <td className="px-4 py-3 bg-primary/[0.03]"><CellIcon available={f.lifetime} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
