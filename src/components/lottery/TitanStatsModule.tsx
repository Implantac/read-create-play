import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Binary, History, Target, Zap } from "lucide-react";

export function TitanStatsModule() {
  const stats = [
    { label: "Concursos Analisados", value: "14.502", icon: History, trend: "+100%", color: "text-emerald-400" },
    { label: "Estratégias Disponíveis", value: "48", icon: Target, trend: "Inteligência", color: "text-blue-400" },
    { label: "Tendências Detectadas", value: "321", icon: Zap, trend: "Real-time", color: "text-amber-400" },
    { label: "Melhor Oportunidade", value: "IA Premium", icon: BarChart3, trend: "Titan Score 91", color: "text-primary", info: "Oportunidade Estatística" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="p-6 glass-card border-white/5 hover:border-primary/20 transition-all group overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <stat.icon className="w-24 h-24 rotate-12" />
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-all duration-500">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
            </div>
          </div>
          
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none">{stat.value}</h3>
              {('info' in stat) && <p className="text-[8px] font-black uppercase text-emerald-400 tracking-widest">{stat.info}</p>}
            </div>
            <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase border-white/10 text-muted-foreground bg-white/5">
              {stat.trend}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}