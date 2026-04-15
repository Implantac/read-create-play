import { memo, useMemo } from "react";
import { MatrixRow } from "@/engine/matrix-analysis";
import { Lightbulb } from "lucide-react";

interface Props {
  data: MatrixRow[];
  totalNumbers: number;
}

export const FarolDezenas = memo(function FarolDezenas({ data, totalNumbers }: Props) {
  // Re-sort by number for grid display
  const byNumber = useMemo(() => [...data].sort((a, b) => a.number - b.number), [data]);
  const cols = Math.min(totalNumbers, 10);

  const signalColors = {
    green: {
      bg: "bg-emerald-500/20 border-emerald-500/30 hover:bg-emerald-500/30",
      text: "text-emerald-300",
      glow: "shadow-emerald-500/20",
    },
    yellow: {
      bg: "bg-amber-500/20 border-amber-500/30 hover:bg-amber-500/30",
      text: "text-amber-300",
      glow: "shadow-amber-500/20",
    },
    red: {
      bg: "bg-red-500/20 border-red-500/30 hover:bg-red-500/30",
      text: "text-red-300",
      glow: "shadow-red-500/20",
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
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Farol de Dezenas</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Classificação visual por score inteligente</p>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> {counts.green} verdes</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> {counts.yellow} amarelas</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> {counts.red} vermelhas</span>
        </div>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {byNumber.map(r => {
          const c = signalColors[r.signal];
          return (
            <div
              key={r.number}
              className={`aspect-square rounded-xl border flex flex-col items-center justify-center cursor-default transition-all duration-200 hover:scale-110 hover:z-10 shadow-lg ${c.bg} ${c.glow}`}
              title={`Nº ${r.number} — Score: ${r.score} — Rank: ${r.rank}º`}
            >
              <span className={`text-sm font-bold font-mono ${c.text}`}>
                {String(r.number).padStart(2, "0")}
              </span>
              <span className="text-[9px] text-muted-foreground font-mono">{r.score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
