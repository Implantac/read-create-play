import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NumberStats } from "@/engine/statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { computeRobustness, RobustnessResult } from "@/engine/robustness-score";
import { improveBet, ImprovedBet } from "@/engine/bet-improver";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Shield, RefreshCw, AlertTriangle, CheckCircle2, FileDown, Sparkles, ArrowRight, ArrowUp, Copy } from "lucide-react";
import { CHART_TOOLTIP_STYLE } from "@/lib/chart-theme";
import { useSavedBets } from "@/hooks/useSavedBets";
import { exportToPdf } from "@/engine/pdf-export";
import { toast } from "sonner";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws: DrawResult[];
  lotteryId: string;
}

export function RobustnessRadarPanel({ stats, config, draws, lotteryId }: Props) {
  const { savedBets: bets, saveBet } = useSavedBets(lotteryId);
  const [results, setResults] = useState<RobustnessResult[]>([]);
  const [improvedBets, setImprovedBets] = useState<ImprovedBet[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showImproved, setShowImproved] = useState(false);

  const analyze = () => {
    if (!bets.length) return;
    const res = bets.slice(0, 10).map(b =>
      computeRobustness(b.numbers, stats, config, draws, b.strategy ?? "Salva")
    );
    const improved = bets.slice(0, 10).map(b =>
      improveBet(b.numbers, stats, config, draws)
    );
    setResults(res);
    setImprovedBets(improved);
    setSelectedIdx(0);
    setShowImproved(true);
  };

  const current = results[selectedIdx];
  const currentImproved = improvedBets[selectedIdx];
  const radarData = current?.axes.map(a => ({ axis: a.axis, value: a.value, fullMark: 100 })) ?? [];

  const gradeColor = (g: string) =>
    g === "S" ? "text-primary" : g === "A" ? "text-primary/80" : g === "B" ? "text-accent" : "text-destructive";

  const gradeBg = (g: string) =>
    g === "S" ? "bg-primary/20 text-primary" : g === "A" ? "bg-primary/15 text-primary/80" : g === "B" ? "bg-accent/20 text-accent" : "bg-destructive/20 text-destructive";

  const handleSaveImproved = () => {
    if (!currentImproved) return;
    saveBet({
      numbers: currentImproved.improved,
      label: `Otimizado (${currentImproved.improvedGrade})`,
      score: currentImproved.improvedScore,
      grade: currentImproved.improvedGrade,
      strategy: "Robustez AI",
    });
    toast.success("Jogo melhorado salvo nas apostas!");
  };

  const handleCopyImproved = () => {
    if (!currentImproved) return;
    navigator.clipboard.writeText(currentImproved.improved.map(n => String(n).padStart(2, "0")).join(" - "));
    toast.success("Números copiados!");
  };

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Score de Robustez
          <Badge variant="outline" className="ml-auto text-xs">Radar + Melhoria</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={analyze} disabled={!bets.length} variant="secondary" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Analisar {bets.length} Aposta(s) Salva(s)
          </Button>
          {results.length > 0 && (
            <Button
              variant="outline"
              size="icon"
              title="Exportar PDF"
              onClick={() => {
                const exportBets = results.map((r) => ({
                  numbers: r.bet,
                  strategy: r.strategy,
                  score: r.overallScore,
                  grade: r.grade,
                }));
                exportToPdf({
                  title: "Score de Robustez",
                  subtitle: `${results.length} apostas analisadas`,
                  config,
                  bets: exportBets,
                  type: "apostas",
                });
              }}
            >
              <FileDown className="h-4 w-4" />
            </Button>
          )}
        </div>

        {results.length > 0 && current && (
          <div className="space-y-4">
            {/* Bet selector tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    i === selectedIdx
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-transparent"
                  }`}
                >
                  Jogo {i + 1}
                  <span className={`ml-1.5 font-bold ${gradeColor(r.grade)}`}>{r.grade}</span>
                </button>
              ))}
            </div>

            {/* Score header */}
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-3xl font-bold font-mono ${gradeColor(current.grade)}`}>
                  {current.overallScore}
                </span>
                <span className="text-muted-foreground text-sm ml-1">/100</span>
                <Badge className={`ml-2 ${gradeBg(current.grade)}`}>
                  {current.grade}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">{current.strategy}</div>
            </div>

            {/* Numbers */}
            <div className="flex gap-1.5 flex-wrap">
              {current.bet.map(n => (
                <span key={n} className="bg-muted/60 text-foreground text-xs font-mono rounded-md px-2 py-1 border border-border/30">
                  {String(n).padStart(2, "0")}
                </span>
              ))}
            </div>

            {/* Radar */}
            <div className="bg-muted/20 rounded-xl p-3 border border-border/20">
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                  <PolarGrid stroke="hsl(225, 16%, 18%)" />
                  <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fontSize: 10, fill: "hsl(215, 12%, 48%)" }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                  <Radar
                    dataKey="value"
                    stroke="hsl(145, 72%, 42%)"
                    fill="hsl(145, 72%, 42%)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Axis breakdown */}
            <div className="grid grid-cols-2 gap-2">
              {current.axes.map(a => (
                <div key={a.axis} className="bg-muted/30 rounded-lg px-3 py-2 border border-border/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">{a.axis}</span>
                    <span className={`text-xs font-mono font-bold ${
                      a.value >= 70 ? "text-primary" : a.value >= 45 ? "text-accent" : "text-destructive"
                    }`}>{a.value}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        a.value >= 70 ? "bg-primary/70" : a.value >= 45 ? "bg-accent/70" : "bg-destructive/70"
                      }`}
                      style={{ width: `${a.value}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">{a.label}</p>
                </div>
              ))}
            </div>

            {/* Warnings & strengths */}
            {(current.qualityReport.warnings.length > 0 || current.qualityReport.strengths.length > 0) && (
              <div className="space-y-1.5">
                {current.qualityReport.strengths.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-primary/80">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {s}
                  </div>
                ))}
                {current.qualityReport.warnings.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-accent/80">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {w}
                  </div>
                ))}
              </div>
            )}

            {/* ═══ IMPROVED BET SECTION ═══ */}
            {currentImproved && (
              <div className="space-y-3 pt-2 border-t border-border/30">
                <Button
                  onClick={() => setShowImproved(!showImproved)}
                  className="w-full bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {showImproved ? "Ocultar Jogo Melhorado" : "Ver Jogo Melhorado"}
                </Button>

                {showImproved && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Score comparison */}
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground block">Original</span>
                        <span className={`text-xl font-bold font-mono ${gradeColor(currentImproved.originalGrade)}`}>
                          {currentImproved.originalScore}
                        </span>
                        <Badge className={`ml-1 text-[10px] ${gradeBg(currentImproved.originalGrade)}`}>
                          {currentImproved.originalGrade}
                        </Badge>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground block">Melhorado</span>
                        <span className={`text-xl font-bold font-mono ${gradeColor(currentImproved.improvedGrade)}`}>
                          {currentImproved.improvedScore}
                        </span>
                        <Badge className={`ml-1 text-[10px] ${gradeBg(currentImproved.improvedGrade)}`}>
                          {currentImproved.improvedGrade}
                        </Badge>
                      </div>
                      {currentImproved.improvedScore > currentImproved.originalScore && (
                        <div className="flex items-center text-primary text-xs font-bold">
                          <ArrowUp className="h-3.5 w-3.5" />
                          +{currentImproved.improvedScore - currentImproved.originalScore}
                        </div>
                      )}
                    </div>

                    {/* Improved numbers with diff highlighting */}
                    <div className="flex gap-1.5 flex-wrap justify-center">
                      {currentImproved.improved.map(n => {
                        const isNew = currentImproved.added.includes(n);
                        return (
                          <span
                            key={n}
                            className={`text-xs font-mono rounded-md px-2 py-1 border ${
                              isNew
                                ? "bg-primary/20 text-primary border-primary/40 ring-1 ring-primary/20"
                                : "bg-muted/60 text-foreground border-border/30"
                            }`}
                          >
                            {String(n).padStart(2, "0")}
                            {isNew && <span className="ml-0.5 text-[8px]">★</span>}
                          </span>
                        );
                      })}
                    </div>

                    {/* Removed / Added summary */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">
                        <span className="text-destructive/70 font-medium">Removidos:</span>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {currentImproved.removed.map(n => (
                            <span key={n} className="font-mono text-destructive/80 line-through">
                              {String(n).padStart(2, "0")}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-primary/10 rounded-lg px-3 py-2 border border-primary/20">
                        <span className="text-primary/70 font-medium">Adicionados:</span>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {currentImproved.added.map(n => (
                            <span key={n} className="font-mono text-primary font-bold">
                              {String(n).padStart(2, "0")}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Improvement reasons */}
                    <div className="space-y-1">
                      {currentImproved.improvements.map((imp, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-primary/70">
                          <CheckCircle2 className="h-3 w-3 shrink-0" /> {imp}
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button onClick={handleSaveImproved} size="sm" className="flex-1">
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Salvar Melhorado
                      </Button>
                      <Button onClick={handleCopyImproved} size="sm" variant="outline">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {results.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Salve apostas no Gerador e clique em "Analisar" para ver o radar de robustez e receber sugestões de melhoria.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
