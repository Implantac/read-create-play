import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Save, Flame, Layers, History, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  signals?: { label: string; ok: boolean; hint: string }[];
}

const LOTOFACIL_CORNERS = [1, 5, 21, 25];

function computeLotofacilSignals(nums: number[], draws: DrawResult[]): Row["signals"] {
  const set = new Set(nums);
  const frame = new Set([1,2,3,4,5,21,22,23,24,25,6,11,16,10,15,20]);
  const frameCount = nums.filter((n) => frame.has(n)).length;
  const last = draws[0]?.numbers ?? [];
  const reps = last.filter((n) => set.has(n)).length;
  const sorted = [...nums].sort((a, b) => a - b);
  const hasPair = sorted.some((n, i) => i > 0 && n - sorted[i - 1] === 1);
  const cols = new Set(nums.map((n) => (n - 1) % 5));
  const hasCorner = LOTOFACIL_CORNERS.some((c) => set.has(c));
  return [
    { label: `Moldura ${frameCount}`, ok: frameCount >= 8 && frameCount <= 11, hint: "Ideal 8-11" },
    { label: `Repete ${reps}`, ok: reps >= 7 && reps <= 11, hint: "Ideal 7-11 do sorteio anterior" },
    { label: hasPair ? "Consec. ✓" : "Consec. ✗", ok: hasPair, hint: "≥1 par consecutivo (~97% dos sorteios)" },
    { label: `${cols.size}/5 col.`, ok: cols.size === 5, hint: "Cobertura das 5 colunas" },
    { label: hasCorner ? "Canto ✓" : "Canto ✗", ok: hasCorner, hint: "Âncora física (1, 5, 21, 25)" },
  ];
}

function computeDecadeSignals(nums: number[], draws: DrawResult[], config: LotteryConfig): Row["signals"] {
  const sum = nums.reduce((a, b) => a + b, 0);
  const decades = new Set(nums.map((n) => Math.floor((n - 1) / 10)));
  const totalDecades = Math.ceil(config.numbers / 10);
  const odd = nums.filter((n) => n % 2 === 1).length;
  const sorted = [...nums].sort((a, b) => a - b);
  const hasConsec = sorted.some((n, i) => i > 0 && n - sorted[i - 1] === 1);
  const last = draws[0]?.numbers ?? [];
  const reps = last.filter((n) => nums.includes(n)).length;
  // ideal sum ≈ pick * (maxNumber + 1) / 2, tolerate ±15%
  const idealSum = (config.pick * (config.numbers + 1)) / 2;
  const sumOk = Math.abs(sum - idealSum) / idealSum <= 0.15;
  const parityOk = odd >= Math.floor(config.pick / 2) - 1 && odd <= Math.ceil(config.pick / 2) + 1;
  return [
    { label: `Soma ${sum}`, ok: sumOk, hint: `Ideal ≈ ${Math.round(idealSum)} (±15%)` },
    { label: `${decades.size}/${totalDecades} dez.`, ok: decades.size >= Math.min(totalDecades, config.pick - 1), hint: "Cobertura de dezenas" },
    { label: `${odd}P/${config.pick - odd}I`, ok: parityOk, hint: "Equilíbrio par/ímpar" },
    { label: hasConsec ? "Consec. ✓" : "Sem consec.", ok: true, hint: "Padrão observado (informativo)" },
    { label: `Repete ${reps}`, ok: reps <= Math.ceil(config.pick / 2), hint: "Repetição moderada do último sorteio" },
  ];
}

const BATCH_BY_LOTTERY: Record<string, number> = {
  lotofacil: 30, // filtros mais rígidos → lote maior p/ selecionar top 3 de alta qualidade
  megasena: 12,
  quina: 12,
  duplasena: 12,
  timemania: 12,
  diadesorte: 10,
  lotomania: 8,
};
const TOP_N = 3;
const ACUMULOU_MULT = 2; // dobra o lote no Modo Acumulou
const ACUMULOU_TOP = 5; // devolve top 5 quando acumulado

export function JackpotFocusPanel({ stats, draws, config, selectedLottery }: Props) {
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [acumulou, setAcumulou] = useState(false);
  const { saveBet } = useSavedBets(selectedLottery);
  const navigate = useNavigate();

  const jackpot = useMemo(() => JACKPOT_BY_LOTTERY[selectedLottery], [selectedLottery]);
  const baseBatch = BATCH_BY_LOTTERY[selectedLottery] ?? 10;
  const BATCH = acumulou ? baseBatch * ACUMULOU_MULT : baseBatch;
  const topN = acumulou ? ACUMULOU_TOP : TOP_N;

  if (!jackpot) return null;

  const unionBase = useMemo(() => {
    const set = new Set<number>();
    rows.forEach((r) => r.numbers.forEach((n) => set.add(n)));
    return Array.from(set).sort((a, b) => a - b);
  }, [rows]);

  const sendToFechamento = () => {
    if (unionBase.length < config.pick + 1) {
      toast.error(`União do Top ${rows.length} tem só ${unionBase.length} números. Rode novamente ou salve individualmente.`);
      return;
    }
    navigate("/fechamento-universal", { state: { baseNumbers: unionBase, fromGerador: true } });
    toast.success(`Base de ${unionBase.length} números enviada ao Fechamento Universal.`);
  };

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
          const signals = selectedLottery === "lotofacil"
            ? computeLotofacilSignals(g, draws)
            : computeDecadeSignals(g, draws, config);
          scored.push({ numbers: g, score: q.overall, grade: q.grade, strengths: q.strengths ?? [], signals });
        }
        scored.sort((a, b) => b.score - a.score);
        setRows(scored.slice(0, topN));
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
          <div className="flex items-center gap-2 flex-wrap">
            {rows.length > 0 && (
              <>
                <Button size="sm" variant="outline" onClick={sendToFechamento} className="gap-2">
                  <Layers className="w-4 h-4" /> Enviar união ao Fechamento ({unionBase.length})
                </Button>
                <Button size="sm" variant="outline" onClick={saveAll} className="gap-2">
                  <Save className="w-4 h-4" /> Salvar Top {rows.length}
                </Button>
              </>
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
                className={`rounded-lg border p-3 flex flex-col gap-2 ${
                  i === 0 ? "border-primary/50 bg-primary/[0.05]" : "border-border/60 bg-card"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-3">
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
                    <QuickBacktestDialog
                      numbers={r.numbers}
                      lotteryId={selectedLottery}
                      trigger={
                        <Button size="icon" variant="outline" title="Backtest histórico">
                          <History className="w-4 h-4" />
                        </Button>
                      }
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      title="Salvar jogo"
                      onClick={async () => {
                        await saveBet({ numbers: r.numbers, strategy: jackpot.name, score: r.score, grade: r.grade });
                        toast.success("Jogo salvo!");
                      }}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {r.signals && r.signals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/40">
                    {r.signals.map((s, si) => (
                      <span
                        key={si}
                        title={s.hint}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          s.ok
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-destructive/30 bg-destructive/5 text-destructive/80"
                        }`}
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
