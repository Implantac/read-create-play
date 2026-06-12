import { useState, useMemo } from "react";
import { LOTTERIES, LotteryConfig } from "@/data/lotteries";
import { getPrizeTiers } from "@/services/api/lottery";;
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bookmark, Trophy, TrendingUp, BarChart3, ChevronDown, ChevronUp, Loader2, Calendar, Star, Trash2, Target } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { useSavedBets, SavedBet } from "@/hooks/useSavedBets";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { StatsCard } from "@/components/common/StatsCard";
import { DrawTestDialog } from "@/components/lottery/DrawTestDialog";


const DRAW_RANGE_OPTIONS = [
  { value: "10", label: "Últimos 10" },
  { value: "30", label: "Últimos 30" },
  { value: "50", label: "Últimos 50" },
  { value: "100", label: "Últimos 100" },
];

const JogosSalvosPage = () => {
  const { selectedLottery } = useLotteryContext();
  const { savedBets, loading, deleteBet } = useSavedBets(selectedLottery);
  const { draws, drawsWithPrizes } = useLotteryContext();
  const [drawRange, setDrawRange] = useState("10");
  const [expandedBet, setExpandedBet] = useState<string | null>(null);

  const rangeNum = parseInt(drawRange);

  const computePerformance = (bet: SavedBet) => {
    const recentDraws = draws.slice(0, rangeNum);
    const prizeTiers = getPrizeTiers(bet.lottery_id);

    const results = recentDraws.map(draw => {
      const drawSet = new Set(draw.numbers);
      const matched = bet.numbers.filter(n => drawSet.has(n));
      const tier = prizeTiers.find(t => t.hits === matched.length);
      return {
        concurso: draw.concurso,
        hits: matched.length,
        isPrize: !!tier,
        tierLabel: tier?.label,
      };
    });

    const bestHits = results.reduce((max, r) => Math.max(max, r.hits), 0);
    const totalPrizes = results.filter(r => r.isPrize).length;

    return { results, bestHits, totalPrizes };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Jogos Salvos" description="Desempenho dos seus jogos salvos" icon={Bookmark} />

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Analisar contra:</span>
        <Select value={drawRange} onValueChange={setDrawRange}>
          <SelectTrigger className="w-[180px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DRAW_RANGE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total de Jogos" value={savedBets.length} />
        <StatsCard title="Premiações Recentes" value={savedBets.reduce((s, b) => s + computePerformance(b).totalPrizes, 0)} />
      </div>

      <div className="space-y-3">
        {savedBets.map((bet) => {
          const perf = computePerformance(bet);
          const hasPrize = perf.totalPrizes > 0;
          return (
            <Card
              key={bet.id}
              className={hasPrize ? "border-primary/30 bg-primary/[0.03]" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex flex-wrap gap-1.5">
                    {bet.numbers.map(n => (
                      <span
                        key={n}
                        className="w-8 h-8 rounded-full bg-muted/60 border border-border/60 flex items-center justify-center text-xs font-mono tabular-nums font-semibold text-foreground"
                      >
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-sm font-mono tabular-nums font-semibold ${hasPrize ? "text-primary" : "text-foreground"}`}>
                        {perf.totalPrizes} <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans">Premiações</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Melhor: {perf.bestHits} acertos</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBet(bet.id)}
                      className="text-muted-foreground hover:text-destructive opacity-60 hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default JogosSalvosPage;