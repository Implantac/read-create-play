import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sigma, Dices, Percent } from "lucide-react";
import type { ClosingResult } from "@/engine/closing";
import { computeClosingProbability } from "@/engine/closing/analysis/probabilityEngine";

interface Props {
  result: ClosingResult;
}

const fmtPct = (p: number) => {
  if (!isFinite(p) || p <= 0) return "0%";
  if (p >= 0.01) return `${(p * 100).toFixed(2)}%`;
  if (p >= 0.0001) return `${(p * 100).toFixed(4)}%`;
  return p.toExponential(2);
};

const fmtOneIn = (x: number) => {
  if (!isFinite(x)) return "—";
  if (x < 1000) return `1 em ${x.toFixed(1)}`;
  return `1 em ${Math.round(x).toLocaleString("pt-BR")}`;
};

export function ClosingProbabilityPanel({ result }: Props) {
  const report = useMemo(() => {
    const { totalNumbers, pick } = result.request.lottery;
    return computeClosingProbability(
      totalNumbers,
      pick,
      result.request.baseNumbers.length,
      result.gameCount,
    );
  }, [result]);

  return (
    <Card className="glass border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sigma className="w-5 h-5 text-primary" />
          Probabilidades matemáticas
          <Badge variant="outline" className="ml-2">
            Hipergeométrica
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="closing">
          <TabsList className="mb-4">
            <TabsTrigger value="closing">
              <Percent className="w-4 h-4 mr-1" /> Fechamento
            </TabsTrigger>
            <TabsTrigger value="single">
              <Dices className="w-4 h-4 mr-1" /> Jogo único
            </TabsTrigger>
            <TabsTrigger value="base">Sorteados na base</TabsTrigger>
          </TabsList>

          <TabsContent value="closing">
            <p className="text-xs text-muted-foreground mb-2">
              Chance de o fechamento entregar ≥ h acertos em pelo menos um jogo (aproximação por independência).
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Acertos ≥</TableHead>
                  <TableHead>Probabilidade</TableHead>
                  <TableHead>Chance (1 em X)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.atLeastOneGameHits.slice(0, 8).map(row => (
                  <TableRow key={row.hits}>
                    <TableCell className="font-mono">{row.hits}</TableCell>
                    <TableCell>{fmtPct(row.probability)}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtOneIn(row.oneInX)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="single">
            <p className="text-xs text-muted-foreground mb-2">
              Probabilidade hipergeométrica de acertar exatamente h dezenas em um único jogo.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Acertos</TableHead>
                  <TableHead>P(=h)</TableHead>
                  <TableHead>P(≥h)</TableHead>
                  <TableHead>Chance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.singleGame.slice(0, 8).map(row => (
                  <TableRow key={row.hits}>
                    <TableCell className="font-mono">{row.hits}</TableCell>
                    <TableCell>{fmtPct(row.probability)}</TableCell>
                    <TableCell>{fmtPct(row.probabilityCumulative)}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtOneIn(row.oneInX)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="base">
            <p className="text-xs text-muted-foreground mb-2">
              Quantos dos sorteados caem dentro da base do fechamento ({report.baseSize} dezenas).
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sorteados na base</TableHead>
                  <TableHead>P(=k)</TableHead>
                  <TableHead>P(≥k)</TableHead>
                  <TableHead>Chance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.baseHits.slice(0, 8).map(row => (
                  <TableRow key={row.hitsInBase}>
                    <TableCell className="font-mono">{row.hitsInBase}</TableCell>
                    <TableCell>{fmtPct(row.probability)}</TableCell>
                    <TableCell>{fmtPct(row.probabilityCumulative)}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtOneIn(row.oneInX)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
