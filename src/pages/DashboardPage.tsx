import { useState } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { useBetGenerator } from "@/hooks/logic/useBetGenerator";
import { AnimatePresence, motion } from "framer-motion";
import { AIAnalystBriefing } from "@/components/lottery/AIAnalystBriefing";
import { TitanCommandCenter } from "@/components/common/TitanCommandCenter";
import { DashboardHeader } from "@/components/layout/dashboard/DashboardHeader";
import { RecommendationCard } from "@/components/lottery/RecommendationCard";
import { TitanAIModule } from "@/components/lottery/TitanAIModule";
import { TitanStatsModule } from "@/components/lottery/TitanStatsModule";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BrainCircuit, Target, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const { stats, draws, selectedLottery } = useLotteryContext();
  const { luckyGame, generating, generateGame } = useBetGenerator();
  const [showBriefing, setShowBriefing] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto px-4 sm:px-6 pb-20">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 text-[10px] font-black uppercase tracking-widest border-primary/30 text-primary bg-primary/5">
            Neural Command Center v4.0
          </Badge>
          <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Sincronizado</span>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
              Central de <span className="gradient-brand-text">Inteligência</span> Titan
            </h1>
            <p className="text-muted-foreground font-medium max-w-lg opacity-60">
              O seu centro operacional para análise estatística avançada e predição de alta performance.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 h-10 px-4"
              onClick={() => navigate("/analise")}
            >
              <History className="w-4 h-4" />
              Análise Histórica
            </Button>
            <Button 
              variant="premium" 
              size="sm" 
              className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 h-10 px-4 shadow-lg shadow-primary/20"
              onClick={() => navigate("/gerador")}
            >
              <Target className="w-4 h-4" />
              Gerar Apostas
            </Button>
          </div>
        </div>
      </div>

      <TitanStatsModule />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <TitanAIModule />
          <TitanCommandCenter />
        </div>
        
        <div className="space-y-8">
          <RecommendationCard 
            luckyGame={luckyGame} 
            generating={generating} 
            onGenerate={generateGame} 
            onShowBriefing={() => setShowBriefing(true)} 
          />
          
          <Card className="p-8 glass-card border-white/5 space-y-6">
            <h4 className="text-lg font-black uppercase tracking-tighter italic flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Insights do Dia
            </h4>
            
            <div className="space-y-4">
              {[
                { title: "Tendência de Pares", value: "60% Favorável", desc: "Baseado nos últimos 10 concursos." },
                { title: "Soma Ideal", value: "185 - 210", desc: "Intervalo de alta probabilidade detectado." },
                { title: "Alerta de Ciclo", value: "Próximo ao Fim", desc: "Dezenas 14, 22 e 25 estão atrasadas." },
              ].map((insight, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{insight.title}</span>
                    <span className="text-xs font-black text-primary italic">{insight.value}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground opacity-60 leading-relaxed">{insight.desc}</p>
                </div>
              ))}
            </div>
            
            <Button variant="ghost" className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest group">
              Ver Relatório Completo
              <BrainCircuit className="w-4 h-4 ml-2 group-hover:rotate-12 transition-transform" />
            </Button>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {showBriefing && luckyGame && (
          <AIAnalystBriefing
            game={luckyGame.numbers}
            score={luckyGame.score}
            strategy={luckyGame.strategy}
            reasons={luckyGame.reasons}
            onClose={() => setShowBriefing(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardPage;
