import { useMemo, useState } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { useSavedBets } from "@/hooks/useSavedBets";
import { PageHeader } from "@/components/PageHeader";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, Target, Trophy, BarChart3, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";
import { CHART_TOOLTIP_STYLE } from "@/lib/chart-theme";
import { ROIFilters, ROIFilterState } from "@/components/ROIFilters";
import { PrizeHistoryPanel } from "@/components/PrizeHistoryPanel";

const PRIZE_CONFIG: Record<string, { cost: number; prizes: Record<number, number> }> = {
  megasena:  { cost: 5.00,  prizes: { 4: 1200, 5: 50000, 6: 50000000 } },
  lotofacil: { cost: 3.00,  prizes: { 11: 6, 12: 12, 13: 30, 14: 2000, 15: 2000000 } },
  quina:     { cost: 2.50,  prizes: { 2: 3, 3: 100, 4: 8000, 5: 15000000 } },
  lotomania: { cost: 3.00,  prizes: { 15: 20, 16: 25, 17: 200, 18: 2000, 19: 50000, 20: 5000000 } },
  duplasena: { cost: 2.50,  prizes: { 3: 4, 4: 100, 5: 5000, 6: 3000000 } },
  timemania: { cost: 3.50,  prizes: { 3: 3, 4: 20, 5: 1000, 6: 50000, 7: 10000000 } },
  diadesorte:{ cost: 2.50,  prizes: { 4: 6, 5: 50, 6: 2000, 7: 1000000 } },
  supersete: { cost: 2.50,  prizes: { 3: 2, 4: 20, 5: 300, 6: 10000, 7: 1000000 } },
};

