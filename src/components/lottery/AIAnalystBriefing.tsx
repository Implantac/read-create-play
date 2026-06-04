import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  ChevronRight, 
  BarChart3,
  Cpu,
  Fingerprint,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface BriefingProps {
  game: number[];
  score: number;
  strategy: string;
  reasons: string[];
  lotteryName: string;
  onClose?: () => void;
}

export const AIAnalystBriefing = ({ game, score, strategy, reasons, lotteryName, onClose }: BriefingProps) => {
  return (
    <m.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-2xl mx-auto overflow-hidden rounded-[2.5rem] border border-primary/20 bg-black/60 backdrop-blur-3xl shadow-2xl"
    >
      {/* Header */}
      <div className="relative p-8 pb-4">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Brain className="w-24 h-24 text-primary" />
        </div>
        
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary font-mono text-[10px] uppercase tracking-widest px-3">
              Neural Analysis Report
            </Badge>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-foreground leading-none">
            Por que este jogo é <span className="gradient-brand-text">Elite</span>?
          </h2>
          <p className="text-sm text-muted-foreground font-medium max-w-md">
            O Core Titan processou o histórico da {lotteryName} e identificou uma convergência estatística rara para estas dezenas.
          </p>
        </div>
      </div>

      <div className="p-8 pt-4 space-y-8">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Titan Score</span>
              <Cpu className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-black italic tabular-nums text-primary leading-none">{score}%</p>
              <Progress value={score} className="h-1.5 bg-primary/20" />
            </div>
            <p className="text-[9px] font-bold text-primary/60 uppercase">Confiança Nível Alpha</p>
          </div>

          <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estratégia Core</span>
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-black italic text-foreground leading-tight truncate">{strategy}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[9px] font-bold text-emerald-400 uppercase">Verificado por IA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reasons List */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Evidências de Probabilidade
          </h3>
          
          <div className="grid gap-3">
            {reasons.map((reason, idx) => (
              <m.div 
                key={idx}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/10 border border-white/5 group hover:border-primary/40 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-background border border-white/10 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <Fingerprint className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-foreground/90">{reason}</p>
                  <p className="text-[10px] text-muted-foreground font-medium italic opacity-60">Fator de influência detectado via Rede Neural</p>
                </div>
                <ChevronRight className="w-4 h-4 text-primary ml-auto opacity-40 group-hover:translate-x-1 transition-all" />
              </m.div>
            ))}
          </div>
        </div>

        {/* Insight Box */}
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap className="w-12 h-12 text-primary" />
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-primary">Insight do Analista</h4>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                "Este conjunto de números apresenta uma baixa entropia histórica, o que significa que o padrão de repetição é mais estável. Recomendamos este jogo como 'âncora' para suas apostas de hoje."
              </p>
            </div>
          </div>
        </div>
      </div>
    </m.div>
  );
};
