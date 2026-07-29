/**
 * JackpotConfidencePanel
 * -----------------------------------------------------------------------------
 * Combina duas leituras de "estado" em torno da estratégia jackpot:
 *   1. Regime atual (HOT/COLD/NEUTRAL) via HMM leve sobre o histórico.
 *   2. Confiança Bayesiana da estratégia — média posterior + IC 90%.
 *
 * O usuário pode registrar o resultado do Top #1 contra o último sorteio para
 * atualizar o posterior (α/β) e evoluir a confiança da estratégia ao longo do
 * tempo — tudo persistido localmente por estratégia.
 */
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Brain, RotateCcw, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { detectRegime, type Regime } from "@/ai/engines/hmmRegimeEngine";
import { useStrategyPriors } from "@/hooks/useStrategyPriors";
import type { DrawResult, LotteryConfig } from "@/data/lotteries";

interface Props {
  strategyId: string;
  strategyName: string;
  config: LotteryConfig;
  draws: DrawResult[];
  topOne?: number[]; // Top #1 do lote atual (para "Registrar resultado")
}

const REGIME_STYLES: Record<Regime, { label: string; className: string; hint: string }> = {
  HOT: {
    label: "HOT",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/40",
    hint: "Dezenas quentes dominam — favoreça padrões de continuidade.",
  },
  COLD: {
    label: "COLD",
    className: "bg-sky-500/15 text-sky-400 border-sky-500/40",
    hint: "Atrasadas voltando — vale reforçar dezenas frias.",
  },
  NEUTRAL: {
    label: "NEUTRAL",
    className: "bg-muted text-muted-foreground border-border/60",
    hint: "Aleatoriedade alta — estratégias balanceadas rendem mais.",
  },
};

export function JackpotConfidencePanel({
  strategyId,
  strategyName,
  config,
  draws,
  topOne,
}: Props) {
  const { view, record, reset } = useStrategyPriors(strategyId);

  const regime = useMemo(() => {
    if (draws.length < 6) return null;
    const history = draws.slice(0, 30).map((d) => d.numbers).reverse();
    const current = history[history.length - 1];
    return detectRegime(current, history.slice(0, -1), config.numbers);
  }, [draws, config.numbers]);

  const threshold = Math.floor(config.pick / 2) + 1;

  const handleRecord = () => {
    if (!topOne || topOne.length === 0) {
      toast.error("Rode o Caça-Jackpot primeiro para ter um Top #1.");
      return;
    }
    if (draws.length === 0) return;
    const drawn = new Set(draws[0].numbers);
    const hits = topOne.filter((n) => drawn.has(n)).length;
    record(hits, threshold);
    toast.success(
      hits >= threshold
        ? `Sucesso registrado (${hits} acertos ≥ ${threshold}). α↑`
        : `Falha registrada (${hits} acertos < ${threshold}). β↑`,
    );
  };

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Regime
        </span>
        {regime ? (
          <Badge
            variant="outline"
            className={REGIME_STYLES[regime.regime].className}
            title={`${REGIME_STYLES[regime.regime].hint} · confiança ${(regime.confidence * 100).toFixed(0)}%`}
          >
            {REGIME_STYLES[regime.regime].label} · {(regime.confidence * 100).toFixed(0)}%
          </Badge>
        ) : (
          <span className="text-[11px] text-muted-foreground">histórico insuficiente</span>
        )}
      </div>

      <div className="flex items-center gap-2 border-l border-border/40 pl-3">
        <Brain className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Confiança
        </span>
        <Badge
          variant="outline"
          className="font-mono tabular-nums"
          title={`Beta(α=${view.prior.alpha.toFixed(0)}, β=${view.prior.beta.toFixed(0)}) sobre ≥${threshold} acertos`}
        >
          {(view.mean * 100).toFixed(1)}% ± {(((view.ci[1] - view.ci[0]) / 2) * 100).toFixed(1)}
        </Badge>
        <span className="text-[10px] text-muted-foreground font-mono">
          {view.successes}/{view.trials} ensaios
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={handleRecord} className="gap-1.5" title={`Sucesso = Top #1 acerta ≥ ${threshold} contra o último sorteio`}>
          <ThumbsUp className="w-3.5 h-3.5" />
          Registrar resultado
        </Button>
        <Button size="icon" variant="ghost" onClick={reset} title="Zerar priors desta estratégia">
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>

      <p className="basis-full text-[10px] text-muted-foreground">
        <span className="font-medium">{strategyName}</span> — o regime é inferido por HMM leve (heat, repetição, entropia).
        A confiança evolui via posterior Beta a cada resultado registrado.
      </p>
    </div>
  );
}

export default JackpotConfidencePanel;
