/**
 * ClosingHistoryPanel — mostra os fechamentos arquivados no Motor Universal
 * do usuário, expandíveis para revisar parâmetros, métricas e jogos.
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sparkles, ChevronDown, ChevronUp, Trash2, Loader2, Target, Coins, Shield, Search, FilterX } from "lucide-react";
import { useClosingHistory, type ClosingHistoryRow } from "@/hooks/useClosingHistory";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const STRATEGY_LABELS: Record<string, string> = {
  greedy: "Guloso",
  hill_climbing: "Hill Climbing",
  simulated_annealing: "Simulated Annealing",
  genetic: "Genético",
  covering_design: "Covering Design",
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

type SortKey = "date_desc" | "date_asc" | "score_desc" | "games_asc" | "games_desc";

const DATE_RANGES: Record<string, number | null> = {
  all: null,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function ClosingHistoryPanel({ lotteryId }: { lotteryId: string }) {
  const { history, isLoading, deleteClosing } = useClosingHistory(lotteryId);
  const [openId, setOpenId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [strategy, setStrategy] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(0);
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const strategiesInHistory = useMemo(() => {
    const set = new Set<string>();
    history.forEach(h => set.add(h.strategy));
    return Array.from(set);
  }, [history]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const days = DATE_RANGES[dateRange];
    const cutoff = days ? now - days * 24 * 60 * 60 * 1000 : null;
    const searchNums = search
      .split(/[^\d]+/)
      .map(s => parseInt(s, 10))
      .filter(n => Number.isFinite(n) && n > 0);
    const searchLower = search.trim().toLowerCase();

    const out = history.filter(row => {
      if (strategy !== "all" && row.strategy !== strategy) return false;
      if (cutoff && new Date(row.created_at).getTime() < cutoff) return false;
      const overall = row.score?.overall ?? 0;
      if (overall < minScore) return false;

      if (searchLower) {
        const baseSet = new Set(row.base_numbers);
        const matchesNums = searchNums.length > 0 && searchNums.every(n => baseSet.has(n));
        const matchesText =
          (STRATEGY_LABELS[row.strategy] ?? row.strategy).toLowerCase().includes(searchLower) ||
          row.strategy.toLowerCase().includes(searchLower) ||
          fmtDate(row.created_at).toLowerCase().includes(searchLower);
        if (!matchesNums && !matchesText) return false;
      }
      return true;
    });

    out.sort((a, b) => {
      switch (sort) {
        case "date_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "score_desc":
          return (b.score?.overall ?? 0) - (a.score?.overall ?? 0);
        case "games_asc":
          return a.game_count - b.game_count;
        case "games_desc":
          return b.game_count - a.game_count;
        case "date_desc":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return out;
  }, [history, search, strategy, dateRange, minScore, sort]);

  const hasFilters =
    !!search || strategy !== "all" || dateRange !== "all" || minScore > 0 || sort !== "date_desc";

  const clearFilters = () => {
    setSearch(""); setStrategy("all"); setDateRange("all"); setMinScore(0); setSort("date_desc"); setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const paged = filtered.slice(pageStart, pageStart + pageSize);

  // Reset to page 1 when filters change
  const filterKey = `${search}|${strategy}|${dateRange}|${minScore}|${sort}|${pageSize}`;
  const lastKeyRef = useRef(filterKey);
  if (lastKeyRef.current !== filterKey) {
    lastKeyRef.current = filterKey;
    if (page !== 1) setTimeout(() => setPage(1), 0);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Fechamentos Salvos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nenhum fechamento arquivado ainda. Gere um no Motor Universal — ele
          será salvo automaticamente aqui.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" /> Fechamentos Salvos
          <Badge variant="secondary" className="ml-2">
            {filtered.length}
            {filtered.length !== history.length && <span className="opacity-60"> / {history.length}</span>}
          </Badge>
          {hasFilters && (
            <Button size="sm" variant="ghost" onClick={clearFilters} className="ml-auto h-7 px-2 text-xs">
              <FilterX className="h-3.5 w-3.5 mr-1" /> Limpar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por dezena (ex: 5 12 25), estratégia ou data…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={strategy} onValueChange={setStrategy}>
            <SelectTrigger><SelectValue placeholder="Estratégia" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as estratégias</SelectItem>
              {strategiesInHistory.map(s => (
                <SelectItem key={s} value={s}>{STRATEGY_LABELS[s] ?? s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer data</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 md:grid-cols-2 items-center">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Nota mínima</span>
              <span className="font-mono font-semibold text-foreground">{minScore}</span>
            </div>
            <Slider
              min={0} max={100} step={5}
              value={[minScore]}
              onValueChange={([v]) => setMinScore(v)}
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Mais recentes</SelectItem>
              <SelectItem value="date_asc">Mais antigos</SelectItem>
              <SelectItem value="score_desc">Maior nota</SelectItem>
              <SelectItem value="games_asc">Menos jogos</SelectItem>
              <SelectItem value="games_desc">Mais jogos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhum fechamento corresponde aos filtros.
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map(row => (
              <ClosingRow
                key={row.id}
                row={row}
                open={openId === row.id}
                onToggle={() => setOpenId(openId === row.id ? null : row.id)}
                onDelete={() => deleteClosing(row.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


function ClosingRow({
  row, open, onToggle, onDelete,
}: {
  row: ClosingHistoryRow;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const overall = row.score?.overall ?? 0;
  const guaranteed = row.validation?.guaranteedHits ?? 0;
  const meets = row.validation?.meetsGuarantee ?? false;
  return (
    <div className="rounded-lg border bg-muted/20">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
      >
        <Badge variant="outline" className="font-mono">
          {STRATEGY_LABELS[row.strategy] ?? row.strategy}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {row.game_count} jogos · {formatCurrency(Number(row.cost))}
          </p>
          <p className="text-xs text-muted-foreground">
            Meta {row.min_hits} · Garantia {guaranteed}{meets ? " ✓" : ""} · Nota {overall} · {fmtDate(row.created_at)}
          </p>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t p-3 space-y-3 text-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Metric icon={Target} label="Base" value={`${row.base_numbers.length} dezenas`} />
            <Metric icon={Shield} label="Meta acertos" value={String(row.min_hits)} />
            <Metric icon={Coins} label="Custo" value={formatCurrency(Number(row.cost))} />
            <Metric
              icon={Sparkles}
              label="Nota / Cobertura"
              value={`${overall} / ${(row.validation?.coveragePercent ?? 0).toFixed(0)}%`}
            />
          </div>

          <div>
            <p className="font-semibold mb-1">Dezenas-base</p>
            <div className="flex flex-wrap gap-1">
              {row.base_numbers.map(n => (
                <span key={n} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-mono">
                  {n.toString().padStart(2, "0")}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold mb-1">Jogos ({row.games.length})</p>
            <div className="max-h-56 overflow-auto space-y-1">
              {row.games.map((g, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-background">
                  <span className="text-muted-foreground font-mono w-6">#{i + 1}</span>
                  <div className="flex flex-wrap gap-1">
                    {g.map(n => (
                      <span key={n} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted font-mono">
                        {n.toString().padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={onDelete}
              className="text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  icon: Icon, label, value,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className={cn("rounded border bg-background/60 p-2")}>
      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="font-mono font-semibold text-sm">{value}</p>
    </div>
  );
}
