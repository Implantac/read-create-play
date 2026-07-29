/**
 * EnginePerformancePanel
 * -----------------------------------------------------------------------------
 * Mostra o histórico longitudinal de performance dos presets do Caça-Jackpot.
 * Cada linha representa uma combinação (Modo Acumulou × Consenso × loteria)
 * com média de acertos, melhor jogo e faixas premiadas ao longo dos concursos.
 */
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, Trophy, Loader2 } from "lucide-react";
import { useEnginePerformance } from "@/hooks/useEnginePerformance";

interface Props {
  lotteryId?: string;
}

export function EnginePerformancePanel({ lotteryId }: Props) {
  const { rows, presetSummary, loading, refresh, evaluatePending } =
    useEnginePerformance(lotteryId);

  useEffect(() => {
    // Ao montar, avalia lotes pendentes automaticamente.
    evaluatePending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Performance do Motor
            <Badge variant="outline" className="ml-1 text-[10px]">
              {rows.length} lotes registrados
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Acertos por preset ao longo dos concursos — o Titan aprende quais configurações performam melhor.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => evaluatePending().then(() => refresh())}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {presetSummary.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Nenhum lote registrado ainda. Rode o Caça-Jackpot para começar a coletar métricas.
          </p>
        ) : (
          <div className="space-y-2">
            {presetSummary.slice(0, 8).map((p, idx) => (
              <div
                key={p.hash}
                className={`rounded-lg border p-3 flex flex-col md:flex-row md:items-center gap-3 ${
                  idx === 0 ? "border-primary/50 bg-primary/[0.04]" : "border-border/60 bg-card"
                }`}
              >
                <div className="flex items-center gap-2 min-w-[160px]">
                  {idx === 0 && <Trophy className="w-4 h-4 text-primary" />}
                  <div>
                    <p className="text-sm font-semibold leading-tight">{p.label}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {p.evaluated}/{p.runs} avaliados
                    </p>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Média</p>
                    <p className="font-mono tabular-nums text-sm font-semibold">
                      {p.avgHits.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Melhor</p>
                    <p className="font-mono tabular-nums text-sm font-semibold">
                      {p.bestHits} pts
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Prêmios</p>
                    <p className="font-mono tabular-nums text-sm font-semibold">
                      {Object.values(p.tierHits).reduce((s, v) => s + v, 0)}
                    </p>
                  </div>
                </div>
                {Object.keys(p.tierHits).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(p.tierHits)
                      .sort(([a], [b]) => Number(b) - Number(a))
                      .slice(0, 4)
                      .map(([hits, count]) => (
                        <Badge key={hits} variant="outline" className="text-[10px] font-mono">
                          {hits} pts × {count}
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EnginePerformancePanel;
