/**
 * ComandoApostadorPage — Painel de Comando do Apostador Profissional
 * -----------------------------------------------------------------------------
 * Consolida em uma única tela os sinais críticos para tomada de decisão:
 *   1. Termômetro do Ciclo 1-25 (pressão de retorno)
 *   2. Perfil Vencedor e Similaridade
 *   3. Comparador Rápido (aposta manual × perfil × consenso)
 *   4. Performance do Motor (histórico de presets)
 *   5. Sugestão de Fechamento Automático (base × orçamento)
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, Trophy, Wallet, Target, TrendingUp } from "lucide-react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { CycleThermometer } from "@/components/lottery/analysis/CycleThermometer";
import { WinnerProfilePanel } from "@/components/lottery/analysis/WinnerProfilePanel";
import { QuickCompareBet } from "@/components/lottery/QuickCompareBet";
import { EnginePerformancePanel } from "@/components/dashboards/EnginePerformancePanel";
import { pickBestMatrix } from "@/engine/closing/autoMatrix";
import { toast } from "sonner";

export default function ComandoApostadorPage() {
  const { selectedLottery, lotteryConfig, draws, stats } = useLotteryContext();
  const navigate = useNavigate();
  const [budget, setBudget] = useState<number>(50);
  const [baseSize, setBaseSize] = useState<number>(lotteryConfig?.pick ? lotteryConfig.pick + 3 : 18);

  // Consenso simples: as N dezenas mais quentes (freq / delay baixo).
  const consensus = useMemo(() => {
    if (!stats || stats.length === 0) return [];
    const sorted = [...stats].sort((a: any, b: any) => (b.frequency ?? 0) - (a.frequency ?? 0));
    return sorted.slice(0, Math.max(8, (lotteryConfig?.pick ?? 15) + 3)).map((s: any) => s.number);
  }, [stats, lotteryConfig?.pick]);

  const matrixSuggestion = useMemo(() => {
    if (!selectedLottery) return null;
    return pickBestMatrix({
      lotteryId: selectedLottery,
      availableBaseSize: baseSize,
      budget,
    });
  }, [selectedLottery, baseSize, budget]);

  if (!lotteryConfig) return null;

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Command className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            Painel de Comando
            <Badge variant="outline" className="text-[10px]">Apostador Pro</Badge>
          </h1>
          <p className="text-xs text-muted-foreground">
            Todos os sinais críticos consolidados para você decidir em segundos, {lotteryConfig.name}.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <CycleThermometer draws={draws} totalNumbers={lotteryConfig.numbers} pick={lotteryConfig.pick} />
        <WinnerProfilePanel
          draws={draws}
          lotteryId={selectedLottery}
          totalNumbers={lotteryConfig.numbers}
          pick={lotteryConfig.pick}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <QuickCompareBet
          draws={draws}
          lotteryId={selectedLottery}
          pick={lotteryConfig.pick}
          totalNumbers={lotteryConfig.numbers}
          consensusNumbers={consensus}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-primary" />
              Fechamento Automático
              <Badge variant="outline" className="ml-auto text-[10px]">por orçamento</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Orçamento (R$)</Label>
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  className="font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Dezenas na base</Label>
                <Input
                  type="number"
                  value={baseSize}
                  onChange={(e) => setBaseSize(Math.max(lotteryConfig.pick, Number(e.target.value) || lotteryConfig.pick))}
                  min={lotteryConfig.pick}
                  max={lotteryConfig.numbers}
                  className="font-mono"
                />
              </div>
            </div>

            {matrixSuggestion?.best ? (
              <div className="space-y-2">
                <div className="rounded-lg border border-primary/40 bg-primary/[0.05] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{matrixSuggestion.best.name}</span>
                    <Badge variant="outline" className="ml-auto text-[10px] font-mono">
                      R$ {matrixSuggestion.best.cost.toFixed(2)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {matrixSuggestion.best.description}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <Info label="Base" value={`${matrixSuggestion.best.baseSize} dez.`} />
                    <Info label="Jogos" value={String(matrixSuggestion.best.gameCount)} />
                    <Info label="Garantia" value={`${matrixSuggestion.best.guarantee} pts`} />
                  </div>
                  <Button
                    size="sm"
                    variant="premium"
                    className="w-full mt-2 gap-2"
                    onClick={() => {
                      navigate("/fechamento-universal", { state: { fromComando: true } });
                      toast.success(`Sugestão: ${matrixSuggestion.best!.name}. Ajuste sua base no Fechamento Universal.`);
                    }}
                  >
                    <Target className="w-4 h-4" /> Abrir no Fechamento Universal
                  </Button>
                </div>
                {matrixSuggestion.reason && (
                  <p className="text-[11px] text-amber-500 italic">{matrixSuggestion.reason}</p>
                )}
                {matrixSuggestion.alternatives.length > 0 && (
                  <div className="pt-2 border-t border-border/40 space-y-1">
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold">Alternativas</p>
                    {matrixSuggestion.alternatives.slice(0, 3).map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-xs py-1">
                        <span className="font-medium">{a.name}</span>
                        <div className="flex items-center gap-2 text-muted-foreground font-mono">
                          <span>{a.gameCount} jogos</span>
                          <span>·</span>
                          <span>R$ {a.cost.toFixed(2)}</span>
                          <span>·</span>
                          <span>{a.guarantee} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {matrixSuggestion?.reason ?? "Ajuste os parâmetros para receber uma sugestão."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <EnginePerformancePanel lotteryId={selectedLottery} />

      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardContent className="p-4 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            Dica: rode o Caça-Jackpot no Gerador Estratégico com o Modo Acumulou ativado para popular a
            base de <strong>Performance do Motor</strong>. Após cada novo sorteio oficial, o Titan avalia
            automaticamente os lotes pendentes e refina a leitura dos presets que mais performam.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border/60 bg-card/60 p-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}
