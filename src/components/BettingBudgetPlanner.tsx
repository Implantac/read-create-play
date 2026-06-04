import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Calculator, FlaskConical, Gauge, PiggyBank, Target, WalletCards } from "lucide-react";
import type { DrawResult, LotteryConfig } from "@/data/lotteries";
import type { NumberStats } from "@/engine/stats/statistics";
import { buildBettingBudgetPlan, type BudgetRiskProfile } from "@/engine/betting-budget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface Props {
  config: LotteryConfig;
  stats: NumberStats[];
  draws: DrawResult[];
  compact?: boolean;
}

const riskLabels: Record<BudgetRiskProfile, string> = {
  low: "Baixo",
  medium: "Medio",
  high: "Alto",
};

const riskDescriptions: Record<BudgetRiskProfile, string> = {
  low: "Preserva banca",
  medium: "Equilibra volume",
  high: "Amplia testes",
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function BettingBudgetPlanner({ config, stats, draws, compact = false }: Props) {
  const [monthlyBudget, setMonthlyBudget] = useState(120);
  const [riskProfile, setRiskProfile] = useState<BudgetRiskProfile | undefined>();

  const plan = useMemo(
    () => buildBettingBudgetPlan(config, stats, draws, monthlyBudget, riskProfile),
    [config, stats, draws, monthlyBudget, riskProfile],
  );

  return (
    <Card className="bg-card/70 border-accent/20 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <WalletCards className="h-5 w-5 text-accent" />
              Planejador de Banca
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Define volume de jogos por concurso com base em custo, risco e profundidade historica.
            </p>
          </div>
          <Badge variant="outline" className="border-accent/25 bg-accent/10 text-accent">
            Sugestao: risco {riskLabels[plan.suggestedRiskProfile]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4 rounded-lg border border-border/50 bg-background/40 p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">Banca mensal</span>
                <span className="font-mono text-lg font-bold text-foreground">{formatBRL(monthlyBudget)}</span>
              </div>
              <Slider
                value={[monthlyBudget]}
                min={30}
                max={1000}
                step={10}
                onValueChange={(value) => setMonthlyBudget(value[0])}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>R$ 30</span>
                <span>R$ 1.000</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Perfil de risco</span>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as BudgetRiskProfile[]).map((risk) => {
                  const active = plan.riskProfile === risk;
                  return (
                    <button
                      key={risk}
                      type="button"
                      onClick={() => setRiskProfile(risk)}
                      className={`rounded-lg border p-2 text-left transition-colors ${
                        active
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-border/50 bg-background/30 text-muted-foreground hover:border-accent/30"
                      }`}
                    >
                      <span className="block text-xs font-bold">{riskLabels[risk]}</span>
                      <span className="block text-[10px] leading-tight">{riskDescriptions[risk]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard icon={Target} label="Jogos por concurso" value={String(plan.recommendedGamesPerDraw)} detail={`maximo tecnico: ${plan.maxGamesPerDraw}`} />
            <MetricCard icon={Calculator} label="Custo por jogo" value={formatBRL(plan.costPerGame)} detail={`${plan.drawsPerMonth} concursos/mes`} />
            <MetricCard icon={Gauge} label="Uso da banca" value={`${plan.budgetUsagePct}%`} detail={`${formatBRL(plan.monthlyCost)} no mes`} />
            <MetricCard icon={PiggyBank} label="Reserva" value={formatBRL(plan.reserveAmount)} detail={`${plan.monthlyGames} jogos/mes`} />
          </div>
        </div>

        {!compact && (
          <div className="rounded-lg border border-accent/15 bg-accent/[0.04] p-4">
            <p className="text-sm font-semibold text-foreground">{plan.operatingMode}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use essa banca como limite operacional. Gere os jogos, rode backtest e acompanhe o ROI depois dos sorteios.
            </p>
          </div>
        )}

        {plan.warning && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span>{plan.warning}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border/50 pt-4 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted-foreground">
            Planejamento financeiro nao aumenta chance matematica, mas reduz improviso e melhora disciplina de teste.
          </p>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to="/simulacoes">
              <FlaskConical className="h-3.5 w-3.5" />
              Testar estrategia
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-accent" />
        {label}
      </div>
      <p className="mt-1 text-lg font-bold font-mono text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{detail}</p>
    </div>
  );
}
