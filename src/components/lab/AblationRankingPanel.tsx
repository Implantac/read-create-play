import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, Activity, ShieldCheck, ShieldAlert } from "lucide-react";

export interface AblationReport {
  indicator: string;
  liftContribution: number;
  significanceImpact: number;
  confidenceGain: number;
  relativeImportance: number;
  robustnessGrade: 'High' | 'Medium' | 'Low';
  pValueImpact: number;
}

interface Props {
  results: AblationReport[];
  running: boolean;
  onRun: () => void;
}

export function AblationRankingPanel({ results, running, onRun }: Props) {
  return (
    <Card className="glass-card border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Ranking de Indicadores (Ablação)
          </CardTitle>
          <button 
            onClick={onRun}
            disabled={running}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline disabled:opacity-50"
          >
            {running ? "Processando..." : "Atualizar Estudo"}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Mede a contribuição real de cada fator para o sinal final (Leave-One-Out Methodology).
        </p>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <p className="text-xs text-muted-foreground">Estudo de ablação não iniciado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={r.indicator} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-tight">{r.indicator}</span>
                    <Badge variant="outline" className={`text-[8px] px-1 py-0 h-4 ${
                      r.robustnessGrade === 'High' ? 'border-emerald-500/50 text-emerald-500' :
                      r.robustnessGrade === 'Medium' ? 'border-blue-500/50 text-blue-500' :
                      'border-muted-foreground/50 text-muted-foreground'
                    }`}>
                      {r.robustnessGrade}
                    </Badge>
                  </div>
                  <span className="font-mono text-primary">+{ (r.liftContribution * 100).toFixed(2) }% Lift</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${Math.max(5, r.relativeImportance * 100)}%` }} 
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                  <span>Impacto P: {r.pValueImpact > 0 ? `+${r.pValueImpact.toFixed(3)}` : r.pValueImpact.toFixed(3)}</span>
                  <span>Importância: {(r.relativeImportance * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}

            <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center gap-2">
                {results[0].robustnessGrade === 'High' ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                  Diagnóstico de Robustez
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground italic leading-tight">
                {results[0].robustnessGrade === 'High' 
                  ? `O indicador "${results[0].indicator}" é o pilar de sustentação do sinal. Sem ele, a confiança estatística cai drasticamente.`
                  : "A performance é distribuída entre vários fatores, sem um único pilar dominante de robustez."}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