const ROIDashboardPage = () => {
  const { config, draws, selectedLottery } = useLotteryContext();
  const { savedBets } = useSavedBets(selectedLottery);
  const [filters, setFilters] = useState<ROIFilterState>({ period: "all", strategy: "all", minHits: "0" });

  const strategies = useMemo(() => {
    const set = new Set(savedBets.map(b => b.strategy).filter(Boolean) as string[]);
    return Array.from(set);
  }, [savedBets]);

  const filteredBets = useMemo(() => {
    let bets = savedBets;
    if (filters.period !== "all") {
      const days = parseInt(filters.period);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      bets = bets.filter(b => new Date(b.created_at) >= cutoff);
    }
    if (filters.strategy !== "all") {
      bets = bets.filter(b => b.strategy === filters.strategy);
    }
    return bets;
  }, [savedBets, filters]);

  const analysis = useMemo(() => {
    if (!filteredBets.length || !draws.length) return null;

    const prizeConfig = PRIZE_CONFIG[selectedLottery] || PRIZE_CONFIG.megasena;
    const minHits = parseInt(filters.minHits) || 0;
    let totalInvested = 0;
    let totalReturn = 0;
    const betResults: { date: string; invested: number; returned: number; hits: number; concurso: number }[] = [];
    const hitDistribution: Record<number, number> = {};

    for (const bet of filteredBets) {
      const betDate = new Date(bet.created_at);
      totalInvested += prizeConfig.cost;

      let bestHits = 0;
      let bestConcurso = 0;
      let totalPrize = 0;

      for (const draw of draws) {
        const drawDate = draw.date ? new Date(draw.date) : null;
        if (drawDate && drawDate < betDate) continue;
        const drawSet = new Set(draw.numbers);
        const hits = bet.numbers.filter(n => drawSet.has(n)).length;
        if (hits > bestHits) { bestHits = hits; bestConcurso = draw.concurso; }
        const prize = prizeConfig.prizes[hits] || 0;
        if (prize > 0) totalPrize += prize;
      }

      if (bestHits < minHits) continue;

      hitDistribution[bestHits] = (hitDistribution[bestHits] || 0) + 1;
      totalReturn += totalPrize;
      betResults.push({
        date: betDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        invested: prizeConfig.cost, returned: totalPrize, hits: bestHits, concurso: bestConcurso,
      });
    }

    if (!betResults.length) return null;

    const roi = totalInvested > 0 ? ((totalReturn - totalInvested) / totalInvested) * 100 : 0;
    const hitChartData = Object.entries(hitDistribution)
      .map(([hits, count]) => ({ hits: `${hits} acertos`, count }))
      .sort((a, b) => parseInt(a.hits) - parseInt(b.hits));

    let cumInvested = 0, cumReturn = 0;
    const roiTimeline = betResults.map((r) => {
      cumInvested += r.invested; cumReturn += r.returned;
      return { date: r.date, roi: Number(((cumReturn - cumInvested) / cumInvested * 100).toFixed(1)), invested: cumInvested, returned: cumReturn };
    });

    return {
      totalInvested, totalReturn, roi, roiPositive: roi > 0, totalBets: betResults.length,
      hitChartData, roiTimeline, betResults,
      bestResult: betResults.reduce((best, r) => r.returned > best.returned ? r : best, betResults[0]),
    };
  }, [filteredBets, draws, selectedLottery, filters.minHits]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard de ROI" description="Retorno sobre investimento e histórico de premiações reais" icon={TrendingUp} />
      <LotteryContextBanner />

      {!savedBets.length ? (
        <EmptyState description="Salve apostas no Gerador para acompanhar seu ROI e premiações." />
      ) : (
        <Tabs defaultValue="roi" className="space-y-4">
          <TabsList>
            <TabsTrigger value="roi">ROI</TabsTrigger>
            <TabsTrigger value="premiacoes">Premiações Reais</TabsTrigger>
          </TabsList>

          <TabsContent value="roi" className="space-y-4">
            <ROIFilters filters={filters} onChange={setFilters} strategies={strategies} maxHits={config.pick} />

            {!analysis ? (
              <EmptyState description="Nenhum resultado encontrado com os filtros atuais." />
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-border/60 bg-card/80 backdrop-blur">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><DollarSign className="h-3.5 w-3.5" />Total Investido</div>
                      <p className="text-xl font-bold font-mono text-foreground">R$ {analysis.totalInvested.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">{analysis.totalBets} apostas</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60 bg-card/80 backdrop-blur">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Trophy className="h-3.5 w-3.5" />Total Retorno</div>
                      <p className={`text-xl font-bold font-mono ${analysis.totalReturn > 0 ? "text-primary" : "text-muted-foreground"}`}>R$ {analysis.totalReturn.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card className={`border-border/60 backdrop-blur ${analysis.roiPositive ? "bg-primary/5" : "bg-destructive/5"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        {analysis.roiPositive ? <TrendingUp className="h-3.5 w-3.5 text-primary" /> : <TrendingDown className="h-3.5 w-3.5 text-destructive" />}ROI
                      </div>
                      <p className={`text-xl font-bold font-mono ${analysis.roiPositive ? "text-primary" : "text-destructive"}`}>{analysis.roi > 0 ? "+" : ""}{analysis.roi.toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60 bg-card/80 backdrop-blur">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Target className="h-3.5 w-3.5" />Melhor</div>
                      <p className="text-xl font-bold font-mono text-accent">{analysis.bestResult.hits} acertos</p>
                      <p className="text-[10px] text-muted-foreground">{analysis.bestResult.returned > 0 ? `R$ ${analysis.bestResult.returned.toFixed(2)}` : "sem premiação"}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="border-border/60 bg-card/80 backdrop-blur">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Evolução do ROI</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={analysis.roiTimeline}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 16%, 15%)" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215, 12%, 48%)" }} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 48%)" }} tickFormatter={v => `${v}%`} />
                          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, "ROI"]} />
                          <Line type="monotone" dataKey="roi" stroke="hsl(145, 72%, 42%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(145, 72%, 42%)" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60 bg-card/80 backdrop-blur">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-accent" />Distribuição de Acertos</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={analysis.hitChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 16%, 15%)" />
                          <XAxis dataKey="hits" tick={{ fontSize: 10, fill: "hsl(215, 12%, 48%)" }} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 48%)" }} />
                          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                          <Bar dataKey="count" name="Apostas" radius={[4, 4, 0, 0]}>
                            {analysis.hitChartData.map((_, i) => (
                              <Cell key={i} fill={i >= analysis.hitChartData.length - 2 ? "hsl(145, 72%, 42%)" : "hsl(225, 16%, 25%)"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-border/60 bg-card/80 backdrop-blur">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />Histórico</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/40 text-muted-foreground">
                            <th className="text-left py-2 px-2">Data</th>
                            <th className="text-center py-2 px-2">Acertos</th>
                            <th className="text-right py-2 px-2">Investido</th>
                            <th className="text-right py-2 px-2">Retorno</th>
                            <th className="text-right py-2 px-2">Resultado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.betResults.slice(0, 20).map((r, i) => (
                            <tr key={i} className="border-b border-border/20">
                              <td className="py-2 px-2 text-muted-foreground text-xs">{r.date}</td>
                              <td className="py-2 px-2 text-center">
                                <Badge variant={r.hits >= config.pick - 1 ? "default" : "secondary"} className="text-[10px]">{r.hits}/{config.pick}</Badge>
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-xs text-destructive">-R$ {r.invested.toFixed(2)}</td>
                              <td className="py-2 px-2 text-right font-mono text-xs text-primary">{r.returned > 0 ? `+R$ ${r.returned.toFixed(2)}` : "-"}</td>
                              <td className="py-2 px-2 text-right">
                                {r.returned > r.invested ? <span className="text-xs text-primary font-semibold">Lucro</span>
                                  : r.returned > 0 ? <span className="text-xs text-accent font-semibold">Parcial</span>
                                  : <span className="text-xs text-muted-foreground">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="premiacoes">
            <PrizeHistoryPanel />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ROIDashboardPage;
