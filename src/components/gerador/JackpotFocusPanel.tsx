import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Save, Flame, Layers, History } from "lucide-react";
import { toast } from "sonner";
import { runIntelligentPipeline } from "@/ai/knowledge/strategiesLibrary";
import { evaluateBetQuality } from "@/engine/stats/bet-quality";
import type { NumberStats } from "@/engine/stats/statistics";
import type { DrawResult, LotteryConfig } from "@/data/lotteries";
import { useSavedBets } from "@/hooks/useSavedBets";
import { QuickBacktestDialog } from "@/components/lottery/QuickBacktestDialog";

interface Props {
  stats: NumberStats[];
  draws: DrawResult[];
  config: LotteryConfig;
  selectedLottery: string;
}

const JACKPOT_BY_LOTTERY: Record<string, { id: string; name: string; hint: string }> = {
  lotofacil: { id: "lotofacil_jackpot", name: "🎯 Lotofácil Jackpot", hint: "Caça 15 pontos" },
  megasena: { id: "mega_jackpot", name: "🔥 Mega Jackpot", hint: "Caça 6 pontos" },
  quina: { id: "quina_jackpot", name: "⭐ Quina Jackpot", hint: "Caça 5 pontos" },
  duplasena: { id: "duplasena_jackpot", name: "🎲 Dupla Sena Jackpot", hint: "2 sorteios" },
  timemania: { id: "timemania_jackpot", name: "⚽ Timemania Jackpot", hint: "Caça 7 pontos" },
  diadesorte: { id: "diadesorte_jackpot", name: "☀️ Dia de Sorte Jackpot", hint: "Caça 7 pontos" },
  lotomania: { id: "lotomania_jackpot", name: "🔥 Lotomania Jackpot", hint: "Caça 20 pontos" },
};

interface Row {
  numbers: number[];
  score: number;
  grade: string;
  strengths: string[];
}

const BATCH = 10;
const TOP_N = 3;

export function JackpotFocusPanel({ stats, draws, config, selectedLottery }: Props) {
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const { saveBet } = useSavedBets(selectedLottery);

  const jackpot = useMemo(() => JACKPOT_BY_LOTTERY[selectedLottery], [selectedLottery]);

  if (!jackpot) return null;

  const run = () => {
    if (draws.length === 0) {
      toast.error("Sincronize os concursos primeiro.");
      return;
    }
    setRunning(true);
    setTimeout(() => {
      try {
        const r = runIntelligentPipeline(stats, draws, selectedLottery, jackpot.id, BATCH);
        if (!r.games?.length) {
          toast.error("Nenhum jogo gerado.");
          setRunning(false);
          return;
        }
        const seen = new Set<string>();
        const scored: Row[] = [];
        for (const g of r.games) {
          const key = g.slice().sort((a, b) => a - b).join(",");
          if (seen.has(key)) continue;
          seen.add(key);
          const q = evaluateBetQuality(g, stats, config, draws);
          scored.push({ numbers: g, score: q.overall, grade: q.grade, strengths: q.strengths ?? [] });
        }
        scored.sort((a, b) => b.score - a.score);
        setRows(scored.slice(0, TOP_N));
      } catch (e) {
        console.error("[JackpotFocus]", e);
        toast.error("Falha ao gerar lote jackpot.");
      } finally {
        setRunning(false);
      }
    }, 700);
  };

  const saveAll = async () => {
    for (const r of rows) {
      await saveBet({ numbers: r.numbers, strategy: jackpot.name, score: r.score, grade: r.grade });
    }
    toast.success(`${rows.length} jogos jackpot salvos!`);
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.03] to-transparent">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight flex items-center gap-2">
                Modo Caça-Jackpot
                <Badge variant="outline" className="text-[10px] font-normal">{jackpot.hint}</Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Gera {BATCH} jogos com {jackpot.name} e devolve os {TOP_N} melhores pelo Titan Score.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {rows.length > 0 && (
              <Button size="sm" variant="outline" onClick={saveAll} className="gap-2">
                <Save className="w-4 h-4" /> Salvar Top {rows.length}
              </Button>
            )}
            <Button size="sm" variant="premium" onClick={run} disabled={running} className="gap-2">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
              {running ? "Caçando..." : "Rodar Caça-Jackpot"}
            </Button>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div
                key={i}
                className={`rounded-lg border p-3 flex flex-col md:flex-row md:items-center gap-3 ${
                  i === 0 ? "border-primary/50 bg-primary/[0.05]" : "border-border/60 bg-card"
                }`}
              >
                <div className="flex items-center gap-2 min-w-[90px]">
                  <span className="text-xs font-mono tabular-nums text-muted-foreground w-5">#{i + 1}</span>
                  {i === 0 && <Trophy className="w-3.5 h-3.5 text-primary" />}
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
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="font-mono tabular-nums">
                    {r.score}/100 · {r.grade}
                  </Badge>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={async () => {
                      await saveBet({ numbers: r.numbers, strategy: jackpot.name, score: r.score, grade: r.grade });
                      toast.success("Jogo salvo!");
                    }}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
