import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dices, Copy, Save, Check, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StrategyGames } from "@/engine/strategy-evolution";
import { GameQuality } from "@/engine/strategy-evolution/game-quality";
import { GRADE_STYLES, stagger, fadeUp, NumberBall } from "./LabShared";
import { DrawTestDialog } from "@/components/lottery/DrawTestDialog";

export function GeneratedGamesPanel({ generatedGames, lotteryId, pick, maxNum, rankedGames }: {
  generatedGames: StrategyGames[];
  lotteryId: string;
  pick: number;
  maxNum: number;
  rankedGames: GameQuality[];
}) {
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(
    generatedGames[0]?.strategyId || null
  );
  const [savingGame, setSavingGame] = useState<string | null>(null);
  const [copiedGame, setCopiedGame] = useState<string | null>(null);
  const [savedGames, setSavedGames] = useState<Set<string>>(new Set());

  const gameGradeLookup = useMemo(() => {
    const map = new Map<string, GameQuality>();
    for (const gq of rankedGames) {
      map.set(gq.game.join(","), gq);
    }
    return map;
  }, [rankedGames]);

  const handleCopy = useCallback((game: number[], gameKey: string) => {
    navigator.clipboard.writeText(game.join(", "));
    setCopiedGame(gameKey);
    toast.success("Jogo copiado!");
    setTimeout(() => setCopiedGame(null), 2000);
  }, []);

  const handleSave = useCallback(async (game: number[], strategyName: string, gameKey: string) => {
    setSavingGame(gameKey);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login para salvar jogos"); return; }
      const gq = gameGradeLookup.get(game.join(","));
      const { error } = await supabase.from("saved_bets").insert({
        user_id: user.id,
        lottery_id: lotteryId,
        numbers: game,
        strategy: `Lab: ${strategyName}`,
        label: `Lab ${strategyName}${gq ? ` [${gq.grade}]` : ""}`,
        score: gq ? Math.round(gq.overallScore) : null,
        grade: gq?.grade || null,
      });
      if (error) throw error;
      setSavedGames(prev => new Set(prev).add(gameKey));
      toast.success("Jogo salvo!");
    } catch {
      toast.error("Erro ao salvar jogo");
    } finally {
      setSavingGame(null);
    }
  }, [lotteryId, gameGradeLookup]);

  const handleSaveAll = useCallback(async (sg: StrategyGames) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login para salvar jogos"); return; }
      const inserts = sg.games.map((game, i) => {
        const gq = gameGradeLookup.get(game.join(","));
        return {
          user_id: user.id,
          lottery_id: lotteryId,
          numbers: game,
          strategy: `Lab: ${sg.strategyName}`,
          label: `Lab ${sg.strategyName} #${i + 1}${gq ? ` [${gq.grade}]` : ""}`,
          score: gq ? Math.round(gq.overallScore) : null,
          grade: gq?.grade || null,
        };
      });
      const { error } = await supabase.from("saved_bets").insert(inserts);
      if (error) throw error;
      const newSaved = new Set(savedGames);
      sg.games.forEach((_, i) => newSaved.add(`${sg.strategyId}-${i}`));
      setSavedGames(newSaved);
      toast.success(`${sg.games.length} jogos salvos!`);
    } catch {
      toast.error("Erro ao salvar jogos");
    }
  }, [lotteryId, savedGames, gameGradeLookup]);

  if (generatedGames.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
          <Dices className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Nenhum jogo gerado</p>
      </div>
    );
  }

  const totalGames = generatedGames.reduce((t, sg) => t + sg.games.length, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-[10px] gap-1 py-1">
          <Dices className="w-3 h-3" />
          {totalGames} jogos
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          em {generatedGames.length} estratégias — ordenados por ranking
        </span>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2.5">
        {generatedGames.map((sg, sIdx) => {
          const isExpanded = expandedStrategy === sg.strategyId;
          return (
            <motion.div key={sg.strategyId} variants={fadeUp}>
              <Card className={`bg-card/80 backdrop-blur border-border transition-all overflow-hidden ${
                sIdx === 0 ? "ring-1 ring-primary/30 shadow-sm shadow-primary/5" : "hover:shadow-sm"
              }`}>
                <CardContent className="p-0">
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/5 transition-colors"
                    onClick={() => setExpandedStrategy(isExpanded ? null : sg.strategyId)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      sIdx === 0 ? "bg-primary/15 text-primary ring-2 ring-primary/20" :
                      sIdx === 1 ? "bg-yellow-500/15 text-yellow-500" :
                      sIdx === 2 ? "bg-orange-500/15 text-orange-500" :
                      "bg-muted/20 text-muted-foreground"
                    }`}>
                      {sIdx <= 2 ? ["🥇", "🥈", "🥉"][sIdx] : sIdx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">{sg.strategyName}</span>
                        <Badge variant="outline" className="text-[9px] gap-1">
                          <Dices className="w-2.5 h-2.5" />
                          {sg.games.length} jogos
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] font-mono font-bold">
                          {sg.metrics.globalScore.toFixed(1)} pts
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          Média: <span className="font-mono text-foreground font-medium">{sg.metrics.avgHits.toFixed(2)}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Melhor: <span className="font-mono text-foreground font-medium">{sg.metrics.bestHits}/{pick}</span>
                        </span>
                        {sg.metrics.totalPrizes > 0 && (
                          <span className="text-[10px] text-primary font-semibold">
                            🎯 {sg.metrics.totalPrizes} prêmios
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <Separator />
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                              Jogos gerados
                            </span>
                            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 rounded-lg" onClick={() => handleSaveAll(sg)}>
                              <Save className="w-3 h-3" />
                              Salvar todos ({sg.games.length})
                            </Button>
                          </div>

                          <div className="grid gap-2">
                            {sg.games.map((game, gIdx) => {
                              const gameKey = `${sg.strategyId}-${gIdx}`;
                              const isSaved = savedGames.has(gameKey);
                              const gq = gameGradeLookup.get(game.join(","));
                              return (
                                <div
                                  key={gIdx}
                                  className={`flex items-center gap-3 p-3 rounded-xl border group transition-all duration-200 ${
                                    isSaved ? "bg-primary/5 border-primary/20" :
                                    "bg-muted/5 border-border hover:border-primary/20 hover:bg-muted/10"
                                  }`}
                                >
                                  <div className="flex flex-col items-center gap-0.5 shrink-0 w-8">
                                    <span className="text-[10px] font-mono text-muted-foreground font-bold">#{gIdx + 1}</span>
                                    {gq && (
                                      <Badge variant="outline" className={`text-[8px] font-mono font-black px-1 py-0 h-4 ${GRADE_STYLES[gq.grade]}`}>
                                        {gq.grade}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 flex-1">
                                    {game.map((num) => (
                                      <NumberBall key={num} num={num} maxNum={maxNum} />
                                    ))}
                                  </div>
                                  <div className="flex gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => handleCopy(game, gameKey)}>
                                      {copiedGame === gameKey ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </Button>
                                    <Button
                                      variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg"
                                      disabled={savingGame === gameKey || isSaved}
                                      onClick={() => handleSave(game, sg.strategyName, gameKey)}
                                    >
                                      {isSaved ? <Check className="w-3.5 h-3.5 text-primary" /> : <Save className="w-3.5 h-3.5" />}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
