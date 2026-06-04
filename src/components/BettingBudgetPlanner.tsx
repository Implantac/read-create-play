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
    <Card className="glass-card border-accent/20 overflow-hidden relative group">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(var(--accent),0.05),transparent)] pointer-events-none" />
      <CardHeader className="pb-5 relative">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-6 transition-transform duration-500">
              <WalletCards className="h-6 w-6 text-accent" />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-foreground italic">
                Planejador de Banca
              </CardTitle>
              <p className="mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                Gestão Financeira • {config.name}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1 font-black uppercase tracking-widest text-[9px] border-2 border-accent/40 bg-accent/10 text-accent shadow-sm animate-pulse">
            Sugestão: Risco {riskLabels[plan.suggestedRiskProfile]}
          </Badge>
        </div>
      </CardHeader>


      <CardContent className="space-y-5">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5 rounded-2xl border border-border/40 bg-secondary/10 p-5 relative overflow-hidden group/control">
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Banca Mensal</span>
                <span className="font-mono text-xl font-black text-accent italic">{formatBRL(monthlyBudget)}</span>
              </div>
              <Slider
                value={[monthlyBudget]}
                min={30}
                max={1000}
                step={10}
                onValueChange={(value) => setMonthlyBudget(value[0])}
                className="py-4"
              />
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">
                <span>R$ 30</span>
                <span>R$ 1.000</span>
              </div>
            </div>


            <div className="space-y-3 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Perfil de Risco</span>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as BudgetRiskProfile[]).map((risk) => {
                  const active = plan.riskProfile === risk;
                  return (
                    <button
                      key={risk}
                      type="button"
                      onClick={() => setRiskProfile(risk)}
                      className={`rounded-xl border-2 p-2.5 text-left transition-all duration-300 relative group/btn overflow-hidden ${
                        active
                          ? "border-accent bg-accent/10 text-accent shadow-[0_0_15px_rgba(var(--accent),0.2)]"
                          : "border-border/40 bg-background/30 text-muted-foreground hover:border-accent/40 hover:bg-accent/5"
                      }`}
                    >
                      <span className={`block text-[10px] font-black uppercase tracking-tighter transition-colors ${active ? "text-accent" : "text-muted-foreground"}`}>
                        {riskLabels[risk]}
                      </span>
                      <span className="block text-[8px] font-bold uppercase tracking-widest leading-tight opacity-50">
                        {riskDescriptions[risk]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard icon={Target} label="Jogos por Concurso" value={String(plan.recommendedGamesPerDraw)} detail={`Máximo Técnico: ${plan.maxGamesPerDraw}`} />
            <MetricCard icon={Calculator} label="Custo por Jogo" value={formatBRL(plan.costPerGame)} detail={`${plan.drawsPerMonth} Concursos/Mês`} />
            <MetricCard icon={Gauge} label="Uso da Banca" value={`${plan.budgetUsagePct}%`} detail={`${formatBRL(plan.monthlyCost)} / Mês`} />
            <MetricCard icon={PiggyBank} label="Reserva Titan" value={formatBRL(plan.reserveAmount)} detail={`${plan.monthlyGames} Jogos/Mês`} />
          </div>
        </div>


        {!compact && (
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(var(--accent),0.05),transparent)] pointer-events-none" />
            <p className="text-xs font-black uppercase tracking-wider text-accent mb-2 relative">{plan.operatingMode}</p>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium relative">
              Use essa banca como limite operacional. Gere os jogos, execute backtests neurais e acompanhe o ROI detalhado após os sorteios oficiais.
            </p>
          </div>

        )}

        {plan.warning && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-[11px] text-amber-200/70 font-medium">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <span>{plan.warning}</span>
          </div>

        )}

        <div className="flex flex-col gap-5 border-t border-border/40 pt-6 md:flex-row md:items-center md:justify-between relative">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 max-w-sm italic">
            O planejamento financeiro não altera a probabilidade matemática, mas garante disciplina operacional e controle de risco.
          </p>
          <Button asChild size="sm" className="h-10 px-6 rounded-xl border-accent/20 bg-accent/5 hover:bg-accent/10 text-accent font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 border-2">
            <Link to="/simulacoes">
              <FlaskConical className="h-4 w-4 mr-2" />
              Executar Backtest
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
    <div className="rounded-xl border border-border/40 bg-background/50 p-4 transition-all hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-0.5 group/metric">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70 group-hover/metric:text-accent transition-colors mb-1.5">
        <Icon className="h-3.5 w-3.5 text-accent" />
        {label}
      </div>
      <p className="text-lg font-black font-mono text-foreground italic">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-50 mt-1">{detail}</p>
    </div>

  );
}
