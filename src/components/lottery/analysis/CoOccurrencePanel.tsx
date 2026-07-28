import { useMemo, useState } from "react";
import type { DrawResult } from "@/data/lotteries";
import { Network, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  draws: DrawResult[];
  totalNumbers: number;
  /** Tamanho máx. da janela recente para o cálculo (default 100). */
  window?: number;
}

interface Combo {
  key: string;
  numbers: number[];
  count: number;
  lastConcurso: number | null;
  lift: number; // frequência observada / esperada
}

/**
 * Top Duplas e Trincas: padrões de co-ocorrência historicamente fortes.
 * Diagnóstico estatístico — não é previsão. Útil para ancorar aposta em pares/trios
 * que aparecem juntos com frequência acima do esperado ao acaso.
 */
export function CoOccurrencePanel({ draws, totalNumbers, window = 100 }: Props) {
  const [mode, setMode] = useState<"pairs" | "triples">("pairs");
  const [topN, setTopN] = useState(10);

  const { pairs, triples } = useMemo(() => {
    const recent = draws.slice(0, window);
    const pairCount = new Map<string, number>();
    const pairLast = new Map<string, number>();
    const tripleCount = new Map<string, number>();
    const tripleLast = new Map<string, number>();
    const singleCount = new Map<number, number>();

    recent.forEach((d) => {
      const nums = [...d.numbers].sort((a, b) => a - b);
      nums.forEach((n) => singleCount.set(n, (singleCount.get(n) ?? 0) + 1));
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          const k = `${nums[i]}-${nums[j]}`;
          pairCount.set(k, (pairCount.get(k) ?? 0) + 1);
          if (!pairLast.has(k)) pairLast.set(k, d.concurso);
          for (let l = j + 1; l < nums.length; l++) {
            const tk = `${nums[i]}-${nums[j]}-${nums[l]}`;
            tripleCount.set(tk, (tripleCount.get(tk) ?? 0) + 1);
            if (!tripleLast.has(tk)) tripleLast.set(tk, d.concurso);
          }
        }
      }
    });

    const N = recent.length || 1;
    const toArr = (map: Map<string, number>, lastMap: Map<string, number>, size: number): Combo[] =>
      Array.from(map.entries()).map(([k, count]) => {
        const nums = k.split("-").map(Number);
        // freq esperada assumindo independência aproximada
        const expected = nums.reduce((acc, n) => acc * ((singleCount.get(n) ?? 0) / N), 1) * N;
        const lift = expected > 0 ? count / expected : 0;
        return { key: k, numbers: nums, count, lastConcurso: lastMap.get(k) ?? null, lift };
      });

    const p = toArr(pairCount, pairLast, 2).sort((a, b) => b.count - a.count || b.lift - a.lift);
    const t = toArr(tripleCount, tripleLast, 3).sort((a, b) => b.count - a.count || b.lift - a.lift);
    return { pairs: p, triples: t };
  }, [draws, window]);

  const list = mode === "pairs" ? pairs.slice(0, topN) : triples.slice(0, topN);
  const winSize = Math.min(draws.length, window);

  return (
    <div className="rounded-xl glass-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Network className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Top Duplas & Trincas
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    Combinações que mais aparecem juntas na janela recente. Lift &gt; 1 indica
                    frequência acima do esperado ao acaso — padrão estatístico, não previsão.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Janela: últimos {winSize} sorteios · universo 1-{totalNumbers}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-md border border-border/60 overflow-hidden">
            <Button
              size="sm"
              variant={mode === "pairs" ? "default" : "ghost"}
              className="h-7 rounded-none text-[11px] px-2.5"
              onClick={() => setMode("pairs")}
            >
              Duplas
            </Button>
            <Button
              size="sm"
              variant={mode === "triples" ? "default" : "ghost"}
              className="h-7 rounded-none text-[11px] px-2.5"
              onClick={() => setMode("triples")}
            >
              Trincas
            </Button>
          </div>
          <div className="flex rounded-md border border-border/60 overflow-hidden">
            {[10, 20, 30].map((n) => (
              <Button
                key={n}
                size="sm"
                variant={topN === n ? "default" : "ghost"}
                className="h-7 rounded-none text-[11px] px-2"
                onClick={() => setTopN(n)}
              >
                Top {n}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          Sincronize concursos para calcular co-ocorrência.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
          {list.map((c, i) => (
            <div
              key={c.key}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                i < 3 ? "border-primary/40 bg-primary/[0.04]" : "border-border/50 bg-card"
              }`}
            >
              <span className="text-xs font-mono tabular-nums text-muted-foreground w-6">
                #{i + 1}
              </span>
              <div className="flex gap-1 flex-1 flex-wrap">
                {c.numbers.map((n) => (
                  <span
                    key={n}
                    className="w-7 h-7 rounded-full bg-muted/40 border border-border/60 flex items-center justify-center text-[11px] font-mono tabular-nums font-semibold"
                  >
                    {String(n).padStart(2, "0")}
                  </span>
                ))}
              </div>
              <Badge variant="outline" className="font-mono tabular-nums text-[10px]">
                {c.count}x
              </Badge>
              <Badge
                variant="outline"
                className={`font-mono tabular-nums text-[10px] ${
                  c.lift >= 1.15
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : c.lift < 0.85
                      ? "border-destructive/30 bg-destructive/5 text-destructive/80"
                      : ""
                }`}
                title="Lift = observado / esperado"
              >
                lift {c.lift.toFixed(2)}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
