import { useState, useMemo } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { History, Search, ChevronDown, ChevronUp, CheckCircle2, Trophy, ArrowRight, Save, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSavedBets } from "@/hooks/useSavedBets";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const HistoricoPage = () => {
  const { config, draws } = useLotteryContext();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterEven, setFilterEven] = useState<"all" | "majority-even" | "majority-odd">("all");
  const [page, setPage] = useState(0);
  const perPage = 50;

  // Checker state
  const [checkerInput, setCheckerInput] = useState("");
  const [checkerNumbers, setCheckerNumbers] = useState<number[]>([]);
  const [checkResult, setCheckResult] = useState<{ concurso: number; hits: number; matched: number[] }[] | null>(null);
  const [isChecking, setIsReady] = useState(false);

  const { saveBet } = useSavedBets(config.id);

  const handleCheckerInput = (val: string) => {
    setCheckerInput(val);
    const nums = val.split(/[,\s\-;]+/)
      .map(n => parseInt(n.trim(), 10))
      .filter(n => !isNaN(n) && n >= (config.id === "lotomania" ? 0 : 1) && n <= config.numbers);
    
    if (nums.length > 0) {
      const unique = [...new Set(nums)].sort((a, b) => a - b);
      if (unique.length > config.pick) {
        setCheckerNumbers(unique.slice(0, config.pick));
      } else {
        setCheckerNumbers(unique);
      }
    } else if (val === "") {
      setCheckerNumbers([]);
    }
  };

  const runCheck = () => {
    if (checkerNumbers.length === 0) {
      toast.error("Insira os números para conferir");
      return;
    }
    
    const results = draws.map(draw => {
      const matched = checkerNumbers.filter(n => draw.numbers.includes(n));
      return {
        concurso: draw.concurso,
        hits: matched.length,
        matched
      };
    }).filter(r => r.hits > 0).sort((a, b) => b.hits - a.hits || b.concurso - a.concurso);
    
    setCheckResult(results);
    setIsReady(true);
    toast.success(`${results.length} acertos encontrados no histórico`);
  };

  const handleSaveGame = async () => {
    if (!user) {
      toast.error("Faça login para salvar o jogo");
      return;
    }
    try {
      await saveBet({
        numbers: checkerNumbers,
        strategy: "Conferência Manual",
        label: `Conferido em ${new Date().toLocaleDateString()}`
      });
      toast.success("Jogo salvo na sua biblioteca!");
    } catch (e) {
      toast.error("Erro ao salvar jogo");
    }
  };

  const copyNumbers = () => {
    navigator.clipboard.writeText(checkerNumbers.join(", "));
    toast.success("Números copiados!");
  };

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
        <div className="space-y-6">
          {/* Quick Checker Section */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-transparent overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <CardTitle className="text-sm font-bold uppercase tracking-tight">Conferidor Retroativo</CardTitle>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  IA Ready
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Insira seu jogo</label>
                  <div className="flex gap-2">
                    <Input 
                      value={checkerInput}
                      onChange={e => handleCheckerInput(e.target.value)}
                      placeholder="Ex: 01, 05, 12, 23..."
                      className="bg-muted/20 border-border/40 h-11"
                    />
                    <Button onClick={runCheck} className="h-11 px-6 gradient-brand text-white font-bold gap-2">
                      <Search className="w-4 h-4" />
                      Conferir
                    </Button>
                  </div>
                </div>
                
                {checkerNumbers.length > 0 && (
                  <div className="md:w-1/3 space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Seu Jogo ({checkerNumbers.length})</label>
                      <div className="flex gap-1">
                        <button onClick={copyNumbers} className="p-1 hover:bg-muted rounded transition-colors" title="Copiar"><Copy className="w-3 h-3 text-muted-foreground" /></button>
                        <button onClick={handleSaveGame} className="p-1 hover:bg-muted rounded transition-colors" title="Salvar"><Save className="w-3 h-3 text-muted-foreground" /></button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-muted/30 border border-border/40 min-h-[44px] items-center">
                      {checkerNumbers.map(n => (
                        <span key={n} className="lottery-ball w-7 h-7 text-[10px]">{String(n).padStart(2, "0")}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {isChecking && checkResult && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="space-y-4 pt-2"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-background border border-border/60 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Acertos</p>
                        <p className="text-xl font-black text-primary">{checkResult.length}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-background border border-border/60 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Máximo</p>
                        <p className="text-xl font-black text-accent">{checkResult.length > 0 ? Math.max(...checkResult.map(r => r.hits)) : 0}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-background border border-border/60 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Concursos</p>
                        <p className="text-xl font-black text-foreground">{draws.length}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-background border border-border/60 text-center flex flex-col justify-center">
                        <Button variant="ghost" size="sm" onClick={() => setIsReady(false)} className="text-[10px] h-6 uppercase font-bold">Limpar</Button>
                      </div>
                    </div>

                    <div className="max-h-[200px] overflow-y-auto pr-2 scrollbar-thin space-y-2 border-t border-border/40 pt-4">
                      {checkResult.length === 0 ? (
                        <p className="text-xs text-center py-4 text-muted-foreground">Nenhum acerto encontrado para este jogo no histórico.</p>
                      ) : (
                        checkResult.slice(0, 50).map((res, idx) => (
                          <div key={res.concurso} className="flex items-center justify-between p-2.5 rounded-lg bg-card/50 border border-border/30 hover:border-primary/40 hover:bg-card/80 transition-all group">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-primary leading-tight">#{res.concurso}</span>
                                <span className="text-[9px] text-muted-foreground leading-tight">{res.date}</span>
                              </div>
                              <Badge variant="secondary" className="text-[10px] h-6 gap-1.5 font-bold px-2 bg-primary/10 text-primary border-primary/20">
                                <Trophy className="w-3 h-3" /> {res.hits} acertos
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                                {res.matched.map(m => (
                                  <span key={m} className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black shadow-sm group-hover:scale-110 transition-transform">
                                    {String(m).padStart(2, "0")}
                                  </span>
                                ))}
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="w-1.5 h-8 bg-primary/20 rounded-full overflow-hidden shrink-0">
                                      <div 
                                        className="bg-primary w-full transition-all duration-500" 
                                        style={{ height: `${(res.hits / config.pick) * 100}%` }} 
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-[10px] font-bold">{(res.hits / config.pick * 100).toFixed(0)}% das dezenas</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
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
        </div>
      )}
    </div>
  );
};

export default HistoricoPage;
