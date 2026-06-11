import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TrendingUp, BarChart3, Binary } from "lucide-react";

const lotteries = [
  { name: "Mega-Sena", icon: "🍀", color: "bg-emerald-500" },
  { name: "Lotofácil", icon: "💎", color: "bg-fuchsia-500" },
  { name: "Quina", icon: "⭐", color: "bg-blue-600" },
  { name: "Lotomania", icon: "🎱", color: "bg-orange-500" },
  { name: "Dupla Sena", icon: "👯", color: "bg-red-600" },
  { name: "Timemania", icon: "⚽", color: "bg-yellow-500" },
  { name: "Dia de Sorte", icon: "📅", color: "bg-amber-600" },
  { name: "Super Sete", icon: "7️⃣", color: "bg-cyan-500" },
  { name: "+Milionária", icon: "💰", color: "bg-indigo-600" },
];

export function SupportedLotteries() {
  return (
    <section className="py-24 bg-black/40 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="px-4 py-1 text-[10px] font-black tracking-widest uppercase border-primary/30 text-primary">
            Ecossistema Completo
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
            Loterias <span className="gradient-brand-text">Suportadas</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-medium opacity-60">
            Cada modalidade possui seu próprio núcleo de processamento, estratégias exclusivas e análise estatística dedicada.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {lotteries.map((lottery, i) => (
            <motion.div
              key={lottery.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full glass-card border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 ${lottery.color} opacity-5 blur-[40px] group-hover:opacity-20 transition-opacity`} />
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-500">{lottery.icon}</div>
                <h3 className="font-black uppercase tracking-tight italic text-lg mb-4">{lottery.name}</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    Tendências Ativas
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <BarChart3 className="w-3 h-3 text-blue-500" />
                    Score Preditivo
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <Binary className="w-3 h-3 text-primary" />
                    Titan Engine v4
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}