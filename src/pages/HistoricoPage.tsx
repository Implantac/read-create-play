import { useState, useMemo } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { History, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { motion } from "framer-motion";

const HistoricoPage = () => {
  const { config, draws } = useLotteryContext();
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterEven, setFilterEven] = useState<"all" | "majority-even" | "majority-odd">("all");
  const [page, setPage] = useState(0);
  const perPage = 50;

  const filtered = useMemo(() => {
    let result = [...draws];
    if (search.trim()) {
      const term = search.trim();
      if (/^\d+$/.test(term)) {
        const num = parseInt(term);
        result = result.filter(d => d.concurso === num || d.numbers.includes(num));
      }
    }
    if (filterEven === "majority-even") {
      result = result.filter(d => d.numbers.filter(n => n % 2 === 0).length > d.numbers.length / 2);
    } else if (filterEven === "majority-odd") {
      result = result.filter(d => d.numbers.filter(n => n % 2 !== 0).length > d.numbers.length / 2);
    }
    if (sortAsc) result.reverse();
    return result;
  }, [draws, search, sortAsc, filterEven]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico de Concursos"
        description={`Navegue por todos os resultados — ${config.name}`}
        icon={History}
        badge={draws.length > 0 ? `${filtered.length} resultados` : undefined}
      />
      <LotteryContextBanner />

      {draws.length === 0 ? (
        <EmptyState description="Importe os sorteios primeiro no Dashboard." />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center glass-card rounded-xl p-3 border border-border/30">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Buscar concurso ou dezena..."
                className="pl-8 h-9 text-xs bg-muted/30 border-border/50"
              />
            </div>
            <Button
              size="sm"
              variant={sortAsc ? "default" : "outline"}
              onClick={() => setSortAsc(!sortAsc)}
              className="text-xs gap-1 h-9"
            >
              {sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {sortAsc ? "Mais antigo" : "Mais recente"}
            </Button>
            {(["all", "majority-even", "majority-odd"] as const).map(f => (
              <Button
                key={f}
                size="sm"
                variant={filterEven === f ? "default" : "outline"}
                onClick={() => { setFilterEven(f); setPage(0); }}
                className="text-xs h-9"
              >
                {f === "all" ? "Todos" : f === "majority-even" ? "Maioria Par" : "Maioria Ímpar"}
              </Button>
            ))}
          </div>

          {/* Results */}
          <div className="rounded-xl glass-card border border-border/30 overflow-hidden">
            <div className="divide-y divide-border/30 max-h-[600px] overflow-y-auto">
              {paged.map((draw, i) => (
                <motion.div
                  key={draw.concurso}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.008 }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors"
                >
                  <div className="w-16 shrink-0">
                    <span className="text-xs font-mono font-bold text-primary">#{draw.concurso}</span>
                  </div>
                  <div className="w-20 shrink-0">
                    <span className="text-[10px] text-muted-foreground">{draw.date}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {draw.numbers.map(n => (
                      <span
                        key={n}
                        className="lottery-ball w-7 h-7 text-[10px]"
                      >
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground shrink-0 hidden sm:block px-2 py-1 rounded bg-muted/30">
                    Σ{draw.numbers.reduce((a, b) => a + b, 0)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="text-xs h-8">
                Anterior
              </Button>
              <span className="text-xs font-mono text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="text-xs h-8">
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoricoPage;
