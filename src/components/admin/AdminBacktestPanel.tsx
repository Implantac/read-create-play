/**
 * Admin — Backtest Panel
 * Compara "antes" (geração aleatória) vs "depois" (motor profissional Titan)
 * contra os últimos 200 sorteios oficiais de cada modalidade.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FlaskConical, Loader2, ArrowUpRight, ArrowDownRight, Target } from "lucide-react";
import { toast } from "sonner";
import { LOTTERIES } from "@/data/lotteries";
import { fetchDraws } from "@/services/api/lottery";
import { computeFrequencyStats } from "@/engine/stats/statistics";
import { generateGames } from "@/ai/generators/universalGameGenerator";
import { runBacktest, compareStrategies, type BetGenerator, type BacktestComparison } from "@/engine/validation/backtestRunner";

const LOOKBACK = 200;

function randomGenerator(pick: number, totalNumbers: number): BetGenerator {
  return () => {
    const pool = Array.from({ length: totalNumbers }, (_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, pick).sort((a, b) => a - b);
  };
}

function titanGenerator(lotteryId: string, totalNumbers: number): BetGenerator {
  return (historical) => {
    const stats = computeFrequencyStats(historical, totalNumbers);
    const games = generateGames({
      lotteryId,
      count: 1,
      riskProfile: "balanced",
      filters: {
        avoidSequences: true,
        balanceParity: true,
        balanceHighLow: true,
        prioritizeHot: false,
        prioritizeCold: false,
        frameCenter: false,
        limitRepetition: true,
      },
      stats,
      draws: historical,
    });
    return games[0]?.numbers ?? [];
  };
}

export function AdminBacktestPanel() {
  const [lotteryId, setLotteryId] = useState<string>("lotofacil");
  const [running, setRunning] = useState(false);
  const [comparison, setComparison] = useState<BacktestComparison | null>(null);
  const [progress, setProgress] = useState<string>("");

  const run = async () => {
    setRunning(true);
    setComparison(null);
    try {
      const lottery = LOTTERIES.find(l => l.id === lotteryId)!;
      setProgress(`Carregando últimos ${LOOKBACK + 50} sorteios de ${lottery.name}...`);
      const { draws } = await fetchDraws(lotteryId, LOOKBACK + 50);
      const drawResults = draws;
      if (drawResults.length < 50) {
        toast.error(`Poucos sorteios disponíveis (${drawResults.length}). Mínimo 50.`);
        return;
      }
      const lookback = Math.min(LOOKBACK, drawResults.length - 10);

      setProgress(`Rodando baseline vs Titan em ${lookback} sorteios de ${lottery.name}...`);
      await new Promise(r => setTimeout(r, 30));
      const cmp = compareStrategies(
        drawResults,
        randomGenerator(lottery.pick, lottery.numbers),
        titanGenerator(lotteryId, lottery.numbers),
        { lotteryId, lookback },
      );
      setComparison(cmp);
      toast.success(
        cmp.improved
          ? `Titan superou baseline em ${lottery.name}: +${cmp.before.avgHits > 0 ? ((cmp.delta.avgHits / cmp.before.avgHits) * 100).toFixed(1) : "0"}% acertos médios`
          : `Nenhum ganho estatístico em ${lottery.name}`
      );
    } catch (e) {
      console.error("[Backtest]", e);
      toast.error("Falha ao rodar backtest");
    } finally {
      setRunning(false);
      setProgress("");
    }
  };

  return (
    <Card className="bg-card/60 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          Backtest — Titan vs Aleatório
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Roda cada gerador contra os últimos {LOOKBACK} sorteios oficiais. Sem data leakage:
          cada geração vê apenas o histórico anterior ao sorteio-alvo.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground mb-1 block">Modalidade</label>
            <Select value={lotteryId} onValueChange={setLotteryId} disabled={running}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOTTERIES.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.icon} {l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={run} disabled={running} className="gap-2">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
            {running ? "Rodando..." : "Rodar backtest"}
          </Button>
        </div>

        {progress && (
          <div className="text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2">{progress}</div>
        )}

        {comparison && <ComparisonView cmp={comparison} />}
      </CardContent>
    </Card>
  );
}

function ComparisonView({ cmp }: { cmp: BacktestComparison }) {
  const rows = [
    { label: "Acertos médios / jogo", before: cmp.before.avgHits, after: cmp.after.avgHits, delta: cmp.delta.avgHits, fmt: (v: number) => v.toFixed(3) },
    { label: "Taxa de faixa premiável (%)", before: cmp.before.premiumHitRate * 100, after: cmp.after.premiumHitRate * 100, delta: cmp.delta.premiumHitRate * 100, fmt: (v: number) => `${v.toFixed(2)}%` },
    { label: "Quality Score (0-100)", before: cmp.before.qualityScore, after: cmp.after.qualityScore, delta: cmp.delta.qualityScore, fmt: (v: number) => v.toFixed(1) },
    { label: "Melhor acerto observado", before: cmp.before.maxHits, after: cmp.after.maxHits, delta: cmp.after.maxHits - cmp.before.maxHits, fmt: (v: number) => `${v}` },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant={cmp.improved ? "default" : "secondary"} className="gap-1">
          <Target className="w-3 h-3" />
          {cmp.improved ? "Titan supera baseline" : "Sem ganho significativo"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {cmp.before.drawsEvaluated} sorteios avaliados
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs text-muted-foreground">
              <th className="text-left py-2 pr-2">Métrica</th>
              <th className="text-right px-2">Antes (aleatório)</th>
              <th className="text-right px-2">Depois (Titan)</th>
              <th className="text-right pl-2">Δ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const positive = r.delta > 0;
              const neutral = Math.abs(r.delta) < 1e-6;
              return (
                <tr key={r.label} className="border-b border-border/30">
                  <td className="py-2 pr-2 text-muted-foreground">{r.label}</td>
                  <td className="text-right px-2 tabular-nums">{r.fmt(r.before)}</td>
                  <td className="text-right px-2 tabular-nums font-medium">{r.fmt(r.after)}</td>
                  <td className={`text-right pl-2 tabular-nums font-mono ${neutral ? "text-muted-foreground" : positive ? "text-emerald-500" : "text-red-500"}`}>
                    <span className="inline-flex items-center gap-0.5">
                      {!neutral && (positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
                      {r.fmt(Math.abs(r.delta))}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
