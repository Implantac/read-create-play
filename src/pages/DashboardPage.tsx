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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BrainCircuit, Target, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComplianceDisclaimer } from "@/components/common/ComplianceDisclaimer";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const { stats, draws, selectedLottery } = useLotteryContext();
  const { luckyGame, generating, generateGame } = useBetGenerator();
  const [showBriefing, setShowBriefing] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 pb-20">
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border-primary/30 text-primary bg-primary/5">
            Command Center
          </Badge>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Sincronizado</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Central de <span className="gradient-brand-text">Inteligência</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Análise de históricos oficiais, padrões estatísticos e IA aplicada às loterias brasileiras para gerar apostas mais estratégicas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate("/analise")}
            >
              <History className="w-4 h-4" />
              Análise Histórica
            </Button>
            <Button
              variant="premium"
              size="sm"
              className="gap-2"
              onClick={() => navigate("/gerador")}
            >
              <Target className="w-4 h-4" />
              Gerar Apostas
            </Button>
          </div>
        </div>
      </div>

      <TitanStatsModule />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TitanAIModule />
          <TitanCommandCenter />
        </div>

        <div className="space-y-6">
          <RecommendationCard
            luckyGame={luckyGame}
            generating={generating}
            onGenerate={(p) => generateGame(p)}
            onShowBriefing={() => setShowBriefing(true)}
          />

          <Card className="p-6 space-y-5">
            <h4 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 text-foreground/90">
              <Sparkles className="w-4 h-4 text-primary" />
              Insights do Dia
            </h4>

            <div className="space-y-3">
              {[
                { title: "Tendência de Pares", value: "Premium", desc: "Titan Score 91/100 detectado." },
                { title: "Soma Ideal", value: "IA Preditiva", desc: "Intervalo de alta probabilidade." },
                { title: "Alerta de Ciclo", value: "Ativo", desc: "Dezenas em convergência estatística." },
              ].map((insight, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{insight.title}</span>
                    <span className="text-[11px] font-semibold text-primary">{insight.value}</span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">{insight.desc}</p>
                </div>
              ))}
            </div>

            <Button variant="ghost" size="sm" className="w-full gap-2 group">
              Ver Relatório Completo
              <BrainCircuit className="w-4 h-4 group-hover:rotate-12 transition-transform" />
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
      <div className="pt-8 border-t border-border/40">
        <ComplianceDisclaimer />
      </div>
    </div>
  );
};

export default DashboardPage;
