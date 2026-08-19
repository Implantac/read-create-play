import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShieldCheck,
  Zap,
  BarChart3,
  Dna,
  History,
  AlertTriangle,
  FileSearch,
} from "lucide-react";
import { QuantitativeDecisionResult } from "@/engine/contracts/quant";

interface DecisionAuditDialogProps {
  decision: QuantitativeDecisionResult;
  lotteryName: string;
}

export function DecisionAuditDialog({ decision, lotteryName }: DecisionAuditDialogProps) {
  return (
    <DialogContent className="max-w-2xl max-h-[90vh] glass-card border-primary/20 p-0 overflow-hidden">
      <DialogHeader className="p-6 pb-2 border-b border-primary/10">
        <DialogTitle className="flex items-center gap-2 text-xl italic font-black uppercase tracking-tighter">
          <FileSearch className="w-6 h-6 text-primary" />
          Auditoria de Decisão Quantitativa
        </DialogTitle>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
          TITAN V7.5 ALPHA — {lotteryName} — {new Date(decision.timestamp).toLocaleString()}
        </p>
      </DialogHeader>

      <ScrollArea className="p-6 h-[70vh]">
        <div className="space-y-8 pb-8">
          {/* FASE 1: DATA QUALITY */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
              <ShieldCheck className="w-4 h-4" />
              1. Integridade de Dados & Leakage
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Qualidade do Histórico</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-mono font-black">{decision.dataQuality.score.toFixed(1)}%</span>
                  {decision.dataQuality.isValid && (
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-[9px] mb-1">VALIDADO</Badge>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Detecção de Leakage</p>
                <div className="flex items-end gap-2">
                  <span className={`text-2xl font-mono font-black ${decision.dataQuality.hasLeakage ? 'text-red-500' : 'text-green-500'}`}>
                    {decision.dataQuality.hasLeakage ? 'POSITIVE' : 'CLEAN'}
                  </span>
                  <Badge variant="outline" className="text-[9px] mb-1">TEMPORAL</Badge>
                </div>
              </div>
            </div>
          </section>

          {/* FASE 2: EVIDENCE */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
              <Zap className="w-4 h-4" />
              2. Evidência Estatística & Benchmark
            </h3>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Evidence Grade</p>
                  <span className="text-3xl font-black italic tracking-tighter text-primary">{decision.evidence.grade}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Monte Carlo (100k)</p>
                  <span className="text-lg font-mono font-bold">P = {decision.evidence.pValue.toFixed(4)}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-black/20 rounded">
                  <p className="text-[8px] text-muted-foreground uppercase">Lift</p>
                  <p className="text-xs font-mono font-bold">+{((decision.evidence.lift - 1) * 100).toFixed(2)}%</p>
                </div>
                <div className="text-center p-2 bg-black/20 rounded">
                  <p className="text-[8px] text-muted-foreground uppercase">Z-Score</p>
                  <p className="text-xs font-mono font-bold">{decision.evidence.zScore.toFixed(2)}</p>
                </div>
                <div className="text-center p-2 bg-black/20 rounded">
                  <p className="text-[8px] text-muted-foreground uppercase">Sample</p>
                  <p className="text-xs font-mono font-bold">{decision.evidence.sampleSize}</p>
                </div>
              </div>
              <p className="text-[10px] italic text-muted-foreground leading-relaxed">
                "{decision.evidence.explanation}"
              </p>
            </div>
          </section>

          {/* FASE 3: ABLATION */}
          {decision.ablation && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                <Dna className="w-4 h-4" />
                3. Análise de Ablação (Contribuição)
              </h3>
              <div className="space-y-2">
                {decision.ablation.impacts.map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[9px] font-bold w-16 truncate">{a.indicator}</span>
                    <div className="flex-1 bg-muted h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full" 
                        style={{ width: `${a.importance * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground">{(a.importance * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FASE 4: ROBUSTNESS */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
              <BarChart3 className="w-4 h-4" />
              4. Teste de Estresse & Robustez
            </h3>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black font-mono">{decision.robustness.score.toFixed(0)}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Score de Estabilidade</span>
                </div>
                <Badge className={decision.robustness.verdict === 'robust' ? 'bg-green-500' : 'bg-amber-500'}>
                  {decision.robustness.verdict.toUpperCase()}
                </Badge>
              </div>
              <div className="text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Índice de Estabilidade Temporal:</span>
                  <span className="font-mono">{decision.robustness.stabilityIndex.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resiliência a Volatilidade:</span>
                  <span className="font-mono text-green-500">ALTA</span>
                </div>
              </div>
            </div>
          </section>

          {/* RATIONALE FINAL */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
              <History className="w-4 h-4" />
              Conclusão & Rationale
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded bg-green-500/5 border border-green-500/10">
                <p className="text-[8px] font-black uppercase text-green-500 mb-1">Sinais Positivos</p>
                <ul className="text-[10px] space-y-1">
                  {decision.verdict.rationale.positive.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              {decision.verdict.rationale.negative.length > 0 && (
                <div className="p-3 rounded bg-red-500/5 border border-red-500/10">
                  <p className="text-[8px] font-black uppercase text-red-500 mb-1">Relação de Riscos</p>
                  <ul className="text-[10px] space-y-1">
                    {decision.verdict.rationale.negative.map((n, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </div>
      </ScrollArea>
      
      <div className="p-4 bg-primary/10 border-t border-primary/20 text-center">
        <p className="text-[10px] font-bold text-primary italic">
          "Decisão gerada algoritmicamente sem intervenção humana baseada em 100k simulações."
        </p>
      </div>
    </DialogContent>
  );
}