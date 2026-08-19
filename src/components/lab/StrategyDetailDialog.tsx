import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RankingEntry } from "@/engine/strategy-evolution";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Target, 
  ShieldCheck, 
  ShieldAlert, 
  Info,
  Zap,
  BarChart3,
  TrendingUp,
  Brain,
  Binary,
  Microscope,
  Database
} from "lucide-react";
import { EvidenceDistributionPanel } from "./evidence/EvidenceDistributionPanel";
import { VereditoApostador } from "./VereditoApostador";
import { MiniMetric } from "./LabShared";
import { EvidenceGrade } from '@/engine/contracts/quant';
import { motion } from "framer-motion";

interface StrategyDetailDialogProps {
  entry: RankingEntry | null;
  lotteryName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StrategyDetailDialog({ entry, lotteryName, isOpen, onClose }: StrategyDetailDialogProps) {
  if (!entry) return null;

  const { metrics, strategyName, rank, explanation, stressResult } = entry;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
              rank <= 3 ? "bg-primary/15 text-primary ring-2 ring-primary/20" : "bg-muted/20 text-muted-foreground"
            }`}>
              {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tighter uppercase italic">
                {strategyName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
                Análise Quantitativa Detalhada • {lotteryName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          {/* Main Stats Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Verdict Section */}
            <VereditoApostador 
              lift={metrics.lift || 1.0}
              zScore={metrics.zScore || 0}
              pValue={metrics.pValue || 0.5}
              grade={(metrics.evidenceGrade as EvidenceGrade) || 'E0'}
              lotteryName={lotteryName}
            />

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MiniMetric label="Score Global" value={metrics.globalScore.toFixed(1)} />
              <MiniMetric label="Média Hits" value={metrics.avgHits.toFixed(2)} />
              <MiniMetric label="Consistência" value={`${(metrics.consistency * 100).toFixed(0)}%`} />
              <MiniMetric label="Premiações" value={metrics.totalPrizes.toString()} />
              <MiniMetric label="Lift/Edge" value={`${metrics.lift?.toFixed(3)}x`} />
              <MiniMetric label="P-Valor" value={metrics.pValue?.toFixed(4)} />
              <MiniMetric label="Diversidade" value={`${metrics.diversityScore.toFixed(0)}%`} />
              <MiniMetric label="Cobertura" value={`${metrics.coverageScore.toFixed(0)}%`} />
            </div>

            {/* Hit Distribution Chart (Simplified Text Version for now or link to charts) */}
            <div className="bg-muted/10 p-4 rounded-2xl border border-border/50">
              <h4 className="text-[10px] uppercase font-black text-muted-foreground mb-3 tracking-widest flex items-center gap-2">
                <BarChart3 className="w-3 h-3" /> Distribuição de Acertos (Frequência)
              </h4>
              <div className="flex flex-wrap gap-3">
                {Object.entries(metrics.hitDistribution)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([hits, count]) => (
                    <div key={hits} className="flex flex-col items-center p-2 min-w-[60px] rounded-lg bg-background/40 border border-border/30">
                      <span className="text-xs font-black font-mono">{hits} acertos</span>
                      <span className="text-[10px] text-primary font-bold">{count}×</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <h4 className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                <Brain className="w-3 h-3" /> Análise Qualitativa
              </h4>
              <p className="text-sm text-foreground leading-relaxed italic opacity-90">
                {explanation}
              </p>
              {metrics.evidenceExplanation && (
                <p className="text-xs text-primary/80 font-medium border-l-2 border-primary/30 pl-3 py-1">
                  {metrics.evidenceExplanation}
                </p>
              )}
            </div>
          </div>

          {/* Evidence & Robustness Column */}
          <div className="space-y-6">
            {/* Robustness Section */}
            <div className="bg-card/40 border border-border/50 p-4 rounded-[2rem] space-y-4">
              <h4 className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> Robustness Test
              </h4>
              {stressResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black font-mono text-primary">{stressResult.robustnessScore.toFixed(0)}%</span>
                    <Badge variant="outline" className={`text-[9px] ${stressResult.robustnessScore > 60 ? 'border-emerald-500 text-emerald-500' : 'border-amber-500 text-amber-500'}`}>
                      {stressResult.verdict.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] uppercase font-bold text-muted-foreground">
                      <span>Estabilidade</span>
                      <span>{stressResult.robustnessScore.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: `${stressResult.robustnessScore}%` }} 
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic leading-tight">
                    Avaliação de estabilidade do sinal através de janelas temporais móveis e testes de regimes de mercado.
                  </p>
                </div>
              ) : (
                <div className="py-4 text-center space-y-2">
                  <ShieldAlert className="w-6 h-6 text-muted-foreground/30 mx-auto" />
                  <p className="text-[9px] text-muted-foreground italic">Teste de estresse pendente de execução.</p>
                </div>
              )}
            </div>

            {/* Monte Carlo Info */}
            <div className="bg-card/40 border border-border/50 p-4 rounded-[2rem] space-y-3">
              <h4 className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                <Database className="w-3 h-3" /> Monte Carlo Engine
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Iterações</span>
                  <span className="font-mono font-bold">{metrics.monteCarloStats?.iterations.toLocaleString() || '100.000'}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">P-Valor Simulado</span>
                  <span className="font-mono font-bold">{metrics.pValue?.toFixed(5)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Z-Score</span>
                  <span className="font-mono font-bold">{metrics.zScore?.toFixed(2)}</span>
                </div>
                {metrics.confidenceInterval && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">IC95% Lift</span>
                    <span className="font-mono font-bold">[{metrics.confidenceInterval[0].toFixed(2)}-{metrics.confidenceInterval[1].toFixed(2)}]</span>
                  </div>
                )}
              </div>
            </div>

            {/* Grade Explanation */}
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-[2rem] space-y-2">
              <h4 className="text-[10px] uppercase font-black text-primary tracking-widest">Entendendo o Grau {metrics.evidenceGrade}</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                {metrics.evidenceGrade === 'E4' ? "Sinal Ultra-Robusto: A anomalia estatística é tão forte que a probabilidade de ser fruto do acaso é inferior a 1%." :
                 metrics.evidenceGrade === 'E3' ? "Sinal Forte: Existe uma vantagem clara sobre a média, validada por 100k simulações com p < 0.05." :
                 metrics.evidenceGrade === 'E2' ? "Sinal Moderado: Há indícios de vantagem, mas a variância ainda pode explicar parte dos resultados." :
                 "Sinal Inconclusivo: A performance não superou de forma significativa o baseline aleatório nos testes de estresse."}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
