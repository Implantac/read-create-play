import { memo, useMemo, useState } from "react";
import { MatrixRow } from "@/engine/matrix-analysis";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, TrendingUp, TrendingDown, Minus, Filter } from "lucide-react";

interface Props {
  data: MatrixRow[];
}

type SortKey = "rank" | "number" | "score" | "freqTotal" | "freqRecent30" | "currentDelay" | "trend";
type FilterMode = "all" | "top" | "delayed" | "hot";

const TrendIcon = ({ trend }: { trend: "up" | "stable" | "down" }) => {
  if (trend === "up") return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
  if (trend === "down") return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
};

const SignalDot = ({ signal }: { signal: "green" | "yellow" | "red" }) => {
  const colors = {
    green: "bg-emerald-400 shadow-emerald-400/40",
    yellow: "bg-amber-400 shadow-amber-400/40",
    red: "bg-red-400 shadow-red-400/40",
  };
  return <span className={`inline-block w-3 h-3 rounded-full shadow-lg ${colors[signal]}`} />;
};

export const MatrizAnaliseTable = memo(function MatrizAnaliseTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");

  const filtered = useMemo(() => {
    let rows = [...data];
    switch (filter) {
      case "top": rows = rows.filter(r => r.signal === "green"); break;
      case "delayed": rows = rows.filter(r => r.currentDelay >= r.avgDelay); break;
      case "hot": rows = rows.filter(r => r.trend === "up"); break;
    }
    rows.sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      if (sortKey === "trend") {
        const order = { up: 3, stable: 2, down: 1 };
        return sortAsc ? order[a.trend] - order[b.trend] : order[b.trend] - order[a.trend];
      }
      return sortAsc ? av - bv : bv - av;
    });
    return rows;
  }, [data, sortKey, sortAsc, filter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === "rank"); }
  };

  const filters: { label: string; value: FilterMode }[] = [
    { label: "Todas", value: "all" },
    { label: "🟢 Top", value: "top" },
    { label: "⏳ Atrasadas", value: "delayed" },
    { label: "🔥 Quentes", value: "hot" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {filters.map(f => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "default" : "outline"}
            onClick={() => setFilter(f.value)}
            className="h-7 text-xs px-3"
          >
            {f.label}
          </Button>
        ))}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} dezenas</span>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              {([
                ["rank", "#"],
                ["number", "Dezena"],
                ["score", "Score"],
                ["freqTotal", "Freq. Total"],
                ["freqRecent30", "Freq. 30"],
                ["currentDelay", "Atraso"],
                ["trend", "Tendência"],
              ] as [SortKey, string][]).map(([key, label]) => (
                <TableHead key={key} className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort(key)}>
                  <span className="flex items-center gap-1">
                    {label}
                    <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                  </span>
                </TableHead>
              ))}
              <TableHead>Farol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(row => (
              <TableRow key={row.number} className="hover:bg-muted/20 transition-colors">
                <TableCell className="font-mono text-xs text-muted-foreground">{row.rank}º</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${
                    row.signal === "green" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" :
                    row.signal === "red" ? "bg-red-500/15 text-red-400 border border-red-500/20" :
                    "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                  }`}>
                    {String(row.number).padStart(2, "0")}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          row.score >= 70 ? "bg-emerald-400" : row.score >= 40 ? "bg-amber-400" : "bg-red-400"
                        }`}
                        style={{ width: `${row.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold font-mono">{row.score}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono">{row.freqTotal}</TableCell>
                <TableCell className="text-xs font-mono">{row.freqRecent30}</TableCell>
                <TableCell className="text-xs font-mono">{row.currentDelay}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <TrendIcon trend={row.trend} />
                    <span className="text-[10px] text-muted-foreground capitalize">{
                      row.trend === "up" ? "Subindo" : row.trend === "down" ? "Caindo" : "Estável"
                    }</span>
                  </div>
                </TableCell>
                <TableCell><SignalDot signal={row.signal} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
