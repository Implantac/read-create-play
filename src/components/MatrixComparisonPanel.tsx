import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  WHEELING_MATRICES,
  WheelingMatrixId,
  validateMatrix,
} from "@/ai/engines/wheelingMatrices";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BarChart3, Shield, Coins, Hash, Layers, TrendingUp } from "lucide-react";

interface Props {
  lotteryId: string;
  betPrice: number;
}

const MATRIX_LIST = Object.entries(WHEELING_MATRICES).map(([id, m]) => ({
  id: id as WheelingMatrixId,
  ...m,
}));

export function MatrixComparisonPanel({ lotteryId, betPrice }: Props) {
  const matrices = MATRIX_LIST.filter((m) => m.lottery === lotteryId);

  const comparisons = useMemo(() => {
    return matrices.map((m) => {
      const v = validateMatrix(m.id);
      const cost = m.games.length * betPrice;
      const costPerCoverage = v.coveragePercent > 0 ? cost / v.coveragePercent : 0;
      const efficiency = v.coveragePercent / m.games.length;
      return { ...m, validation: v, cost, costPerCoverage, efficiency };
    }).sort((a, b) => b.efficiency - a.efficiency);
  }, [matrices, betPrice]);

  if (comparisons.length < 1) return null;

  const bestEfficiency = Math.max(...comparisons.map((c) => c.efficiency));
  const lowestCost = Math.min(...comparisons.map((c) => c.cost));

  return (
    <Card className="bg-card/80 backdrop-blur border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <BarChart3 className="w-5 h-5 text-primary" />
          Comparativo de Matrizes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Matriz</TableHead>
                <TableHead className="text-xs text-center">
                  <div className="flex items-center justify-center gap-1"><Hash className="w-3 h-3" />Base</div>
                </TableHead>
                <TableHead className="text-xs text-center">
                  <div className="flex items-center justify-center gap-1"><Layers className="w-3 h-3" />Jogos</div>
                </TableHead>
                <TableHead className="text-xs text-center">
                  <div className="flex items-center justify-center gap-1"><Shield className="w-3 h-3" />Garantia</div>
                </TableHead>
                <TableHead className="text-xs text-center">
                  <div className="flex items-center justify-center gap-1"><Coins className="w-3 h-3" />Custo</div>
                </TableHead>
                <TableHead className="text-xs text-center">Cobertura</TableHead>
                <TableHead className="text-xs text-center">
                  <div className="flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" />Eficiência</div>
                </TableHead>
                <TableHead className="text-xs text-center">R$/Cob.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground">{c.name}</span>
                      {c.efficiency === bestEfficiency && (
                        <Badge variant="default" className="text-[9px] px-1 py-0">
                          Melhor
                        </Badge>
                      )}
                      {c.cost === lowestCost && comparisons.length > 1 && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">
                          Econômica
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs font-mono text-foreground">
                    {c.baseSize}
                  </TableCell>
                  <TableCell className="text-center text-xs font-mono text-foreground">
                    {c.games.length}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[10px] font-mono text-primary">
                      {c.guarantee}+
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-xs font-mono text-accent-foreground">
                    R$ {c.cost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-mono text-foreground">
                        {Math.round(c.validation.coveragePercent)}%
                      </span>
                      <Progress value={c.validation.coveragePercent} className="h-1 w-16" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs font-mono font-bold text-primary">
                      {c.efficiency.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-xs font-mono text-muted-foreground">
                    R$ {c.costPerCoverage.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {comparisons.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-muted/10 border border-border text-xs text-muted-foreground space-y-1">
            <p><strong className="text-foreground">Eficiência</strong> = Cobertura% ÷ Nº de jogos (maior = melhor custo-benefício)</p>
            <p><strong className="text-foreground">R$/Cob.</strong> = Custo por ponto de cobertura (menor = mais econômico)</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
