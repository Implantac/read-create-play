import { useState, useEffect, useCallback } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { useSavedBets } from "@/hooks/useSavedBets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, BellRing, Trophy, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MatchResult {
  betId: string;
  betNumbers: number[];
  matchedNumbers: number[];
  matchCount: number;
  concurso: number;
  strategy: string | null;
}

export function DrawNotificationChecker() {
  const { draws, config, selectedLottery } = useLotteryContext();
  const { savedBets } = useSavedBets(selectedLottery);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lastCheckedConcurso, setLastCheckedConcurso] = useState<number>(0);

  const checkMatches = useCallback(() => {
    if (!draws.length || !savedBets.length) return;

    const latestDraw = draws[0];
    if (latestDraw.concurso === lastCheckedConcurso) return;

    const results: MatchResult[] = [];
    const drawSet = new Set(latestDraw.numbers);

    for (const bet of savedBets) {
      const matched = bet.numbers.filter(n => drawSet.has(n));
      if (matched.length >= Math.max(2, Math.floor(config.pick * 0.3))) {
        results.push({
          betId: bet.id,
          betNumbers: bet.numbers,
          matchedNumbers: matched,
          matchCount: matched.length,
          concurso: latestDraw.concurso,
          strategy: bet.strategy,
        });
      }
    }

    results.sort((a, b) => b.matchCount - a.matchCount);
    setMatches(results);
    setLastCheckedConcurso(latestDraw.concurso);
    setDismissed(false);
  }, [draws, savedBets, config.pick, lastCheckedConcurso]);

  useEffect(() => {
    checkMatches();
  }, [checkMatches]);

  if (!matches.length || dismissed) return null;

  const bestMatch = matches[0];
  const isWinner = bestMatch.matchCount >= config.pick;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className={`border ${isWinner ? "border-accent/50 bg-accent/5" : "border-primary/30 bg-primary/5"} backdrop-blur`}>
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              {isWinner ? (
                <Trophy className="h-4 w-4 text-accent animate-bounce" />
              ) : (
                <BellRing className="h-4 w-4 text-primary" />
              )}
              <span>
                {isWinner ? "🎉 Parabéns! Jogo premiado!" : `Concurso ${bestMatch.concurso} — ${matches.length} aposta(s) com acertos`}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setDismissed(true)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>

          {expanded && (
            <CardContent className="pt-0 px-4 pb-3 space-y-2">
              {matches.slice(0, 5).map((m) => (
                <div key={m.betId} className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg px-3 py-2 border border-border/20">
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {m.matchCount}/{config.pick}
                  </Badge>
                  <div className="flex gap-1 flex-wrap">
                    {m.betNumbers.map(n => (
                      <span
                        key={n}
                        className={`font-mono px-1.5 py-0.5 rounded text-[11px] ${
                          m.matchedNumbers.includes(n)
                            ? "bg-primary/20 text-primary font-bold"
                            : "bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                  {m.strategy && (
                    <span className="text-muted-foreground ml-auto shrink-0">{m.strategy}</span>
                  )}
                </div>
              ))}
              {matches.length > 5 && (
                <p className="text-[10px] text-muted-foreground text-center">
                  +{matches.length - 5} apostas com acertos
                </p>
              )}
            </CardContent>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
