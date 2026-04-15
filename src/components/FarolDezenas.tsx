import { memo, useMemo, useState } from "react";
import { MatrixRow } from "@/engine/matrix-analysis";
import { Lightbulb, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  data: MatrixRow[];
  totalNumbers: number;
}

export const FarolDezenas = memo(function FarolDezenas({ data, totalNumbers }: Props) {
  const [showScore, setShowScore] = useState(true);
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

  return (
    <div className="rounded-xl glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Farol de Dezenas</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Classificação visual por score inteligente</p>
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

      <TooltipProvider delayDuration={200}>
        <div className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {byNumber.map(r => {
            const s = signalStyles[r.signal];
            return (
              <Tooltip key={r.number}>
                <TooltipTrigger asChild>
                  <div
                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center cursor-default transition-all duration-200 hover:scale-110 hover:z-10 hover:shadow-lg hover:ring-2 ${s.bg} ${s.ring}`}
                  >
                    <span className={`text-sm font-bold font-mono leading-none ${s.text}`}>
                      {String(r.number).padStart(2, "0")}
                    </span>
                    {showScore && (
                      <span className={`text-[8px] font-mono mt-0.5 px-1 rounded ${s.scoreBg}`}>
                        {r.score}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold">Dezena {String(r.number).padStart(2, "0")}</p>
                    <p>Rank: <strong>{r.rank}º</strong> • Score: <strong>{r.score}</strong></p>
                    <p>Freq: {r.freqTotal}x • Atraso: {r.currentDelay}</p>
                    <p>Tendência: {r.trend === "up" ? "↑ Subindo" : r.trend === "down" ? "↓ Caindo" : "→ Estável"}</p>
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
