import { useMemo, useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Target, Trophy, History as HistoryIcon, Radar, Sparkles } from "lucide-react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import {
  matchBetAgainstDraw,
  getEstimatedPrize,
  getRealPrizeLabel,
  formatCurrency,
  getMaxPossibleHits,
} from "@/utils/lottery-utils";

type ScanWindow = "10" | "20" | "50" | "all";
const SCAN_OPTIONS: { value: ScanWindow; label: string }[] = [
  { value: "10", label: "Últimos 10" },
  { value: "20", label: "Últimos 20" },
  { value: "50", label: "Últimos 50" },
  { value: "all", label: "Histórico Total" },
];

interface Props {
  numbers: number[];
  trigger?: ReactNode;
  defaultConcurso?: number;
}

/**
 * "What-if" simulator — pick any past draw and see hits + earnings for the given bet.
 * Works for any lottery via useLotteryContext.
 */
export function DrawTestDialog({ numbers, trigger, defaultConcurso }: Props) {
  const { draws, drawsWithPrizes, selectedLottery, config } = useLotteryContext();
  const [open, setOpen] = useState(false);
  const [concurso, setConcurso] = useState<number | null>(
    defaultConcurso ?? draws[0]?.concurso ?? null
  );

  const prizeMap = useMemo(() => {
    const m = new Map<number, any>();
    drawsWithPrizes?.forEach(d => m.set(d.concurso, d.prizeTiers || null));
    return m;
  }, [drawsWithPrizes]);

  const selectedDraw = useMemo(
    () => draws.find(d => d.concurso === concurso) || null,
    [draws, concurso]
  );

  const result = useMemo(() => {
    if (!selectedDraw || numbers.length === 0) return null;
    const { hits, matched } = matchBetAgainstDraw(numbers, selectedDraw.numbers, selectedLottery);
    const estimated = getEstimatedPrize(selectedLottery, hits);
    const real = getRealPrizeLabel(prizeMap.get(selectedDraw.concurso), hits);
    return { hits, matched, estimated, real };
  }, [selectedDraw, numbers, selectedLottery, prizeMap]);

  // ─── Scan mode: aggregate over all draws in a window ──────────────────────
  const [scanWindow, setScanWindow] = useState<ScanWindow>("50");
  const scanResult = useMemo(() => {
    if (numbers.length === 0 || draws.length === 0) return null;
    const subset = scanWindow === "all" ? draws : draws.slice(0, parseInt(scanWindow, 10));
    const maxHits = getMaxPossibleHits(selectedLottery, numbers.length);
    const hitsByTier = new Map<number, number>();
    let bestHit = 0;
    let bestConcurso: number | null = null;
    let totalRealPrize = 0;
    let totalEstimatedPrize = 0;
    let prizedCount = 0;
    let closeMissCount = 0; // 1 number away from any prize tier

    subset.forEach(draw => {
      const { hits } = matchBetAgainstDraw(numbers, draw.numbers, selectedLottery);
      hitsByTier.set(hits, (hitsByTier.get(hits) || 0) + 1);
      if (hits > bestHit) { bestHit = hits; bestConcurso = draw.concurso; }
      const real = getRealPrizeLabel(prizeMap.get(draw.concurso), hits);
      const est = getEstimatedPrize(selectedLottery, hits);
      if (est) {
        prizedCount++;
        totalEstimatedPrize += est.value;
      }
      if (real) {
        const match = real.match(/R\$\s*([\d.,]+)/);
        if (match) {
          const val = parseFloat(match[1].replace(/\./g, "").replace(",", "."));
          if (!isNaN(val)) totalRealPrize += val;
        }
      }
      // Close-miss: would have prized with 1 more number
      const nextTierEst = getEstimatedPrize(selectedLottery, hits + 1);
      if (!est && nextTierEst) closeMissCount++;
    });

    const tiers = Array.from(hitsByTier.entries())
      .sort((a, b) => b[0] - a[0])
      .filter(([h]) => h > 0);

    return {
      totalDraws: subset.length,
      maxHits,
      bestHit,
      bestConcurso,
      prizedCount,
      closeMissCount,
      totalRealPrize,
      totalEstimatedPrize,
      tiers,
    };
  }, [numbers, draws, scanWindow, selectedLottery, prizeMap]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
            <Target className="w-3.5 h-3.5" />
            Testar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-primary" />
            Simular em sorteio — {config.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="gap-1.5">
              <Target className="w-3.5 h-3.5" /> Concurso único
            </TabsTrigger>
            <TabsTrigger value="scan" className="gap-1.5">
              <Radar className="w-3.5 h-3.5" /> Varredura
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4 mt-4">
            {/* Bet preview */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Sua aposta ({numbers.length} nº)
              </div>
            <div className="flex flex-wrap gap-1.5">
              {[...numbers].sort((a, b) => a - b).map(n => (
                <span
                  key={n}
                  className="w-8 h-8 rounded-full bg-muted/60 border border-border/60 flex items-center justify-center text-xs font-mono tabular-nums font-semibold"
                >
                  {String(n).padStart(2, "0")}
                </span>
              ))}
            </div>
          </div>

          {/* Draw selector */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Escolha o concurso ({draws.length} disponíveis)
            </div>
            <Select
              value={concurso ? String(concurso) : ""}
              onValueChange={(v) => setConcurso(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar concurso" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {draws.slice(0, 500).map(d => (
                  <SelectItem key={d.concurso} value={String(d.concurso)}>
                    Concurso {d.concurso} · {new Date(d.date).toLocaleDateString("pt-BR")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Result */}
          {selectedDraw && result && (
            <div className="space-y-3 p-4 rounded-lg border border-border/60 bg-muted/30">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Números sorteados
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[...selectedDraw.numbers].sort((a, b) => a - b).map(n => {
                    const hit = result.matched.includes(n);
                    return (
                      <span
                        key={n}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-mono tabular-nums font-semibold ${
                          hit
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background/60 border-border/60 text-muted-foreground"
                        }`}
                      >
                        {String(n).padStart(2, "0")}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Acertos
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-primary mt-0.5">
                    {result.hits}
                    <span className="text-sm text-muted-foreground font-normal">
                      {" "}/ {numbers.length}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Faturamento
                  </div>
                  <div className="text-sm font-semibold mt-1">
                    {result.real ? (
                      <span className="text-primary">{result.real}</span>
                    ) : result.estimated ? (
                      <span className="text-foreground">{result.estimated.label}</span>
                    ) : (
                      <span className="text-muted-foreground">Sem premiação nesta faixa</span>
                    )}
                  </div>
                  {result.real && (
                    <Badge variant="outline" className="mt-1 text-[9px] uppercase tracking-wider">
                      Valor oficial
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
