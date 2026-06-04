import { memo, useMemo, useState, useRef, useCallback } from "react";
import { MatrixRow } from "@/engine/matrix-analysis";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus, Filter, TableProperties, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const config = {
    green: { label: t("matrix.signals.green"), className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20" },
    yellow: { label: t("matrix.signals.yellow"), className: "bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/20" },
    red: { label: t("matrix.signals.red"), className: "bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/20" },
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
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 50;

  const parentRef = useRef<HTMLDivElement>(null);

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

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    return filtered.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const rowVirtualizer = useVirtualizer({
    count: paginatedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Approximate row height
    overscan: 5,
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === "rank"); }
  };

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, []);

  const filters: { label: string; value: FilterMode; count: number }[] = [
    { label: t("matrix.filters.all"), value: "all", count: data.length },
    { label: `🟢 ${t("matrix.filters.top")}`, value: "top", count: data.filter(r => r.signal === "green").length },
    { label: `⏳ ${t("matrix.filters.delayed")}`, value: "delayed", count: data.filter(r => r.currentDelay >= r.avgDelay).length },
    { label: `🔥 ${t("matrix.filters.hot")}`, value: "hot", count: data.filter(r => r.trend === "up").length },
  ];

  const columns: [SortKey, string][] = [
    ["rank", t("matrix.columns.rank")],
    ["number", t("matrix.columns.number")],
    ["score", t("matrix.columns.score")],
    ["freqTotal", t("matrix.columns.freqTotal")],
    ["freqRecent30", t("matrix.columns.freqRecent30")],
    ["currentDelay", t("matrix.columns.currentDelay")],
    ["trend", t("matrix.columns.trend")],
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
            <TableProperties className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest italic">{t("matrix.title")}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-widest opacity-60">{t("matrix.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap p-4 rounded-2xl bg-secondary/10 border border-border/40">
        <Filter className="w-4 h-4 text-primary opacity-60" />
        {filters.map(f => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "default" : "outline"}
            onClick={() => setFilter(f.value)}
            className={`h-8 px-4 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${
              filter === f.value 
                ? "gradient-brand text-primary-foreground shadow-lg shadow-primary/20" 
                : "border-border/60 bg-background/50 hover:bg-primary/10 text-muted-foreground"
            }`}
          >
            {f.label}
            <span className="ml-1.5 opacity-60">[{f.count}]</span>
          </Button>
        ))}
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-auto opacity-40 italic">{t("matrix.active_found", { count: filtered.length })}</span>
      </div>


      <div className="rounded-2xl border border-border/40 overflow-hidden glass-card shadow-2xl relative group/table">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none opacity-50" />
        
        <div 
          ref={parentRef}
          className="overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <TableRow className="bg-secondary/40 hover:bg-secondary/40 border-b border-border/40">
                {columns.map(([key, label]) => (
                  <TableHead
                    key={key}
                    className="cursor-pointer select-none whitespace-nowrap hover:text-primary transition-colors py-4 px-4"
                    onClick={() => toggleSort(key)}
                  >
                    <span className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-muted-foreground">
                      {label}
                      <SortIcon active={sortKey === key} asc={sortAsc} />
                    </span>
                  </TableHead>
                ))}
                <TableHead className="whitespace-nowrap font-black text-[10px] uppercase tracking-widest text-muted-foreground py-4 px-4">{t("matrix.columns.moment")}</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground py-4 px-4">{t("matrix.columns.status")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = paginatedData[virtualRow.index];
                return (
                  <TableRow
                    key={row.number}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={`hover:bg-primary/5 transition-colors border-b border-border/20 group/row ${virtualRow.index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"}`}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground w-12 px-4 py-3">
                      <span className={`font-black italic ${row.rank <= 3 ? "text-amber-400 opacity-100" : "opacity-40"}`}>
                        {String(row.rank).padStart(2, '0')}
                      </span>
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black font-mono transition-all italic group-hover/row:scale-110 ${
                        row.signal === "green"
                          ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                          : row.signal === "red"
                          ? "bg-red-500/20 text-red-400 border-2 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                          : "bg-amber-500/20 text-amber-400 border-2 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
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
                          row.trend === "up" ? t("matrix.trends.up") : row.trend === "down" ? t("matrix.trends.down") : t("matrix.trends.stable")
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(0)}
            disabled={currentPage === 0}
            className="h-9 w-9 rounded-xl border-border/60 bg-background/50 hover:bg-primary/10"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="h-9 w-9 rounded-xl border-border/60 bg-background/50 hover:bg-primary/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1 mx-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Página</span>
            <span className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-black text-primary font-mono">
              {currentPage + 1}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">de {totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className="h-9 w-9 rounded-xl border-border/60 bg-background/50 hover:bg-primary/10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(totalPages - 1)}
            disabled={currentPage === totalPages - 1}
            className="h-9 w-9 rounded-xl border-border/60 bg-background/50 hover:bg-primary/10"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
});
