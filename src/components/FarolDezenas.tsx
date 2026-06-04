import { memo, useMemo, useState } from "react";
import { MatrixRow } from "@/engine/matrix-analysis";
import { Lightbulb, Eye, EyeOff, Save, Sparkles, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface Props {
  data: MatrixRow[];
  totalNumbers: number;
  /** Tamanho da aposta (ex: 6 Mega, 15 Lotofácil). Quando informado, ativa modo seleção. */
  pickSize?: number;
  /** Callback ao salvar a aposta selecionada. */
  onSaveBet?: (numbers: number[], strategy: string, score: number) => void;
}

export const FarolDezenas = memo(function FarolDezenas({ data, totalNumbers, pickSize, onSaveBet }: Props) {
  const [showScore, setShowScore] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const interactive = !!pickSize;

  const byNumber = useMemo(() => [...data].sort((a, b) => a.number - b.number), [data]);
  const cols = totalNumbers <= 25 ? 5 : totalNumbers <= 50 ? 10 : 10;

  const signalStyles = {
    green: {
      bg: "bg-emerald-500/15 border-emerald-500/25 hover:bg-emerald-500/30 hover:border-emerald-400/40",
      text: "text-emerald-300",
      scoreBg: "bg-emerald-500/20 text-emerald-300",
      ring: "ring-emerald-500/30",
    },
    yellow: {
      bg: "bg-amber-500/15 border-amber-500/25 hover:bg-amber-500/30 hover:border-amber-400/40",
      text: "text-amber-300",
      scoreBg: "bg-amber-500/20 text-amber-300",
      ring: "ring-amber-500/30",
    },
    red: {
      bg: "bg-red-500/15 border-red-500/25 hover:bg-red-500/30 hover:border-red-400/40",
      text: "text-red-300",
      scoreBg: "bg-red-500/20 text-red-300",
      ring: "ring-red-500/30",
    },
  };

  const counts = useMemo(() => ({
    green: data.filter(d => d.signal === "green").length,
    yellow: data.filter(d => d.signal === "yellow").length,
    red: data.filter(d => d.signal === "red").length,
  }), [data]);

  const toggleNumber = (n: number) => {
    if (!interactive) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(n)) {
        next.delete(n);
      } else {
        if (next.size >= pickSize!) {
          toast.warning(`Limite de ${pickSize} dezenas atingido`);
          return prev;
        }
        next.add(n);
      }
      return next;
    });
  };

  const fillTopScore = () => {
    if (!pickSize) return;
    const top = [...data].sort((a, b) => b.score - a.score).slice(0, pickSize).map(r => r.number);
    setSelected(new Set(top));
    toast.success(`${pickSize} dezenas com maior score selecionadas`);
  };

  const clearSelection = () => setSelected(new Set());

  const handleSave = () => {
    if (selected.size !== pickSize) {
      toast.error(`Selecione exatamente ${pickSize} dezenas`);
      return;
    }
    const numbers = [...selected].sort((a, b) => a - b);
    const selectedRows = data.filter(r => selected.has(r.number));
    const avgScore = Math.round(selectedRows.reduce((s, r) => s + r.score, 0) / selectedRows.length);
    onSaveBet?.(numbers, "Farol Manual", avgScore);
    toast.success("Aposta salva com sucesso!");
    setSelected(new Set());
  };

  const selectedScoreAvg = useMemo(() => {
    if (selected.size === 0) return 0;
    const rows = data.filter(r => selected.has(r.number));
    return Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length);
  }, [selected, data]);

  return (
    <div className="rounded-2xl glass-card border border-primary/20 p-6 space-y-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none opacity-50" />
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest italic">Farol de Dezenas Elite</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {interactive ? `Toque nas dezenas para montar sua aposta (${pickSize} números)` : "Classificação visual por score inteligente"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-3 text-[10px] mr-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/40" />
              {counts.green}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/40" />
              {counts.yellow}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm shadow-red-400/40" />
              {counts.red}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setShowScore(s => !s)}
            title={showScore ? "Ocultar scores" : "Mostrar scores"}
          >
            {showScore ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Legend bar (mobile) */}
      <div className="flex sm:hidden items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> {counts.green} verdes</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> {counts.yellow} amarelas</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> {counts.red} vermelhas</span>
      </div>

      {/* Selection toolbar */}
      {interactive && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-secondary/10 border border-border/40 relative z-10">
          <div className="flex items-center gap-2 mr-auto">
            <span className="text-xs text-muted-foreground">Selecionadas:</span>
            <span className={`text-sm font-bold font-mono ${
              selected.size === pickSize ? "text-emerald-400" : "text-foreground"
            }`}>
              {selected.size}/{pickSize}
            </span>
            {selected.size > 0 && (
              <span className="text-[10px] text-muted-foreground ml-2">
                Score médio: <strong className="text-amber-400">{selectedScoreAvg}</strong>
              </span>
            )}
          </div>
          <Button size="sm" variant="outline" className="h-8 px-4 rounded-xl font-black uppercase tracking-widest text-[9px] border-border/60 bg-background/50 hover:bg-primary/10 text-muted-foreground transition-all" onClick={fillTopScore}>
            <Sparkles className="w-3 h-3 mr-1.5" />
            Top {pickSize}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-4 rounded-xl font-black uppercase tracking-widest text-[9px] border-border/60 bg-background/50 hover:bg-red-500/10 text-muted-foreground transition-all"
            onClick={clearSelection}
            disabled={selected.size === 0}
          >
            <X className="w-3 h-3 mr-1.5" />
            Limpar
          </Button>
          <Button
            size="sm"
            className="h-8 px-6 rounded-xl gradient-brand text-primary-foreground font-black uppercase tracking-widest text-[9px] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            onClick={handleSave}
            disabled={selected.size !== pickSize}
          >
            <Save className="w-3 h-3 mr-1.5" />
            Salvar Matriz
          </Button>
        </div>
      )}

      <TooltipProvider delayDuration={200}>
        <div className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {byNumber.map(r => {
            const s = signalStyles[r.signal];
            const isSelected = selected.has(r.number);
            return (
              <Tooltip key={r.number}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => toggleNumber(r.number)}
                    disabled={!interactive}
                    className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 hover:z-20 hover:shadow-2xl hover:shadow-black/40 hover:ring-2 ${s.bg} ${s.ring} ${
                      interactive ? "cursor-pointer active:scale-90" : "cursor-default"
                    } ${
                      isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-2xl shadow-primary/40 z-10" : "shadow-sm shadow-black/20"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-md">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
                      </span>
                    )}
                    <span className={`text-sm font-bold font-mono leading-none ${s.text}`}>
                      {String(r.number).padStart(2, "0")}
                    </span>
                    {showScore && (
                      <span className={`text-[8px] font-mono mt-0.5 px-1 rounded ${s.scoreBg}`}>
                        {r.score}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold">Dezena {String(r.number).padStart(2, "0")}</p>
                    <p>Rank: <strong>{r.rank}º</strong> • Score: <strong>{r.score}</strong></p>
                    <p>Freq: {r.freqTotal}x • Atraso: {r.currentDelay}</p>
                    <p>Tendência: {r.trend === "up" ? "↑ Subindo" : r.trend === "down" ? "↓ Caindo" : "→ Estável"}</p>
                    {interactive && (
                      <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/30 mt-1">
                        {isSelected ? "Clique para remover" : "Clique para selecionar"}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
});
