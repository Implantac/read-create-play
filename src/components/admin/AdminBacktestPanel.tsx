/**
 * Admin — Backtest Panel
 * Compara "antes" (geração aleatória) vs "depois" (motor profissional Titan)
 * contra os últimos 200 sorteios oficiais de cada modalidade.
 * Persiste cada execução em `backtest_runs` para comparações históricas.
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FlaskConical, Loader2, ArrowUpRight, ArrowDownRight, Target,
  History, Trash2, RefreshCw, GitCompareArrows,
} from "lucide-react";
import { toast } from "sonner";
import { LOTTERIES } from "@/data/lotteries";
import { fetchDraws } from "@/services/api/lottery";
import { computeFrequencyStats } from "@/engine/stats/statistics";
import { generateGames } from "@/ai/generators/universalGameGenerator";
import {
  compareStrategies,
  type BetGenerator,
  type BacktestComparison,
  type BacktestMetrics,
} from "@/engine/validation/backtestRunner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BacktestCompareView } from "./BacktestCompareView";

const LOOKBACK = 200;

interface BacktestRunRow {
  id: string;
  lottery_id: string;
  lookback: number;
  draws_evaluated: number;
  before_metrics: BacktestMetrics;
  after_metrics: BacktestMetrics;
  delta: BacktestComparison["delta"];
  improved: boolean;
  notes: string | null;
  created_at: string;
}

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
  const { user } = useAuth();
  const [lotteryId, setLotteryId] = useState<string>("lotofacil");
  const [running, setRunning] = useState(false);
  const [comparison, setComparison] = useState<BacktestComparison | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [history, setHistory] = useState<BacktestRunRow[]>([]);
  const [historyFilter, setHistoryFilter] = useState<string>("all");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) {
        toast.info("Máximo 2 execuções — desmarque uma para trocar");
        return prev;
      }
      return [...prev, id];
    });
  };

  const runA = history.find(r => r.id === selectedIds[0]);
  const runB = history.find(r => r.id === selectedIds[1]);


  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      let q = supabase
        .from("backtest_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (historyFilter !== "all") q = q.eq("lottery_id", historyFilter);
      const { data, error } = await q;
      if (error) throw error;
      setHistory((data ?? []) as unknown as BacktestRunRow[]);
    } catch (e) {
      console.error("[Backtest history]", e);
      toast.error("Falha ao carregar histórico");
    } finally {
      setLoadingHistory(false);
    }
  }, [historyFilter]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const run = async () => {
    setRunning(true);
    setComparison(null);
    try {
      const lottery = LOTTERIES.find(l => l.id === lotteryId)!;
      setProgress(`Carregando últimos ${LOOKBACK + 50} sorteios de ${lottery.name}...`);
      const { draws } = await fetchDraws(lotteryId, LOOKBACK + 50);
      if (draws.length < 50) {
        toast.error(`Poucos sorteios disponíveis (${draws.length}). Mínimo 50.`);
        return;
      }
      const lookback = Math.min(LOOKBACK, draws.length - 10);

      setProgress(`Rodando baseline vs Titan em ${lookback} sorteios de ${lottery.name}...`);
      await new Promise(r => setTimeout(r, 30));
      const cmp = compareStrategies(
        draws,
        randomGenerator(lottery.pick, lottery.numbers),
        titanGenerator(lotteryId, lottery.numbers),
        { lotteryId, lookback },
      );
      setComparison(cmp);

      // Persistência: salva execução para histórico admin.
      if (user?.id) {
        const { error: insErr } = await supabase.from("backtest_runs").insert({
          user_id: user.id,
          lottery_id: lotteryId,
          lookback,
          draws_evaluated: cmp.before.drawsEvaluated,
          before_metrics: cmp.before as any,
          after_metrics: cmp.after as any,
          delta: cmp.delta as any,
          improved: cmp.improved,
        });
        if (insErr) {
          console.error("[Backtest save]", insErr);
          toast.error("Backtest rodado, mas falhou ao salvar no histórico");
        } else {
          await loadHistory();
        }
      }

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

  const deleteRun = async (id: string) => {
    const { error } = await supabase.from("backtest_runs").delete().eq("id", id);
    if (error) {
      toast.error("Falha ao apagar execução");
      return;
    }
    setHistory(h => h.filter(r => r.id !== id));
    setSelectedIds(prev => prev.filter(x => x !== id));
    toast.success("Execução removida");
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card/60 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            Backtest — Titan vs Aleatório
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Roda cada gerador contra os últimos {LOOKBACK} sorteios oficiais. Sem data leakage:
            cada geração vê apenas o histórico anterior ao sorteio-alvo. Toda execução fica salva abaixo.
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

      <Card className="bg-card/60 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="w-4 h-4 text-primary" />
              Histórico de execuções
              <Badge variant="outline" className="ml-1">{history.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={selectedIds.length === 2 ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (selectedIds.length !== 2) {
                    toast.info("Selecione 2 execuções para comparar");
                    return;
                  }
                  setCompareOpen(true);
                }}
                className="h-8 gap-1"
                title="Comparar 2 execuções lado a lado"
              >
                <GitCompareArrows className="w-3.5 h-3.5" />
                Comparar ({selectedIds.length}/2)
              </Button>
              <Select value={historyFilter} onValueChange={setHistoryFilter}>
                <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as modalidades</SelectItem>
                  {LOTTERIES.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.icon} {l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={loadHistory} disabled={loadingHistory} className="h-8 gap-1">
                {loadingHistory ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {compareOpen && runA && runB && (
            <BacktestCompareView runA={runA} runB={runB} onClose={() => setCompareOpen(false)} />
          )}
          {loadingHistory ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma execução salva ainda. Rode um backtest acima para começar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-2">Data</th>
                    <th className="text-left px-2">Modalidade</th>
                    <th className="text-right px-2">Sorteios</th>
                    <th className="text-right px-2">Antes</th>
                    <th className="text-right px-2">Depois</th>
                    <th className="text-right px-2">Δ acertos</th>
                    <th className="text-right px-2">Qualidade</th>
                    <th className="text-center px-2">Resultado</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(row => {
                    const lottery = LOTTERIES.find(l => l.id === row.lottery_id);
                    const dHits = row.delta?.avgHits ?? 0;
                    const positive = dHits > 0;
                    const neutral = Math.abs(dHits) < 1e-6;
                    return (
                      <tr key={row.id} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="py-2 pr-2 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(row.created_at).toLocaleString("pt-BR", {
                            day: "2-digit", month: "2-digit", year: "2-digit",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="px-2 whitespace-nowrap">
                          {lottery ? `${lottery.icon} ${lottery.name}` : row.lottery_id}
                        </td>
                        <td className="text-right px-2 tabular-nums text-xs">{row.draws_evaluated}</td>
                        <td className="text-right px-2 tabular-nums text-xs">
                          {row.before_metrics?.avgHits?.toFixed(3) ?? "—"}
                        </td>
                        <td className="text-right px-2 tabular-nums text-xs font-medium">
                          {row.after_metrics?.avgHits?.toFixed(3) ?? "—"}
                        </td>
                        <td className={`text-right px-2 tabular-nums font-mono text-xs ${neutral ? "text-muted-foreground" : positive ? "text-emerald-500" : "text-red-500"}`}>
                          <span className="inline-flex items-center gap-0.5">
                            {!neutral && (positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
                            {Math.abs(dHits).toFixed(3)}
                          </span>
                        </td>
                        <td className="text-right px-2 tabular-nums text-xs">
                          {row.after_metrics?.qualityScore ?? 0}
                          <span className="text-muted-foreground">/{row.before_metrics?.qualityScore ?? 0}</span>
                        </td>
                        <td className="text-center px-2">
                          <Badge variant={row.improved ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                            {row.improved ? "OK" : "—"}
                          </Badge>
                        </td>
                        <td className="text-right pl-1">
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteRun(row.id)}
                            title="Apagar execução"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
          {cmp.before.drawsEvaluated} sorteios avaliados · salvo no histórico
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
