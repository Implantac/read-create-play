import { useMemo } from "react";
import type { DrawResult } from "@/data/lotteries";
import { Thermometer, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface Props {
  draws: DrawResult[];
  totalNumbers: number; // 25 para Lotofácil
  /** Janela para medir "pressão de retorno" (default 12) */
  window?: number;
}

interface Cell {
  number: number;
  lastSeen: number;           // concursos desde a última aparição (0 = saiu no último)
  windowFreq: number;         // frequência na janela recente
  pressure: number;           // 0..1 → quanto maior, mais "pressiona" o retorno
}

/**
 * Termômetro do Ciclo 1-25 (Lotofácil, mas funciona para qualquer universo pequeno).
 *
 * Ideia: quanto mais tempo sem sair + baixa freq na janela recente ⇒ maior a pressão
 * estatística de retorno no próximo sorteio. Isso é um DIAGNÓSTICO, não previsão.
 */
export function CycleThermometer({ draws, totalNumbers, window = 12 }: Props) {
  const cells = useMemo<Cell[]>(() => {
    const recent = draws.slice(0, window);
    const lastSeenMap = new Map<number, number>();
    const freqMap = new Map<number, number>();

    for (let n = 1; n <= totalNumbers; n++) {
      lastSeenMap.set(n, draws.length); // se não achar, assume máximo
      freqMap.set(n, 0);
    }

    // frequência na janela
    recent.forEach((d) => {
      d.numbers.forEach((n) => freqMap.set(n, (freqMap.get(n) ?? 0) + 1));
    });

    // lastSeen: percorre do mais recente até achar
    for (let n = 1; n <= totalNumbers; n++) {
      for (let i = 0; i < draws.length; i++) {
        if (draws[i].numbers.includes(n)) {
          lastSeenMap.set(n, i);
          break;
        }
      }
    }

    const maxLast = Math.max(1, ...Array.from(lastSeenMap.values()));
    const arr: Cell[] = [];
    for (let n = 1; n <= totalNumbers; n++) {
      const lastSeen = lastSeenMap.get(n) ?? maxLast;
      const windowFreq = freqMap.get(n) ?? 0;
      // pressão = 70% atraso normalizado + 30% ausência da janela
      const delayNorm = lastSeen / maxLast;
      const absenceNorm = 1 - windowFreq / window;
      const pressure = 0.7 * delayNorm + 0.3 * absenceNorm;
      arr.push({ number: n, lastSeen, windowFreq, pressure });
    }
    return arr;
  }, [draws, totalNumbers, window]);

  const topPressure = useMemo(
    () => [...cells].sort((a, b) => b.pressure - a.pressure).slice(0, 6),
    [cells],
  );

  const pressureColor = (p: number) => {
    // gradiente frio → quente
    if (p >= 0.75) return "bg-red-500/85 border-red-400 text-white shadow-[0_0_12px_rgba(239,68,68,0.45)]";
    if (p >= 0.55) return "bg-orange-500/75 border-orange-400 text-white";
    if (p >= 0.35) return "bg-amber-400/70 border-amber-300 text-black";
    if (p >= 0.2) return "bg-sky-400/40 border-sky-400/60 text-foreground";
    return "bg-muted/40 border-border/50 text-muted-foreground";
  };

  return (
    <div className="rounded-xl glass-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Thermometer className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Termômetro do Ciclo 1-{totalNumbers}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    Pressão = 70% do atraso normalizado + 30% da ausência na janela recente.
                    Quanto mais quente, maior a chance estatística de retorno — não é previsão.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Janela: últimos {window} sorteios · {draws.length} concursos analisados
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="w-3 h-3 rounded bg-muted/40 border border-border/50" /> frio
          <span className="w-3 h-3 rounded bg-sky-400/40 border border-sky-400/60 ml-1" />
          <span className="w-3 h-3 rounded bg-amber-400/70 border border-amber-300 ml-1" />
          <span className="w-3 h-3 rounded bg-orange-500/75 border border-orange-400 ml-1" />
          <span className="w-3 h-3 rounded bg-red-500/85 border border-red-400 ml-1" /> quente
        </div>
      </div>

      <TooltipProvider>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {cells.map((c) => (
            <Tooltip key={c.number}>
              <TooltipTrigger asChild>
                <div
                  className={`aspect-square rounded-md border flex items-center justify-center text-[11px] font-mono font-bold tabular-nums transition-transform hover:scale-105 cursor-help ${pressureColor(c.pressure)}`}
                >
                  {String(c.number).padStart(2, "0")}
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                <div className="font-semibold">Dezena {String(c.number).padStart(2, "0")}</div>
                <div>Atraso: {c.lastSeen} concurso(s)</div>
                <div>Freq. janela: {c.windowFreq}/{window}</div>
                <div>Pressão: {(c.pressure * 100).toFixed(0)}%</div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      <div className="pt-3 border-t border-border/40 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Top pressão de retorno
        </p>
        <div className="flex flex-wrap gap-1.5">
          {topPressure.map((c) => (
            <Badge
              key={c.number}
              variant="outline"
              className="font-mono tabular-nums text-[11px] border-red-400/40 bg-red-500/10 text-red-400"
            >
              {String(c.number).padStart(2, "0")} · {c.lastSeen}↑
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
