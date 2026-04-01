import { useState, useEffect, useCallback, useRef } from "react";
import { playMatchAlert, getTier } from "@/lib/alert-sounds";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { useSavedBets } from "@/hooks/useSavedBets";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { LOTTERIES } from "@/data/lotteries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, BellRing, BellOff, Trophy, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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
  const { permission, supported, requestPermission, sendNotification } = useNotificationPermission();
  const notifiedConcursos = useRef<Set<string>>(new Set());

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

    // Send browser push notification
    const notifKey = `${selectedLottery}-${latestDraw.concurso}`;
    if (results.length > 0 && !notifiedConcursos.current.has(notifKey)) {
      notifiedConcursos.current.add(notifKey);
      const best = results[0];
      const isWinner = best.matchCount >= config.pick;
      const lotteryName = LOTTERIES.find(l => l.id === selectedLottery)?.name || selectedLottery;

      // Play tier-based alert sound (different melody per match level)
      playMatchAlert(best.matchCount, config.pick);

      sendNotification(
        isWinner
          ? `🎉 Parabéns! Jogo premiado na ${lotteryName}!`
          : `🔔 ${lotteryName} — ${results.length} aposta(s) com acertos!`,
        {
          body: isWinner
            ? `Você acertou ${best.matchCount}/${config.pick} no concurso #${latestDraw.concurso}!`
            : `Melhor resultado: ${best.matchCount}/${config.pick} acertos no concurso #${latestDraw.concurso}`,
          tag: notifKey,
        }
      );
    }
  }, [draws, savedBets, config.pick, lastCheckedConcurso, selectedLottery, sendNotification]);

  useEffect(() => {
    checkMatches();
  }, [checkMatches]);

  const handleEnableNotifications = async () => {
    const result = await requestPermission();
    if (result === "granted") {
      toast.success("Notificações ativadas! Você será avisado quando houver acertos.");
    } else if (result === "denied") {
      toast.error("Notificações bloqueadas. Ative nas configurações do navegador.");
    }
  };

  // Notification permission banner
  if (supported && permission !== "granted" && !dismissed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border border-primary/30 bg-primary/5 backdrop-blur">
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4 text-primary" />
              <span>Ative as notificações para ser avisado quando suas apostas tiverem acertos!</span>
              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="default" onClick={handleEnableNotifications} className="h-7 text-xs">
                  <BellRing className="h-3 w-3 mr-1" />
                  Ativar
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setDismissed(true)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  if (!matches.length || dismissed) return null;

  const bestMatch = matches[0];
  const isWinner = bestMatch.matchCount >= config.pick;
  const tier = getTier(bestMatch.matchCount, config.pick);
  const isHighTier = tier === "high" || tier === "jackpot";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={
          isHighTier
            ? {
                opacity: 1,
                y: 0,
                scale: [1, 1.02, 0.98, 1.01, 1],
                x: [0, -3, 3, -2, 2, 0],
              }
            : { opacity: 1, y: 0 }
        }
        transition={
          isHighTier
            ? { duration: 0.6, ease: "easeOut", scale: { repeat: 2, duration: 0.5 } }
            : { duration: 0.3 }
        }
        exit={{ opacity: 0, y: -20 }}
        className={isHighTier ? "animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_3]" : ""}
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
                {supported && permission === "granted" && (
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                    <Bell className="h-2.5 w-2.5 mr-1" />
                    Push ON
                  </Badge>
                )}
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
