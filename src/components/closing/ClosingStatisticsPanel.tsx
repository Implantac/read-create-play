import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart3, Activity, Sigma } from "lucide-react";
import type { ClosingResult } from "@/engine/closing";
import { analyzeClosingStatistics } from "@/engine/closing/analysis/statisticsAnalyzer";

interface Props {
  result: ClosingResult;
}

export function ClosingStatisticsPanel({ result }: Props) {
  const report = useMemo(
    () =>
      analyzeClosingStatistics(
        result.games,
        result.request.baseNumbers,
        result.request.lottery.totalNumbers,
      ),
    [result],
  );

  if (report.gameCount === 0) return null;

  return (
    <Card className="glass border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Estatísticas do fechamento
          <Badge variant="outline" className="ml-2">
            Entropia {report.entropy.toFixed(0)}/100
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-center">
          <Stat label="Pares (média)" value={report.parity.evenAvg.toFixed(2)} />
          <Stat label="Ímpares (média)" value={report.parity.oddAvg.toFixed(2)} />
          <Stat label="Soma média" value={report.sum.avg.toFixed(0)} sub={`σ ${report.sum.stdDev.toFixed(1)}`} />
          <Stat label="Gap médio" value={report.gaps.avg.toFixed(2)} sub={`max ${report.gaps.max}`} />
        </div>

        <Tabs defaultValue="decades">
          <TabsList className="mb-3">
            <TabsTrigger value="decades">Dezenas</TabsTrigger>
            <TabsTrigger value="parity">Paridade</TabsTrigger>
            <TabsTrigger value="sum">Soma</TabsTrigger>
            <TabsTrigger value="freq">Frequência</TabsTrigger>
          </TabsList>

          <TabsContent value="decades">
            <MiniChart data={report.decades} yKey="count" />
          </TabsContent>
          <TabsContent value="parity">
            <MiniChart data={report.parity.distribution} yKey="count" />
          </TabsContent>
          <TabsContent value="sum">
            <MiniChart data={report.sum.distribution} yKey="count" />
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
    </Card>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-bold font-mono">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function MiniChart({ data, yKey }: { data: Array<{ label: string; count: number }>; yKey: string }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
          <Bar dataKey={yKey} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
