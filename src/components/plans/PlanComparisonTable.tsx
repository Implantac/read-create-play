import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { name: "Dashboard estatístico", free: true, lifetime: true, elite: true },
  { name: "Gerador básico", free: true, lifetime: true, elite: true },
  { name: "Histórico de concursos", free: true, lifetime: true, elite: true },
  { name: "Conferidor de apostas", free: true, lifetime: true, elite: true },
  { name: "Jogos salvos ilimitados", free: false, lifetime: true, elite: true },
  { name: "Geradores avançados (IA, Evolutivo)", free: false, lifetime: true, elite: true },
  { name: "Gerador Profissional Premium", free: false, lifetime: true, elite: true },
  { name: "Simulações Massivas ilimitadas", free: false, lifetime: true, elite: true },
  { name: "Layout Terminal Customizável", free: false, lifetime: true, elite: true },
  { name: "Exportação de Relatórios", free: false, lifetime: true, elite: true },
  { name: "Machine Learning preditivo", free: false, lifetime: false, elite: true },
  { name: "IA Autônoma Dedicada", free: false, lifetime: false, elite: true },
  { name: "Motor HP Matemático", free: false, lifetime: false, elite: true },
  { name: "Dashboard Social Premium", free: false, lifetime: false, elite: true },
  { name: "Marketplace de Estratégias", free: false, lifetime: false, elite: true },
  { name: "Suporte Prioritário VIP", free: false, lifetime: true, elite: true },
];

function CellIcon({ available }: { available: boolean }) {
  return available ? (
    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
      <Check className="w-3 h-3 text-primary" />
    </div>
  ) : (
    <X className="w-4 h-4 text-muted-foreground mx-auto" />
  );
}

export function PlanComparisonTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="mt-16 max-w-4xl mx-auto"
    >
      <h2 className="text-xl font-bold text-foreground text-center mb-8">
        Comparação detalhada de recursos
      </h2>

      <div className="rounded-xl border border-border/30 overflow-hidden bg-card/50 backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/30">
                <th className="text-left px-5 py-3.5 font-semibold text-foreground">Funcionalidade</th>
                <th className="text-center px-4 py-3.5 font-semibold text-foreground w-28">Gratuito</th>
                <th className="text-center px-4 py-3.5 font-semibold text-primary w-28">Enterprise Pro</th>
                <th className="text-center px-4 py-3.5 font-semibold text-accent w-28">Elite Cloud</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={f.name} className={`border-b border-border/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-5 py-3 text-foreground/80">{f.name}</td>
                  <td className="px-4 py-3"><CellIcon available={f.free} /></td>
                  <td className="px-4 py-3 bg-primary/[0.03]"><CellIcon available={(f as any).lifetime} /></td>
                  <td className="px-4 py-3 bg-accent/[0.03]"><CellIcon available={(f as any).elite} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
