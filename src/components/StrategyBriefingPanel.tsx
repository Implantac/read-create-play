import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BarChart3, ClipboardCheck, FlaskConical, Gauge, ShieldCheck, WalletCards } from "lucide-react";
import type { DrawResult, LotteryConfig } from "@/data/lotteries";
import type { NumberStats } from "@/engine/stats/statistics";
import { buildStrategyBriefing } from "@/engine/strategy-briefing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  config: LotteryConfig;
  stats: NumberStats[];
  draws: DrawResult[];
  compact?: boolean;
}

const toneLabels = {
  conservative: "Conservador",
  balanced: "Balanceado",
  aggressive: "Agressivo",
};

const toneClasses = {
  conservative: "border-emerald-500/25 bg-emerald-500/10 text-emerald-500",
  balanced: "border-primary/25 bg-primary/10 text-primary",
  aggressive: "border-amber-500/25 bg-amber-500/10 text-amber-500",
};

export function StrategyBriefingPanel({ config, stats, draws, compact = false }: Props) {
  const briefing = useMemo(() => buildStrategyBriefing(config, stats, draws), [config, stats, draws]);

  return (
    <Card className="bg-card/70 border-primary/20 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Briefing Estrategico
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Traduz os dados de {config.name} em estrategia, risco e proxima acao.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={toneClasses[briefing.recommendedTone]}>
              {toneLabels[briefing.recommendedTone]}
            </Badge>
            <Badge variant="outline" className="bg-muted/40">
              {briefing.dataDepthLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <div>
              <p className="text-lg font-bold text-foreground">{briefing.headline}</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{briefing.summary}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Gauge className="h-3.5 w-3.5 text-primary" />
                  Confianca
                </div>
                <p className="mt-1 text-xl font-bold font-mono text-primary">{briefing.confidenceScore}%</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                  Risco
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">{briefing.riskLabel}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <WalletCards className="h-3.5 w-3.5 text-accent" />
                  Operacao
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">Banca controlada</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-background/40 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Mix recomendado
            </p>
            <div className="space-y-3">
              {briefing.strategyMix.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                    <span className="text-xs font-mono text-primary">{item.weight}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${item.weight}%` }} />
                  </div>
                  {!compact && <p className="text-[10px] text-muted-foreground leading-relaxed">{item.reason}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {!compact && (
          <div className="rounded-lg border border-primary/15 bg-primary/[0.04] p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Plano de execucao</p>
            <div className="grid gap-2 md:grid-cols-3">
              {briefing.operatingPlan.map((step, index) => (
                <div key={step} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border/50 pt-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>{briefing.commercialSignal}</span>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/simulacoes">
                <FlaskConical className="h-3.5 w-3.5" />
                Validar
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/gerador">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Gerar
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
