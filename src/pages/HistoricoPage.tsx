import { useState, useMemo } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { History, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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
        result = result.filter(d =>
          d.concurso === num || d.numbers.includes(num)
        );
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

  if (draws.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Importe os sorteios primeiro no Dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <History className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Histórico de Concursos</h2>
          <p className="text-xs text-muted-foreground">{filtered.length} resultados • {config.name}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Buscar concurso ou dezena..."
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Button
          size="sm"
          variant={sortAsc ? "default" : "outline"}
          onClick={() => setSortAsc(!sortAsc)}
          className="text-xs gap-1 h-8"
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
            className="text-xs h-8"
          >
            {f === "all" ? "Todos" : f === "majority-even" ? "Maioria Par" : "Maioria Ímpar"}
          </Button>
        ))}
      </div>

      {/* Results */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
          {paged.map((draw, i) => (
            <motion.div
              key={draw.concurso}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.01 }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/30 transition-colors"
            >
              <div className="w-16 shrink-0">
                <span className="text-xs font-mono font-bold text-foreground">#{draw.concurso}</span>
              </div>
              <div className="w-20 shrink-0">
                <span className="text-[10px] text-muted-foreground">{draw.date}</span>
              </div>
              <div className="flex flex-wrap gap-1 flex-1">
                {draw.numbers.map(n => (
                  <span
                    key={n}
                    className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-mono font-bold text-foreground"
                  >
                    {String(n).padStart(2, "0")}
                  </span>
                ))}
              </div>
              <div className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">
                Σ{draw.numbers.reduce((a, b) => a + b, 0)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="text-xs h-7">
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="text-xs h-7">
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
};

export default HistoricoPage;
