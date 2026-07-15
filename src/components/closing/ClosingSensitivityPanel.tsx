/**
 * ClosingSensitivityPanel
 * Análise de sensibilidade da base: como o tamanho da base afeta o lower bound
 * teórico, o universo de M-subsets e o candidate pool. Ajuda a achar o tamanho
 * ótimo antes de gerar (rápido — sem worker).
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Info, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { calculateGuarantee } from "@/engine/closing";
import type { ClosingResult } from "@/engine/closing";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import { cn } from "@/lib/utils";

interface Props {
  result: ClosingResult;
}

export function ClosingSensitivityPanel({ result }: Props) {
  const { request, gameCount, cost } = result;
  const { lottery, guarantee } = request;
  const currentBase = request.baseNumbers.length;

  const rows = useMemo(() => {
    const offsets = [-3, -2, -1, 0, 1, 2, 3];
    return offsets
      .map(off => {
        const size = currentBase + off;
        if (size < lottery.pick || size > lottery.totalNumbers) return null;
        const b = calculateGuarantee(size, lottery.pick, guarantee.minHits);
        // heurística: estimated_games ≈ current * (lower_bound_new / lower_bound_current)
        return {
          off, size,
          lowerBound: b.lowerBound,
          universe: b.universeSize,
          pool: b.candidatePoolSize,
          isCurrent: off === 0,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [currentBase, lottery, guarantee]);

  const currentRow = rows.find(r => r.isCurrent);
  const ratio = currentRow && currentRow.lowerBound > 0 ? gameCount / currentRow.lowerBound : 1;

  const projected = (row: (typeof rows)[number]) => {
    // Projeta jogos e custo com base no ratio real do fechamento gerado.
    const games = Math.max(row.lowerBound, Math.round(row.lowerBound * ratio));
    return { games, cost: games * lottery.ticketPrice };
  };

  // Encontra o sweet spot: menor custo cuja garantia ainda é praticável (pool suficiente).
  const sweetSpot = useMemo(() => {
    if (rows.length === 0) return null;
    return rows.reduce((best, r) => {
      const p = projected(r);
      const bp = projected(best);
      return p.games < bp.games ? r : best;
    }, rows[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, ratio, lottery.ticketPrice]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-5 w-5 text-primary" />
          Análise de Sensibilidade da Base
          <Badge variant="outline" className="ml-2 text-xs">Base atual: {currentBase}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Impacto de <strong>±3 dezenas</strong> na base sobre o mínimo teórico de jogos (Schönheim),
            o universo combinatório e a projeção de custo mantendo a mesma garantia de <strong>{guarantee.minHits}</strong> acertos.
          </AlertDescription>
        </Alert>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b">
              <tr>
                <th className="text-left py-2 px-2">Base</th>
                <th className="text-right py-2 px-2">Δ</th>
                <th className="text-right py-2 px-2">Mín. teórico</th>
                <th className="text-right py-2 px-2">Jogos proj.</th>
                <th className="text-right py-2 px-2">Custo proj.</th>
                <th className="text-right py-2 px-2">Universo M-subsets</th>
                <th className="text-right py-2 px-2">vs atual</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const p = projected(r);
                const deltaGames = currentRow ? p.games - gameCount : 0;
                const deltaPct = gameCount > 0 ? (deltaGames / gameCount) * 100 : 0;
                return (
                  <tr key={r.size} className={cn("border-b hover:bg-muted/30", r.isCurrent && "bg-primary/5 font-semibold")}>
                    <td className="py-2 px-2 font-mono">{r.size} dezenas</td>
                    <td className={cn(
                      "text-right py-2 px-2 font-mono",
                      r.off > 0 ? "text-emerald-500" : r.off < 0 ? "text-amber-500" : "text-muted-foreground"
                    )}>
                      {r.off > 0 ? `+${r.off}` : r.off === 0 ? "0" : r.off}
                    </td>
                    <td className="text-right py-2 px-2 font-mono">{r.lowerBound}</td>
                    <td className="text-right py-2 px-2 font-mono">
                      {r.isCurrent ? gameCount : p.games}
                    </td>
                    <td className="text-right py-2 px-2 font-mono">
                      {formatCurrency(r.isCurrent ? cost : p.cost)}
                    </td>
                    <td className="text-right py-2 px-2 font-mono text-muted-foreground">
                      {formatNumber(r.universe)}
                    </td>
                    <td className="text-right py-2 px-2">
                      {r.isCurrent ? (
                        <Badge variant="default" className="text-[10px]">Atual</Badge>
                      ) : (
                        <span className={cn(
                          "inline-flex items-center gap-1 font-mono text-xs",
                          deltaGames > 0 ? "text-red-500" : deltaGames < 0 ? "text-emerald-500" : "text-muted-foreground"
                        )}>
                          {deltaGames > 0 ? <TrendingUp className="h-3 w-3" /> : deltaGames < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                          {deltaGames > 0 ? "+" : ""}{deltaGames} ({deltaPct > 0 ? "+" : ""}{deltaPct.toFixed(0)}%)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sweetSpot && !sweetSpot.isCurrent && (
          <Alert variant="default">
            <Sparkles className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Sugestão:</strong> reduzir a base para <strong>{sweetSpot.size} dezenas</strong> projetaria
              cerca de <strong>{projected(sweetSpot).games} jogos</strong> ({formatCurrency(projected(sweetSpot).cost)}) —
              economia estimada de <strong>{formatCurrency(cost - projected(sweetSpot).cost)}</strong> mantendo a mesma garantia.
              Lembre-se: cada dezena a menos reduz a chance de que os sorteados caiam todos na base.
            </AlertDescription>
          </Alert>
        )}

        <p className="text-[11px] text-muted-foreground">
          Projeções usam o ratio real (jogos gerados ÷ Schönheim = {ratio.toFixed(2)}x) para extrapolar tamanhos vizinhos.
          Valores reais podem variar conforme a estratégia escolhida.
        </p>
      </CardContent>
    </Card>
  );
}
