/**
 * ClosingSmartAlertsPanel — escaneia sinais quentes/atrasados/soma alinhada
 * do fechamento vs padrão recente e destaca "chance elevada".
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Flame, Snowflake, Thermometer, Play } from "lucide-react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import type { ClosingResult } from "@/engine/closing";
import { analyzeSmartAlerts } from "@/engine/closing/analysis/smartAlerts";
import { cn } from "@/lib/utils";

interface Props {
  result: ClosingResult;
}

const VERDICT_STYLE: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  cold: { label: "Frio — sinais fracos", className: "text-slate-300 bg-slate-500/10 border-slate-500/30", icon: Snowflake },
  warm: { label: "Morno — atenção", className: "text-amber-300 bg-amber-500/10 border-amber-500/30", icon: Thermometer },
  hot: { label: "Quente — chance elevada", className: "text-orange-400 bg-orange-500/10 border-orange-500/40", icon: Flame },
  "on-fire": { label: "Em chamas — alta convergência", className: "text-red-400 bg-red-500/15 border-red-500/50", icon: Flame },
};

export function ClosingSmartAlertsPanel({ result }: Props) {
  const { draws, config } = useLotteryContext();
  const [ran, setRan] = useState(false);

  const analysis = useMemo(() => {
    if (!ran) return null;
    return analyzeSmartAlerts({
      lotteryId: config.id,
      totalNumbers: config.numbers,
      pick: config.pick,
      baseNumbers: result.request.baseNumbers,
      games: result.games,
      recentDraws: draws.slice(0, 30).map(d => ({
        concurso: d.concurso, numbers: d.numbers, date: d.date,
      })),
    });
  }, [ran, config, result, draws]);

  const verdictInfo = analysis ? VERDICT_STYLE[analysis.verdict] : null;
  const VerdictIcon = verdictInfo?.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Bell className="h-5 w-5 text-primary" />
          Alertas Inteligentes
          {analysis && verdictInfo && VerdictIcon && (
            <Badge className={cn("ml-auto border", verdictInfo.className)}>
              <VerdictIcon className="h-3 w-3 mr-1" />
              {verdictInfo.label} · {analysis.overallScore}/100
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={() => setRan(true)} disabled={draws.length < 5}>
          <Play className="h-4 w-4 mr-1" /> Analisar sinais
        </Button>

        {analysis && (
          <>
            {analysis.alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded p-3 bg-muted/20">
                Nenhum sinal quente detectado. O fechamento está neutro em relação aos padrões recentes.
              </p>
            ) : (
              <div className="space-y-2">
                {analysis.alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={cn(
                      "rounded-lg border p-3",
                      alert.severity === "high"
                        ? "border-red-500/40 bg-red-500/5"
                        : alert.severity === "medium"
                          ? "border-amber-500/40 bg-amber-500/5"
                          : "border-primary/30 bg-primary/5",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.detail}</p>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                        {alert.score}/100
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              Baseado em análise dos últimos 30 sorteios. Sinais não garantem resultado — são indicadores estatísticos de convergência com padrões recentes.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
