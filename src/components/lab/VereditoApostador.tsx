import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, TrendingDown, Info, AlertTriangle } from "lucide-react";
import { EvidenceGrade } from '@/engine/contracts/quant';

interface VereditoApostadorProps {
  lift: number;
  zScore: number;
  pValue: number;
  grade: EvidenceGrade;
  lotteryName: string;
}

export function VereditoApostador({ lift, zScore, pValue, grade, lotteryName }: VereditoApostadorProps) {
  const isRobust = pValue < 0.05 && lift > 1.0;
  const isExperimental = !isRobust && pValue < 0.15 && lift > 1.0;
  
  let status: 'Apostar' | 'Reduzido' | 'Observar' | 'Não Apostar' = 'Não Apostar';
  let colorClass = 'text-destructive border-destructive/50 bg-destructive/10';
  let Icon = ShieldAlert;
  let recommendation = "O sinal atual é estatisticamente indistinguível de ruído aleatório. Risco de perda total do capital alocado por variância negativa.";

  if (grade === 'E4' || (lift > 1.05 && pValue < 0.01)) {
    status = 'Apostar';
    colorClass = 'text-emerald-500 border-emerald-500/50 bg-emerald-500/10';
    Icon = ShieldCheck;
    recommendation = "PARECER: Evidência robusta (E4) detectada via Monte Carlo. O sinal supera a variância aleatória com alta confiança. Recomendado seguir plano de banca padrão com foco em longo prazo.";
  } else if (grade === 'E3' || (lift > 1.02 && pValue < 0.05)) {
    status = 'Reduzido';
    colorClass = 'text-blue-500 border-blue-500/50 bg-blue-500/10';
    Icon = ShieldCheck;
    recommendation = "PARECER: Evidência forte (E3), mas com margem de erro presente. Estratégia válida para exposição reduzida (Kelly Criterion conservador: 50% da unidade padrão).";
  } else if (isExperimental) {
    status = 'Observar';
    colorClass = 'text-amber-500 border-amber-500/50 bg-amber-500/10';
    Icon = AlertTriangle;
    recommendation = "PARECER: Sinal exploratório (E1/E2) detectado. Sem significância estatística rigorosa (P > 0.05). Recomendado apenas para observação ou testes em simulador de backtest.";
  }

  return (
    <Card className="glass-card border-primary/20 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
            Veredito do Especialista
          </CardTitle>
          <Badge className={`font-black tracking-widest px-3 py-1 rounded-lg ${colorClass}`}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-start">
          <div className={`p-3 rounded-2xl ${colorClass.split(' ')[2]} shrink-0`}>
            <Icon className={`w-8 h-8 ${colorClass.split(' ')[0]}`} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold leading-tight">
              {recommendation}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
              Análise Quantitativa para {lotteryName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/40">
          <div className="text-center">
            <p className="text-[9px] text-muted-foreground uppercase font-black">Confiança</p>
            <p className="text-xs font-mono font-bold">{((1 - pValue) * 100).toFixed(1)}%</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-muted-foreground uppercase font-black">Vantagem</p>
            <p className="text-xs font-mono font-bold text-primary">+{((lift - 1) * 100).toFixed(1)}%</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-muted-foreground uppercase font-black">Z-Score</p>
            <p className="text-xs font-mono font-bold">{zScore.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <Info className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-500/80 italic leading-tight">
            NOTIFICAÇÃO DE RISCO: A análise quantitativa identifica anomalias estatísticas históricas (Edge). Loterias são eventos aleatórios por definição e não há garantia de lucros futuros. Gerencie sua banca com rigor.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
