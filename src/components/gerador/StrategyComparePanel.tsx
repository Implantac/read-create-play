import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Scale, Save, Trophy, Layers, Download } from "lucide-react";
import { toast } from "sonner";
import { runIntelligentPipeline } from "@/ai/knowledge/strategiesLibrary";
import { evaluateBetQuality } from "@/engine/stats/bet-quality";
import type { NumberStats } from "@/engine/stats/statistics";
import type { DrawResult, LotteryConfig } from "@/data/lotteries";
import { useSavedBets } from "@/hooks/useSavedBets";

interface Props {
  stats: NumberStats[];
  draws: DrawResult[];
  config: LotteryConfig;
  selectedLottery: string;
  strategies: { id: string; name: string }[];
}

interface Row {
  id: string;
  name: string;
  numbers: number[];
  score: number;
  grade: string;
}

export function StrategyComparePanel({ stats, draws, config, selectedLottery, strategies }: Props) {
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const { saveBet } = useSavedBets(selectedLottery);
  const navigate = useNavigate();

  const pool = useMemo(
    () => strategies.filter((s) => ["balance", "hot_cold", "repetition", "frequency", "delay", "coverage"].includes(s.id)),
    [strategies]
  );

  const unionNumbers = useMemo(
    () => [...new Set(rows.flatMap((r) => r.numbers))].sort((a, b) => a - b),
    [rows]
  );

  const run = () => {
    if (draws.length === 0) {
      toast.error("Sincronize os concursos primeiro.");
      return;
    }
    setRunning(true);
    setTimeout(() => {
      try {
        const out: Row[] = [];
        for (const s of pool) {
          const r = runIntelligentPipeline(stats, draws, selectedLottery, s.id, 1);
          if (!r.games?.length) continue;
          const bet = r.games[0];
          const q = evaluateBetQuality(bet, stats, config, draws);
          out.push({ id: s.id, name: s.name, numbers: bet, score: q.overall, grade: q.grade });
        }
        out.sort((a, b) => b.score - a.score);
        setRows(out);
      } catch (e) {
        console.error("[Compare]", e);
        toast.error("Falha ao comparar estratégias.");
      } finally {
        setRunning(false);
      }
    }, 900);
  };

  const best = rows[0];

  return (
    <Card className="border-border/60">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight">Comparador de Estratégias</h3>
              <p className="text-xs text-muted-foreground">Gera 1 jogo por estratégia e ranqueia pelo Titan Score.</p>
            </div>
          </div>
          <Button size="sm" variant="premium" onClick={run} disabled={running} className="gap-2">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
            {running ? "Analisando..." : "Comparar Agora"}
          </Button>
        </div>

        {rows.length > 0 && (
          <div className="space-y-2">
            {rows.map((r, i) => {
              const isBest = r.id === best.id;
              const overlap = isBest
                ? r.numbers.length
                : r.numbers.filter((n) => best.numbers.includes(n)).length;
              const overlapPct = Math.round((overlap / config.pick) * 100);
              return (
                <div
                  key={r.id}
                  className={`rounded-lg border p-3 flex flex-col md:flex-row md:items-center gap-3 ${
                    isBest ? "border-primary/50 bg-primary/[0.04]" : "border-border/60 bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <span className="text-xs font-mono tabular-nums text-muted-foreground w-5">#{i + 1}</span>
                    {isBest && <Trophy className="w-3.5 h-3.5 text-primary" />}
                    <span className="text-sm font-medium">{r.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {r.numbers.map((n) => (
                      <span
                        key={n}
                        className="w-7 h-7 rounded-full bg-muted/40 border border-border/60 flex items-center justify-center text-[11px] font-mono tabular-nums font-semibold"
                      >
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className="font-mono tabular-nums">
                      {r.score}/100 · {r.grade}
                    </Badge>
                    {!isBest && (
                      <Badge variant="secondary" className="font-mono tabular-nums text-[10px]" title="Sobreposição com o vencedor">
                        ∩ {overlap} · {overlapPct}%
                      </Badge>
                    )}
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={async () => {
                        await saveBet({ numbers: r.numbers, strategy: r.name, score: r.score, grade: r.grade });
                        toast.success(`Jogo "${r.name}" salvo!`);
                      }}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {rows.length > 1 && (
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <div className="text-xs text-muted-foreground">
              União das estratégias: <span className="font-mono tabular-nums text-foreground font-semibold">{unionNumbers.length}</span> dezenas ·
              {" "}diversidade{" "}
              <span className="font-mono tabular-nums text-foreground font-semibold">
                {Math.round(((unionNumbers.length - config.pick) / (rows.length * config.pick - config.pick)) * 100) || 0}%
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={unionNumbers.length < config.pick}
              onClick={() => {
                if (unionNumbers.length < config.pick) {
                  toast.error(`Base insuficiente (${unionNumbers.length}/${config.pick}).`);
                  return;
                }
                navigate("/fechamento-universal", { state: { baseNumbers: unionNumbers, fromGerador: true } });
              }}
            >
              <Layers className="w-4 h-4" />
              Fechamento com União ({unionNumbers.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
