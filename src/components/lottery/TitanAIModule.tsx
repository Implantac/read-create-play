import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, MessageSquare, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function TitanAIModule() {
  const navigate = useNavigate();

  return (
    <Card className="p-8 glass-card border-primary/20 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
      
      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
          <BrainCircuit className="w-10 h-10 text-primary" />
        </div>
        
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-primary/30 text-primary bg-primary/5">
              Titan AI Center
            </Badge>
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
              Online
            </Badge>
          </div>
          
          <h2 className="text-3xl font-black uppercase tracking-tighter italic italic">
            Assistente IA <span className="gradient-brand-text">Especializado</span>
          </h2>
          
          <p className="text-sm text-muted-foreground font-medium max-w-xl leading-relaxed">
            Analise dezenas em tendência, melhores combinações e padrões detectados em tempo real pela nossa rede neural. Auxiliamos na sua tomada de decisão estratégica.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto shrink-0">
          <Button 
            variant="outline" 
            className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 h-12 hover:bg-primary/10"
            onClick={() => navigate("/ia-chat")}
          >
            <MessageSquare className="w-4 h-4" />
            Abrir Chat IA
          </Button>
          <Button 
            variant="premium" 
            className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 h-12 shadow-lg shadow-primary/20"
            onClick={() => navigate("/ia-autonoma")}
          >
            <Sparkles className="w-4 h-4" />
            Modo Autônomo
          </Button>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        {[
          { label: "Sugestão da IA", value: "Frequência Neural", icon: TrendingUp },
          { label: "Probabilidade", value: "89.2%", icon: Sparkles },
          { label: "Padrão Detectado", value: "Cíclico Ativo", icon: BrainCircuit },
          { label: "Vantagem Est.", value: "Alta Fidelity", icon: TrendingUp },
        ].map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
              <item.icon className="w-3 h-3 text-primary" />
              {item.label}
            </div>
            <p className="text-sm font-black uppercase tracking-tight italic">{item.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}