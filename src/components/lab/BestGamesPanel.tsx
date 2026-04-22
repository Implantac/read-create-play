import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Star, Sparkles, Copy, Save, Check, Eye,
  Percent, Layers, Hash, Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GameQuality } from "@/engine/strategy-evolution/game-quality";
import {
  GRADE_STYLES, stagger, fadeUp,
  NumberBall, QualityBar, GradeDistributionBar,
} from "./LabShared";
import { SmartPickCard } from "./SmartPickCard";

export function BestGamesPanel({ rankedGames, lotteryId, lotteryName, pick, maxNum }: {
  rankedGames: GameQuality[];
  lotteryId: string;
  lotteryName: string;
  pick: number;
  maxNum: number;
}) {
  const [savingGame, setSavingGame] = useState<string | null>(null);
  const [copiedGame, setCopiedGame] = useState<string | null>(null);
  const [savedGames, setSavedGames] = useState<Set<string>>(new Set());
  const [showCount, setShowCount] = useState(15);
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());

  const gradeGroups = useMemo(() => {
    const groups: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    rankedGames.forEach(g => groups[g.grade]++);
    return groups;
  }, [rankedGames]);

  const filteredGames = useMemo(() => {
    if (!gradeFilter) return rankedGames;
    return rankedGames.filter(g => g.grade === gradeFilter);
  }, [rankedGames, gradeFilter]);

  const topGames = useMemo(() => filteredGames.slice(0, showCount), [filteredGames, showCount]);

  const avgScore = useMemo(() => {
    if (rankedGames.length === 0) return 0;
    return rankedGames.reduce((s, g) => s + g.overallScore, 0) / rankedGames.length;
  }, [rankedGames]);

  const top3 = useMemo(() => rankedGames.slice(0, 3), [rankedGames]);
  const restGames = useMemo(() => {
    if (!gradeFilter) return rankedGames.slice(3);
    return rankedGames.filter(g => g.grade === gradeFilter).filter(g => !top3.includes(g));
  }, [rankedGames, gradeFilter, top3]);

  const handleCopy = useCallback((game: number[], key: string) => {
    navigator.clipboard.writeText(game.join(", "));
    setCopiedGame(key);
    toast.success("Jogo copiado!");
    setTimeout(() => setCopiedGame(null), 2000);
  }, []);

  const handleSave = useCallback(async (gq: GameQuality, key: string) => {
    setSavingGame(key);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login para salvar"); return; }
      const { error } = await supabase.from("saved_bets").insert({
        user_id: user.id,
        lottery_id: lotteryId,
        numbers: gq.game,
        strategy: `Lab: ${gq.strategyName}`,
        label: `Lab ${gq.strategyName} [${gq.grade}]`,
        score: Math.round(gq.overallScore),
        grade: gq.grade,
      });
      if (error) throw error;
      setSavedGames(prev => new Set(prev).add(key));
      toast.success("Jogo salvo!");
    } catch {
      toast.error("Erro ao salvar jogo");
    } finally {
      setSavingGame(null);
    }
  }, [lotteryId]);

  const handleSaveBest = useCallback(async () => {
    const best = rankedGames.filter(g => g.grade === "S" || g.grade === "A");
    if (best.length === 0) { toast.info("Nenhum jogo com nota S ou A"); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login para salvar"); return; }
      const inserts = best.map((gq, i) => ({
        user_id: user.id,
        lottery_id: lotteryId,
        numbers: gq.game,
        strategy: `Lab: ${gq.strategyName}`,
        label: `Lab Best #${i + 1} [${gq.grade}]`,
        score: Math.round(gq.overallScore),
        grade: gq.grade,
      }));
      const { error } = await supabase.from("saved_bets").insert(inserts);
      if (error) throw error;
      const ns = new Set(savedGames);
      best.forEach((_, i) => ns.add(`best-${i}`));
      setSavedGames(ns);
      toast.success(`${best.length} melhores jogos salvos!`);
    } catch {
      toast.error("Erro ao salvar jogos");
    }
  }, [rankedGames, lotteryId, savedGames]);

  const handleSaveSelected = useCallback(async () => {
    if (selectedGames.size === 0) { toast.info("Nenhum jogo selecionado"); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login para salvar"); return; }
      const gamesToSave = rankedGames.filter((_, i) => selectedGames.has(`best-${i}`));
      const inserts = gamesToSave.map((gq, i) => ({
        user_id: user.id,
        lottery_id: lotteryId,
        numbers: gq.game,
        strategy: `Lab: ${gq.strategyName}`,
        label: `Lab Selecionado #${i + 1} [${gq.grade}]`,
        score: Math.round(gq.overallScore),
        grade: gq.grade,
      }));
      const { error } = await supabase.from("saved_bets").insert(inserts);
      if (error) throw error;
      const ns = new Set(savedGames);
      gamesToSave.forEach((_, i) => ns.add(`best-${i}`));
      setSavedGames(ns);
      setSelectedGames(new Set());
      toast.success(`${gamesToSave.length} jogos salvos!`);
    } catch {
      toast.error("Erro ao salvar jogos");
    }
  }, [selectedGames, rankedGames, lotteryId, savedGames]);

  const toggleSelect = useCallback((key: string) => {
    setSelectedGames(prev => {
      const n = new Set(prev);
      if (n.has(key)) {
        n.delete(key);
      } else {
        n.add(key);
      }
      return n;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    const keys = topGames.map((gq) => `best-${rankedGames.indexOf(gq)}`);
    setSelectedGames(new Set(keys));
  }, [topGames, rankedGames]);

  const deselectAll = useCallback(() => setSelectedGames(new Set()), []);

  if (rankedGames.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
          <Star className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Execute o laboratório para ver os melhores jogos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ★ Smart Pick — TOP 3 hero */}
      {top3.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Smart Pick — Top 3</h3>
            <span className="text-[10px] text-muted-foreground">Melhores jogos de todas as estratégias</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {top3.map((gq, i) => (
              <SmartPickCard
                key={i}
                gq={gq}
                rank={i}
                maxNum={maxNum}
                onCopy={() => handleCopy(gq.game, `smart-${i}`)}
                onSave={() => handleSave(gq, `smart-${i}`)}
                isSaved={savedGames.has(`smart-${i}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* KPIs + Grade Distribution */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="bg-card/80 border-border">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black text-foreground font-mono">{rankedGames.length}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Total de Jogos</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black text-primary font-mono">{gradeGroups.S + gradeGroups.A}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Nota A+ (S + A)</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black text-foreground font-mono">{avgScore.toFixed(1)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Score Médio</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black text-foreground font-mono">
              {rankedGames.length > 0 ? rankedGames[0].overallScore.toFixed(1) : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Melhor Score</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border col-span-2 sm:col-span-1">
          <CardContent className="p-3">
            <GradeDistributionBar groups={gradeGroups} total={rankedGames.length} />
          </CardContent>
        </Card>
      </div>

      {/* Grade filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-muted-foreground font-medium">Filtrar:</span>
        <Badge
          variant={gradeFilter === null ? "default" : "outline"}
          className="text-[10px] cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => setGradeFilter(null)}
        >
          Todos ({rankedGames.length})
        </Badge>
        {(["S", "A", "B", "C", "D"] as const).filter(g => gradeGroups[g] > 0).map(grade => (
          <Badge
            key={grade}
            variant={gradeFilter === grade ? "default" : "outline"}
            className={`text-[10px] cursor-pointer transition-colors font-mono font-bold ${
              gradeFilter !== grade ? GRADE_STYLES[grade] : ""
            }`}
            onClick={() => setGradeFilter(gradeFilter === grade ? null : grade)}
          >
            {grade}: {gradeGroups[grade]}
          </Badge>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            Mostrando {Math.min(showCount + 3, filteredGames.length)} de {filteredGames.length} jogos
            {gradeFilter && ` (nota ${gradeFilter})`}
          </span>
          <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={selectAllVisible}>
            Selecionar todos
          </Button>
          {selectedGames.size > 0 && (
            <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 text-muted-foreground" onClick={deselectAll}>
              Limpar seleção
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedGames.size > 0 && (
            <Button variant="default" size="sm" className="text-xs gap-1.5 h-8" onClick={handleSaveSelected}>
              <Save className="w-3 h-3" />
              Salvar selecionados ({selectedGames.size})
            </Button>
          )}
          <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8" onClick={handleSaveBest}>
            <Save className="w-3 h-3" />
            Salvar nota A+ ({gradeGroups.S + gradeGroups.A})
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500/30 border border-blue-500/30" />Q1</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 border border-emerald-500/30" />Q2</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500/30 border border-amber-500/30" />Q3</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500/30 border border-rose-500/30" />Q4</span>
        <span className="text-muted-foreground/60">— faixas numéricas</span>
      </div>

      {/* Remaining Games List (after top 3) */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
        {(gradeFilter ? filteredGames : restGames).slice(0, showCount).map((gq, i) => {
          const globalIdx = rankedGames.indexOf(gq);
          const key = `best-${globalIdx}`;
          const isSaved = savedGames.has(key);
          const isExpanded = expandedGame === key;
          const isSelected = selectedGames.has(key);
          const displayRank = gradeFilter ? i + 1 : i + 4;
          return (
            <motion.div key={globalIdx} variants={fadeUp}>
              <div className={`rounded-xl border transition-all duration-200 ${
                isSaved ? "bg-primary/5 border-primary/20" :
                isSelected ? "bg-accent/10 border-primary/30 ring-1 ring-primary/20" :
                "bg-muted/5 border-border hover:border-primary/20 hover:bg-muted/10"
              }`}>
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 group">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(key)}
                    className="shrink-0"
                  />
                  <div className="flex flex-col items-center gap-1 shrink-0 w-9">
                    <span className="text-[10px] font-mono text-muted-foreground font-bold">#{displayRank}</span>
                    <Badge variant="outline" className={`text-[9px] font-mono font-black px-1.5 py-0 h-5 ${GRADE_STYLES[gq.grade]}`}>
                      {gq.grade}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 flex-1 min-w-0">
                    {gq.game.map((num) => (
                      <NumberBall key={num} num={num} maxNum={maxNum} />
                    ))}
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-sm font-mono font-black text-primary">{gq.overallScore.toFixed(1)}</span>
                    <span className="text-[9px] text-muted-foreground truncate max-w-[80px] sm:max-w-[100px]">{gq.strategyName}</span>
                  </div>
                  <div className="flex gap-0.5 sm:gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg" onClick={() => setExpandedGame(isExpanded ? null : key)}>
                      <Eye className={`w-3.5 h-3.5 ${isExpanded ? "text-primary" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg" onClick={() => handleCopy(gq.game, key)}>
                      {copiedGame === key ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg"
                      disabled={savingGame === key || isSaved}
                      onClick={() => handleSave(gq, key)}
                    >
                      {isSaved ? <Check className="w-3.5 h-3.5 text-primary" /> : <Save className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-border/50 space-y-2.5">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-mono font-bold text-primary">{gq.overallScore.toFixed(1)} pts</span>
                          <span className="text-[10px] text-muted-foreground">— {gq.strategyName}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            Soma: <span className="font-mono font-bold text-foreground">{gq.game.reduce((s, n) => s + n, 0)}</span>
                          </span>
                        </div>
                        <QualityBar label="Paridade" value={gq.parityBalance} icon={<Percent className="w-2.5 h-2.5" />} />
                        <QualityBar label="Faixas" value={gq.rangeBalance} icon={<Layers className="w-2.5 h-2.5" />} />
                        <QualityBar label="Soma" value={gq.sumScore} icon={<Hash className="w-2.5 h-2.5" />} />
                        <QualityBar label="Consecutivas" value={gq.consecutiveScore} icon={<Activity className="w-2.5 h-2.5" />} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Load more */}
      {(gradeFilter ? filteredGames : restGames).length > showCount && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setShowCount(prev => prev + 15)}>
            Carregar mais jogos
          </Button>
        </div>
      )}
    </div>
  );
}
