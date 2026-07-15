import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart3, Activity, Sigma, Info } from "lucide-react";
import type { ClosingResult } from "@/engine/closing";
import { analyzeClosingStatistics } from "@/engine/closing/analysis/statisticsAnalyzer";
import { cn } from "@/lib/utils";

interface Props {
  result: ClosingResult;
}

type DrillKey = "parity" | "sum" | "decades" | "gaps" | null;

const DRILL_TITLES: Record<Exclude<DrillKey, null>, string> = {
  parity: "Decomposição por Paridade (por jogo)",
  sum: "Decomposição por Soma (por jogo)",
  decades: "Decomposição por Dezenas (por jogo)",
  gaps: "Decomposição por Gaps (por jogo)",
};

export function ClosingStatisticsPanel({ result }: Props) {
  const [drill, setDrill] = useState<DrillKey>(null);

  const report = useMemo(
    () =>
      analyzeClosingStatistics(
        result.games,
        result.request.baseNumbers,
        result.request.lottery.totalNumbers,
      ),
    [result],
  );

  const perGame = useMemo(() => {
    const total = result.request.lottery.totalNumbers;
    const decadeCount = Math.ceil(total / 10);
    return result.games.map((g, i) => {
      const sorted = [...g].sort((a, b) => a - b);
      const even = sorted.filter(x => x % 2 === 0).length;
      const sum = sorted.reduce((a, b) => a + b, 0);
      const decades = Array.from({ length: decadeCount }, (_, d) => {
        const lo = d * 10 + 1;
        const hi = Math.min((d + 1) * 10, total);
        return sorted.filter(x => x >= lo && x <= hi).length;
      });
      const gaps: number[] = [];
      for (let k = 1; k < sorted.length; k++) gaps.push(sorted[k] - sorted[k - 1]);
      const gapAvg = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
      const gapMax = gaps.length ? Math.max(...gaps) : 0;
      return {
        idx: i + 1,
        numbers: sorted,
        even,
        odd: sorted.length - even,
        sum,
        decades,
        gapAvg,
        gapMax,
      };
    });
  }, [result]);

  if (report.gameCount === 0) return null;

  const decadeLabels = report.decades.map(d => d.label);

  return (
    <Card className="glass border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Estatísticas do fechamento
          <Badge variant="outline" className="ml-2">
            Entropia {report.entropy.toFixed(0)}/100
          </Badge>
          <span className="ml-auto text-[10px] font-normal text-muted-foreground hidden md:flex items-center gap-1">
            <Info className="w-3 h-3" /> Clique em um KPI para ver a decomposição
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-center">
          <ClickableStat
            label="Pares (média)"
            value={report.parity.evenAvg.toFixed(2)}
            onClick={() => setDrill("parity")}
          />
          <ClickableStat
            label="Ímpares (média)"
            value={report.parity.oddAvg.toFixed(2)}
            onClick={() => setDrill("parity")}
          />
          <ClickableStat
            label="Soma média"
            value={report.sum.avg.toFixed(0)}
            sub={`σ ${report.sum.stdDev.toFixed(1)}`}
            onClick={() => setDrill("sum")}
          />
          <ClickableStat
            label="Gap médio"
            value={report.gaps.avg.toFixed(2)}
            sub={`max ${report.gaps.max}`}
            onClick={() => setDrill("gaps")}
          />
        </div>

        <Tabs defaultValue="decades">
          <TabsList className="mb-3">
            <TabsTrigger value="decades" onClick={() => {}}>Dezenas</TabsTrigger>
            <TabsTrigger value="parity">Paridade</TabsTrigger>
            <TabsTrigger value="sum">Soma</TabsTrigger>
            <TabsTrigger value="freq">Frequência</TabsTrigger>
          </TabsList>

          <TabsContent value="decades">
            <MiniChart data={report.decades} yKey="count" onBarClick={() => setDrill("decades")} />
          </TabsContent>
          <TabsContent value="parity">
            <MiniChart data={report.parity.distribution} yKey="count" onBarClick={() => setDrill("parity")} />
          </TabsContent>
          <TabsContent value="sum">
            <MiniChart data={report.sum.distribution} yKey="count" onBarClick={() => setDrill("sum")} />
          </TabsContent>
          <TabsContent value="freq">
            <MiniChart
              data={report.frequency.slice(0, 20).map(f => ({ label: String(f.number), count: f.count }))}
              yKey="count"
            />
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground mt-3 flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3" /> Cobertura da base: {report.coverageOfBase.used}/
            {report.coverageOfBase.used + report.coverageOfBase.unused} (
            {report.coverageOfBase.usedPercent.toFixed(0)}%)
          </span>
          <span className="flex items-center gap-1">
            <Sigma className="w-3 h-3" /> Soma: {report.sum.min}–{report.sum.max}
          </span>
        </div>
      </CardContent>

      <Dialog open={drill !== null} onOpenChange={(o) => !o && setDrill(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{drill ? DRILL_TITLES[drill] : ""}</DialogTitle>
            <DialogDescription>
              {perGame.length} jogos · Clique em uma coluna do gráfico ou KPI para trocar de dimensão.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Dezenas</TableHead>
                  {drill === "parity" && (
                    <>
                      <TableHead className="text-center">Pares</TableHead>
                      <TableHead className="text-center">Ímpares</TableHead>
                      <TableHead className="text-center">Padrão</TableHead>
                    </>
                  )}
                  {drill === "sum" && (
                    <>
                      <TableHead className="text-center">Soma</TableHead>
                      <TableHead className="text-center">Δ média</TableHead>
                    </>
                  )}
                  {drill === "decades" &&
                    decadeLabels.map(l => (
                      <TableHead key={l} className="text-center text-xs">
                        {l}
                      </TableHead>
                    ))}
                  {drill === "gaps" && (
                    <>
                      <TableHead className="text-center">Gap médio</TableHead>
                      <TableHead className="text-center">Gap máx</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {perGame.map(row => (
                  <TableRow key={row.idx}>
                    <TableCell className="font-mono text-muted-foreground">{row.idx}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.numbers.map(n => String(n).padStart(2, "0")).join(" · ")}
                    </TableCell>
                    {drill === "parity" && (
                      <>
                        <TableCell className="text-center font-mono">{row.even}</TableCell>
                        <TableCell className="text-center font-mono">{row.odd}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{row.even}P/{row.odd}I</Badge>
                        </TableCell>
                      </>
                    )}
                    {drill === "sum" && (
                      <>
                        <TableCell className="text-center font-mono">{row.sum}</TableCell>
                        <TableCell
                          className={cn(
                            "text-center font-mono text-xs",
                            row.sum > report.sum.avg ? "text-emerald-500" : "text-orange-500",
                          )}
                        >
                          {row.sum > report.sum.avg ? "+" : ""}
                          {(row.sum - report.sum.avg).toFixed(1)}
                        </TableCell>
                      </>
                    )}
                    {drill === "decades" &&
                      row.decades.map((c, i) => (
                        <TableCell key={i} className="text-center font-mono">
                          {c > 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary/20 text-primary">
                              {c}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">·</span>
                          )}
                        </TableCell>
                      ))}
                    {drill === "gaps" && (
                      <>
                        <TableCell className="text-center font-mono">{row.gapAvg.toFixed(2)}</TableCell>
                        <TableCell className="text-center font-mono">{row.gapMax}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ClickableStat({
  label,
  value,
  sub,
  onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-3 rounded-lg bg-muted/30 border border-border/40 hover:bg-primary/10 hover:border-primary/40 transition-all text-left cursor-pointer group"
    >
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground group-hover:text-primary">
        {label}
      </div>
      <div className="text-lg font-bold font-mono">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </button>
  );
}

function MiniChart({
  data,
  yKey,
  onBarClick,
}: {
  data: Array<{ label: string; count: number }>;
  yKey: string;
  onBarClick?: () => void;
}) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
          <Bar
            dataKey={yKey}
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            onClick={onBarClick ? () => onBarClick() : undefined}
            style={onBarClick ? { cursor: "pointer" } : undefined}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
