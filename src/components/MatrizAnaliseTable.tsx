import { memo, useMemo, useState } from "react";
import { MatrixRow } from "@/engine/matrix-analysis";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus, Filter, TableProperties } from "lucide-react";

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

const SignalBadge = ({ signal }: { signal: "green" | "yellow" | "red" }) => {
  const config = {
    green: { label: "Alta", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20" },
    yellow: { label: "Neutra", className: "bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/20" },
    red: { label: "Baixa", className: "bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/20" },
  };
  const c = config[signal];
  return <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-mono ${c.className}`}>{c.label}</Badge>;
};

const ScoreBar = ({ score }: { score: number }) => {
  const color = score >= 70 ? "from-emerald-500 to-emerald-400" : score >= 40 ? "from-amber-500 to-amber-400" : "from-red-500 to-red-400";
  const bgColor = score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-bold font-mono w-7 text-right ${bgColor}`}>{score}</span>
    </div>
  );
};

const SortIcon = ({ active, asc }: { active: boolean; asc: boolean }) => {
  if (!active) return <ArrowUpDown className="w-3 h-3 text-muted-foreground" />;
  return asc ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />;
};

/** Sparkline de presença nos últimos 30 sorteios.
 *  pattern[0] = mais recente. Renderiza barras: cheia se saiu, vazia se não. */
const Sparkline = ({ pattern }: { pattern: boolean[] }) => {
  // Reverte para ordem cronológica (esquerda = antigo, direita = recente)
  const ordered = [...pattern].reverse();
  const hits = pattern.filter(Boolean).length;
  const total = pattern.length || 1;
  const intensity = hits / total;
  const colorClass =
    intensity >= 0.4 ? "bg-emerald-400" : intensity >= 0.2 ? "bg-amber-400" : "bg-red-400/70";
  return (
    <div
      className="flex items-end gap-[1px] h-6 w-[78px]"
      title={`${hits}/${total} aparições nos últimos sorteios`}
    >
      {ordered.map((hit, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm transition-colors ${
            hit ? colorClass : "bg-muted/30"
          }`}
          style={{ height: hit ? "100%" : "25%" }}
        />
      ))}
    </div>
  );
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
      if (sortKey === "trend") {
        const order = { up: 3, stable: 2, down: 1 };
        return sortAsc ? order[a.trend] - order[b.trend] : order[b.trend] - order[a.trend];
      }
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return sortAsc ? av - bv : bv - av;
    });
    return rows;
  }, [data, sortKey, sortAsc, filter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === "rank"); }
  };

  const filters: { label: string; value: FilterMode; count: number }[] = [
    { label: "Todas", value: "all", count: data.length },
    { label: "🟢 Top", value: "top", count: data.filter(r => r.signal === "green").length },
    { label: "⏳ Atrasadas", value: "delayed", count: data.filter(r => r.currentDelay >= r.avgDelay).length },
    { label: "🔥 Quentes", value: "hot", count: data.filter(r => r.trend === "up").length },
  ];

  const columns: [SortKey, string][] = [
    ["rank", "#"],
    ["number", "Dezena"],
    ["score", "Score"],
    ["freqTotal", "Freq. Total"],
    ["freqRecent30", "Freq. 30"],
    ["currentDelay", "Atraso"],
    ["trend", "Tendência"],
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <TableProperties className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Ranking Completo</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Classificação detalhada de todas as dezenas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {filters.map(f => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "default" : "outline"}
            onClick={() => setFilter(f.value)}
            className="h-7 text-xs px-3 gap-1.5"
          >
            {f.label}
            <span className="text-[10px] opacity-70">({f.count})</span>
          </Button>
        ))}
        <span className="text-xs text-muted-foreground ml-auto font-mono">{filtered.length} resultados</span>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden glass-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              {columns.map(([key, label]) => (
                <TableHead
                  key={key}
                  className="cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors"
                  onClick={() => toggleSort(key)}
                >
                  <span className="flex items-center gap-1.5">
                    {label}
                    <SortIcon active={sortKey === key} asc={sortAsc} />
                  </span>
                </TableHead>
              ))}
              <TableHead className="whitespace-nowrap">Últimos 30</TableHead>
              <TableHead>Farol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row, i) => (
              <TableRow
                key={row.number}
                className={`hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "bg-transparent" : "bg-muted/5"}`}
              >
                <TableCell className="font-mono text-xs text-muted-foreground w-12">
                  <span className={`${row.rank <= 3 ? "text-amber-400 font-bold" : ""}`}>
                    {row.rank}º
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    row.signal === "green"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10"
                      : row.signal === "red"
                      ? "bg-red-500/15 text-red-400 border border-red-500/20 shadow-sm shadow-red-500/10"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-500/10"
                  }`}>
                    {String(row.number).padStart(2, "0")}
                  </span>
                </TableCell>
                <TableCell>
                  <ScoreBar score={row.score} />
                </TableCell>
                <TableCell className="text-xs font-mono">{row.freqTotal}</TableCell>
                <TableCell className="text-xs font-mono">{row.freqRecent30}</TableCell>
                <TableCell>
                  <span className={`text-xs font-mono ${
                    row.currentDelay >= row.avgDelay ? "text-red-400" : "text-muted-foreground"
                  }`}>
                    {row.currentDelay}
                    {row.currentDelay >= row.avgDelay && (
                      <span className="text-[9px] ml-1 text-red-400/70">⚠</span>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <TrendIcon trend={row.trend} />
                    <span className="text-[10px] text-muted-foreground">{
                      row.trend === "up" ? "Subindo" : row.trend === "down" ? "Caindo" : "Estável"
                    }</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Sparkline pattern={row.recentPattern} />
                </TableCell>
                <TableCell>
                  <SignalBadge signal={row.signal} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
