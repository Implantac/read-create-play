/**
 * Admin — Backtest Compare View
 * Compara duas execuções de backtest lado a lado, com deltas destacados.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, GitCompareArrows, X } from "lucide-react";
import { LOTTERIES } from "@/data/lotteries";
import type { BacktestComparison, BacktestMetrics } from "@/engine/validation/backtestRunner";

export interface BacktestRunLite {
  id: string;
  lottery_id: string;
  lookback: number;
  draws_evaluated: number;
  before_metrics: BacktestMetrics;
  after_metrics: BacktestMetrics;
  delta: BacktestComparison["delta"];
  improved: boolean;
  created_at: string;
}

interface Props {
  runA: BacktestRunLite;
  runB: BacktestRunLite;
  onClose: () => void;
}

interface MetricRow {
  label: string;
  a: number;
  b: number;
  fmt: (v: number) => string;
  higherIsBetter: boolean;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function lotteryLabel(id: string) {
  const l = LOTTERIES.find(x => x.id === id);
  return l ? `${l.icon} ${l.name}` : id;
}

function DeltaCell({ a, b, fmt, higherIsBetter }: { a: number; b: number; fmt: (v: number) => string; higherIsBetter: boolean }) {
  const delta = b - a;
  const neutral = Math.abs(delta) < 1e-6;
  const good = higherIsBetter ? delta > 0 : delta < 0;
  const cls = neutral ? "text-muted-foreground" : good ? "text-emerald-500" : "text-red-500";
  const pct = a !== 0 ? (delta / Math.abs(a)) * 100 : 0;
  return (
    <span className={`inline-flex items-center gap-0.5 font-mono ${cls}`}>
      {!neutral && (delta > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
      {fmt(Math.abs(delta))}
      {!neutral && a !== 0 && (
        <span className="text-[10px] opacity-70 ml-0.5">({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)</span>
      )}
    </span>
  );
}

function MetricTable({ title, rows }: { title: string; rows: MetricRow[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{title}</h4>
      <div className="overflow-x-auto rounded border border-border/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20 text-xs text-muted-foreground">
              <th className="text-left py-2 px-3">Métrica</th>
              <th className="text-right px-3">Execução A</th>
              <th className="text-right px-3">Execução B</th>
              <th className="text-right px-3">Δ (B − A)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.label} className="border-b border-border/20 last:border-b-0">
                <td className="py-2 px-3 text-muted-foreground">{r.label}</td>
                <td className="text-right px-3 tabular-nums">{r.fmt(r.a)}</td>
                <td className="text-right px-3 tabular-nums font-medium">{r.fmt(r.b)}</td>
                <td className="text-right px-3 tabular-nums">
                  <DeltaCell a={r.a} b={r.b} fmt={r.fmt} higherIsBetter={r.higherIsBetter} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BacktestCompareView({ runA, runB, onClose }: Props) {
  const baselineRows: MetricRow[] = [
    { label: "Acertos médios / jogo", a: runA.before_metrics.avgHits, b: runB.before_metrics.avgHits, fmt: v => v.toFixed(3), higherIsBetter: true },
    { label: "Taxa faixa premiável (%)", a: runA.before_metrics.premiumHitRate * 100, b: runB.before_metrics.premiumHitRate * 100, fmt: v => `${v.toFixed(2)}%`, higherIsBetter: true },
    { label: "Quality Score", a: runA.before_metrics.qualityScore, b: runB.before_metrics.qualityScore, fmt: v => v.toFixed(1), higherIsBetter: true },
    { label: "Melhor acerto", a: runA.before_metrics.maxHits, b: runB.before_metrics.maxHits, fmt: v => `${v}`, higherIsBetter: true },
  ];
  const titanRows: MetricRow[] = [
    { label: "Acertos médios / jogo", a: runA.after_metrics.avgHits, b: runB.after_metrics.avgHits, fmt: v => v.toFixed(3), higherIsBetter: true },
    { label: "Taxa faixa premiável (%)", a: runA.after_metrics.premiumHitRate * 100, b: runB.after_metrics.premiumHitRate * 100, fmt: v => `${v.toFixed(2)}%`, higherIsBetter: true },
    { label: "Quality Score", a: runA.after_metrics.qualityScore, b: runB.after_metrics.qualityScore, fmt: v => v.toFixed(1), higherIsBetter: true },
    { label: "Melhor acerto", a: runA.after_metrics.maxHits, b: runB.after_metrics.maxHits, fmt: v => `${v}`, higherIsBetter: true },
  ];
  const gainRows: MetricRow[] = [
    { label: "Δ acertos (Titan − Base)", a: runA.delta.avgHits, b: runB.delta.avgHits, fmt: v => v.toFixed(3), higherIsBetter: true },
    { label: "Δ faixa premiável (pp)", a: runA.delta.premiumHitRate * 100, b: runB.delta.premiumHitRate * 100, fmt: v => `${v.toFixed(2)}pp`, higherIsBetter: true },
    { label: "Δ Quality Score", a: runA.delta.qualityScore, b: runB.delta.qualityScore, fmt: v => v.toFixed(1), higherIsBetter: true },
  ];

  const sameLottery = runA.lottery_id === runB.lottery_id;

  return (
    <Card className="bg-card/60 border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitCompareArrows className="w-4 h-4 text-primary" />
            Comparação lado a lado
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Fechar">
            <X className="w-4 h-4" />
          </Button>
        </div>
        {!sameLottery && (
          <p className="text-[11px] text-amber-500 mt-1">
            Atenção: execuções de modalidades diferentes — deltas absolutos podem não ser diretamente comparáveis.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: "A", run: runA },
            { key: "B", run: runB },
          ].map(({ key, run }) => (
            <div key={key} className="rounded border border-border/40 bg-muted/10 px-3 py-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs text-muted-foreground">Execução {key}</span>
                <Badge variant={run.improved ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                  {run.improved ? "Titan OK" : "Sem ganho"}
                </Badge>
              </div>
              <div className="text-sm font-medium">{lotteryLabel(run.lottery_id)}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {fmtDate(run.created_at)} · {run.draws_evaluated} sorteios · lookback {run.lookback}
              </div>
            </div>
          ))}
        </div>

        <MetricTable title="Baseline (aleatório)" rows={baselineRows} />
        <MetricTable title="Titan (motor profissional)" rows={titanRows} />
        <MetricTable title="Ganho Titan vs Baseline" rows={gainRows} />
      </CardContent>
    </Card>
  );
}
