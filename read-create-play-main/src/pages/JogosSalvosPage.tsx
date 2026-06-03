import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LOTTERIES, LotteryConfig } from "@/data/lotteries";
import { getPrizeTiers } from "@/services/lotteryApi";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bookmark, Trophy, TrendingUp, BarChart3, ChevronDown, ChevronUp, Loader2, Calendar, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SavedBetRow {
  id: string;
  lottery_id: string;
  numbers: number[];
  strategy: string | null;
  score: number | null;
  grade: string | null;
  label: string | null;
  created_at: string;
}

interface DrawRow {
  concurso: number;
  draw_date: string | null;
  numbers: number[];
  prize_tiers: any;
}

const DRAW_RANGE_OPTIONS = [
  { value: "10", label: "Últimos 10 sorteios" },
  { value: "20", label: "Últimos 20 sorteios" },
  { value: "30", label: "Últimos 30 sorteios" },
  { value: "50", label: "Últimos 50 sorteios" },
  { value: "100", label: "Últimos 100 sorteios" },
  { value: "200", label: "Últimos 200 sorteios" },
];

const JogosSalvosPage = () => {
  const [bets, setBets] = useState<SavedBetRow[]>([]);
  const [drawsByLottery, setDrawsByLottery] = useState<Record<string, DrawRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [drawRange, setDrawRange] = useState("10");
  const [expandedLottery, setExpandedLottery] = useState<string | null>(null);
  const [expandedBet, setExpandedBet] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: savedBets } = await supabase
      .from("saved_bets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (savedBets) setBets(savedBets as SavedBetRow[]);

    // Fetch draws for all lotteries that have saved bets
    const lotteryIds = [...new Set((savedBets || []).map(b => b.lottery_id))];
    const drawsMap: Record<string, DrawRow[]> = {};

    await Promise.all(lotteryIds.map(async (lid) => {
      const { data } = await supabase
        .from("lottery_draws")
        .select("concurso, draw_date, numbers, prize_tiers")
        .eq("lottery_id", lid)
        .order("concurso", { ascending: false })
        .limit(200);
      if (data) drawsMap[lid] = data as DrawRow[];
    }));

    setDrawsByLottery(drawsMap);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const grouped = useMemo(() => {
    const map: Record<string, { config: LotteryConfig; bets: SavedBetRow[] }> = {};
    bets.forEach(bet => {
      if (!map[bet.lottery_id]) {
        const cfg = LOTTERIES.find(l => l.id === bet.lottery_id);
        if (!cfg) return;
        map[bet.lottery_id] = { config: cfg, bets: [] };
      }
      map[bet.lottery_id].bets.push(bet);
    });
    return map;
  }, [bets]);

  const rangeNum = parseInt(drawRange);

  const computePerformance = useCallback((bet: SavedBetRow, draws: DrawRow[], config: LotteryConfig) => {
    const recentDraws = draws.slice(0, rangeNum);
    const prizeTiers = getPrizeTiers(bet.lottery_id);

    const results = recentDraws.map(draw => {
      const drawSet = new Set(draw.numbers);
      const matched = bet.numbers.filter(n => drawSet.has(n));
      const tier = prizeTiers.find(t => t.hits === matched.length);
      return {
        concurso: draw.concurso,
        date: draw.draw_date || "",
        hits: matched.length,
        matched,
        isPrize: !!tier,
        tierLabel: tier?.label,
      };
    });

    const bestHits = results.reduce((max, r) => Math.max(max, r.hits), 0);
    const avgHits = results.length > 0 ? results.reduce((s, r) => s + r.hits, 0) / results.length : 0;
    const totalPrizes = results.filter(r => r.isPrize).length;

    return { results, bestHits, avgHits, totalPrizes };
  }, [rangeNum]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Jogos Salvos" description="Desempenho de todos os seus jogos agrupados por loteria" icon={Bookmark} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const lotteryIds = Object.keys(grouped);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jogos Salvos"
        description="Desempenho de todos os seus jogos agrupados por loteria"
        icon={Bookmark}
      />

      {/* Range selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">Analisar contra:</span>
        <Select value={drawRange} onValueChange={setDrawRange}>
          <SelectTrigger className="w-[220px] bg-card border-border/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DRAW_RANGE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Global stats */}
      {lotteryIds.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardContent className="p-4 text-center">
              <Bookmark className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold font-mono text-foreground">{bets.length}</p>
              <p className="text-[10px] text-muted-foreground">Total de Jogos</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold font-mono text-foreground">{lotteryIds.length}</p>
              <p className="text-[10px] text-muted-foreground">Loterias</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardContent className="p-4 text-center">
              <Trophy className="h-5 w-5 text-accent mx-auto mb-1" />
              <p className="text-xl font-bold font-mono text-foreground">
                {lotteryIds.reduce((total, lid) => {
                  const g = grouped[lid];
                  const draws = drawsByLottery[lid] || [];
                  return total + g.bets.reduce((s, b) => s + computePerformance(b, draws, g.config).totalPrizes, 0);
                }, 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">Premiações</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold font-mono text-foreground">
                {lotteryIds.reduce((max, lid) => {
                  const g = grouped[lid];
                  const draws = drawsByLottery[lid] || [];
                  const lMax = g.bets.reduce((m, b) => Math.max(m, computePerformance(b, draws, g.config).bestHits), 0);
                  return Math.max(max, lMax);
                }, 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">Máx. Acertos</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grouped by lottery */}
      {lotteryIds.length === 0 ? (
        <Card className="border-border/60 bg-card/80">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum jogo salvo ainda.</p>
            <p className="text-xs mt-1">Use o botão ⭐ nos geradores para salvar seus jogos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lotteryIds.map(lid => {
            const { config, bets: lotteryBets } = grouped[lid];
            const draws = drawsByLottery[lid] || [];
            const isExpanded = expandedLottery === lid;

            // Summary stats for this lottery
            const lotteryPerfs = lotteryBets.map(b => computePerformance(b, draws, config));
            const totalPrizes = lotteryPerfs.reduce((s, p) => s + p.totalPrizes, 0);
            const bestHit = lotteryPerfs.reduce((m, p) => Math.max(m, p.bestHits), 0);

            return (
              <motion.div key={lid} layout>
                <Card className="border-border/60 bg-card/80 backdrop-blur overflow-hidden">
                  {/* Lottery header */}
                  <button
                    onClick={() => setExpandedLottery(isExpanded ? null : lid)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div className="text-left">
                        <h3 className="text-sm font-semibold text-foreground">{config.name}</h3>
                        <p className="text-[10px] text-muted-foreground">
                          {lotteryBets.length} jogo{lotteryBets.length !== 1 ? "s" : ""} salvo{lotteryBets.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-right">
                        {totalPrizes > 0 && (
                          <Badge variant="default" className="text-[10px]">
                            <Trophy className="w-3 h-3 mr-1" />
                            {totalPrizes}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          Máx: <span className="font-bold text-foreground">{bestHit}/{config.pick}</span>
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded bets */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/30 p-4 space-y-3">
                          {lotteryBets.map((bet, idx) => {
                            const perf = computePerformance(bet, draws, config);
                            const isBetExpanded = expandedBet === bet.id;

                            return (
                              <motion.div
                                key={bet.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                              >
                                <div
                                  className={`rounded-lg border transition-all ${
                                    perf.totalPrizes > 0
                                      ? "border-primary/30 bg-primary/5"
                                      : "border-border/30 bg-secondary/20"
                                  }`}
                                >
                                  {/* Bet header */}
                                  <button
                                    onClick={() => setExpandedBet(isBetExpanded ? null : bet.id)}
                                    className="w-full p-3 flex items-center justify-between hover:bg-muted/20 transition-colors rounded-lg"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      {bet.grade && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                          bet.grade === "S" ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" :
                                          bet.grade === "A" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" :
                                          "text-blue-400 bg-blue-400/10 border-blue-400/30"
                                        }`}>
                                          {bet.grade}
                                        </span>
                                      )}
                                      <div className="flex flex-wrap gap-1">
                                        {bet.numbers.map(n => (
                                          <span
                                            key={n}
                                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-bold bg-secondary text-foreground border border-border/50"
                                          >
                                            {String(n).padStart(2, "0")}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                      <div className="text-right">
                                        <div className="flex items-center gap-1.5">
                                          {perf.totalPrizes > 0 && (
                                            <Badge variant="default" className="text-[9px]">
                                              {perf.totalPrizes}x
                                            </Badge>
                                          )}
                                          <span className="text-[10px] text-muted-foreground">
                                            Máx <span className="font-bold text-foreground">{perf.bestHits}</span>
                                          </span>
                                          <span className="text-[10px] text-muted-foreground">
                                            Méd <span className="font-mono text-foreground">{perf.avgHits.toFixed(1)}</span>
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                          {bet.strategy && (
                                            <Badge variant="outline" className="text-[8px]">{bet.strategy}</Badge>
                                          )}
                                          <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                                            <Calendar className="w-2.5 h-2.5" />
                                            {new Date(bet.created_at).toLocaleDateString("pt-BR")}
                                          </span>
                                        </div>
                                      </div>
                                      {isBetExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                                    </div>
                                  </button>

                                  {/* Draw-by-draw detail */}
                                  <AnimatePresence>
                                    {isBetExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="border-t border-border/20 px-3 pb-3">
                                          <p className="text-[9px] text-muted-foreground py-2 uppercase tracking-wider font-semibold">
                                            Desempenho nos últimos {perf.results.length} sorteios
                                          </p>
                                          <div className="overflow-x-auto">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead className="text-[9px] h-7 px-2">Concurso</TableHead>
                                                  <TableHead className="text-[9px] h-7 px-2">Data</TableHead>
                                                  <TableHead className="text-[9px] h-7 px-2">Acertos</TableHead>
                                                  <TableHead className="text-[9px] h-7 px-2">Números</TableHead>
                                                  <TableHead className="text-[9px] h-7 px-2">Prêmio</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {perf.results.map(r => (
                                                  <TableRow key={r.concurso} className={r.isPrize ? "bg-primary/5" : ""}>
                                                    <TableCell className="text-[9px] py-1 px-2 font-mono">{r.concurso}</TableCell>
                                                    <TableCell className="text-[9px] py-1 px-2 text-muted-foreground">
                                                      {r.date ? new Date(r.date).toLocaleDateString("pt-BR") : "—"}
                                                    </TableCell>
                                                    <TableCell className="py-1 px-2">
                                                      <Badge variant={r.isPrize ? "default" : "secondary"} className="text-[9px]">
                                                        {r.hits}/{config.pick}
                                                      </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-1 px-2">
                                                      <div className="flex flex-wrap gap-0.5">
                                                        {r.matched.slice(0, 8).map(n => (
                                                          <span key={n} className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full text-[7px] font-bold bg-primary text-primary-foreground">
                                                            {String(n).padStart(2, "0")}
                                                          </span>
                                                        ))}
                                                        {r.matched.length > 8 && (
                                                          <span className="text-[7px] text-muted-foreground self-center">+{r.matched.length - 8}</span>
                                                        )}
                                                      </div>
                                                    </TableCell>
                                                    <TableCell className="text-[9px] py-1 px-2">
                                                      {r.isPrize ? (
                                                        <span className="text-primary font-semibold">{r.tierLabel}</span>
                                                      ) : "—"}
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JogosSalvosPage;
