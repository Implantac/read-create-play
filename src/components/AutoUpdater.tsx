import { useState, useEffect, useCallback, useRef } from "react";
import { DrawResult } from "@/data/lotteries";
import { fetchLatestDraw, LatestDrawResult } from "@/services/lotteryApi";
import { DrawPrizeData } from "@/hooks/useLotteryDraws";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Wifi, WifiOff, Clock, CheckCircle2, Trophy, Users, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  lotteryId: string;
  onNewDraw: (draw: DrawResult) => void;
  latestConcurso: number;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function AutoUpdater({ lotteryId, onNewDraw, latestConcurso }: Props) {
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [latestFromApi, setLatestFromApi] = useState<LatestDrawResult | null>(null);

  const lotteryIdRef = useRef(lotteryId);
  lotteryIdRef.current = lotteryId;

  const checkForUpdates = useCallback(async () => {
    const requestedLottery = lotteryId;
    setLoading(true);
    try {
      const result = await fetchLatestDraw(requestedLottery);

      // Guard: if user switched lottery while we were fetching, discard
      if (lotteryIdRef.current !== requestedLottery) return;

      setLastCheck(new Date());

      if (result && Array.isArray(result.numbers) && result.numbers.length > 0) {
        setLatestFromApi(result);
        if (result.concurso > latestConcurso) {
          onNewDraw(result);
          toast.success(`Novo resultado! Concurso #${result.concurso}`);
        } else {
          toast.info("Nenhum resultado novo disponível");
        }
        setIsOnline(true);
      } else {
        setLatestFromApi(null);
        setIsOnline(false);
        toast.error("Não foi possível conectar à API de resultados");
      }
    } catch {
      if (lotteryIdRef.current !== requestedLottery) return;
      setIsOnline(false);
      toast.error("Erro ao buscar resultados");
    } finally {
      if (lotteryIdRef.current === requestedLottery) setLoading(false);
    }
  }, [lotteryId, latestConcurso, onNewDraw]);

  // Auto-fetch on mount and when lottery changes
  useEffect(() => {
    setLatestFromApi(null);
    checkForUpdates().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotteryId]);

  // Auto-check every 5 minutes if enabled
  useEffect(() => {
    if (!autoEnabled) return;
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoEnabled, checkForUpdates]);

  const prizeTiers = latestFromApi?.prizeTiers;

  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-primary animate-pulse" : "bg-destructive"}`} />
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-primary" /> : <WifiOff className="w-3.5 h-3.5 text-destructive" />}
              Atualização de Resultados
            </h3>
            {lastCheck && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                Última verificação: {lastCheck.toLocaleTimeString("pt-BR")}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoEnabled(!autoEnabled)}
            className={`text-xs px-3 py-1.5 rounded-md border transition-all ${
              autoEnabled
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {autoEnabled ? "Auto: ON" : "Auto: OFF"}
          </button>
          <Button
            size="sm"
            variant="outline"
            onClick={checkForUpdates}
            disabled={loading}
            className="border-border hover:border-primary"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Buscando..." : "Atualizar"}
          </Button>
        </div>
      </div>

      {/* Latest result from API with full prize data */}
      <AnimatePresence>
        {latestFromApi && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 rounded-lg bg-secondary/50 border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 border-b border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground font-bold">
                  Concurso #{latestFromApi.concurso}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{latestFromApi.date}</span>
                {prizeTiers?.acumulou && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 font-bold animate-pulse">
                    ACUMULOU
                  </span>
                )}
              </div>
              {/* Numbers */}
              <div className="flex flex-wrap gap-1.5">
                {latestFromApi.numbers.map(n => (
                  <span key={n} className="lottery-ball text-xs w-8 h-8">
                    {String(n).padStart(2, "0")}
                  </span>
                ))}
              </div>
            </div>

            {/* Prize tiers table */}
            {prizeTiers?.premiacoes && prizeTiers.premiacoes.length > 0 && (
              <div className="p-3">
                {/* Financial summary */}
                {(prizeTiers.valorArrecadado > 0 || prizeTiers.valorAcumulado > 0) && (
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground mb-3">
                    {prizeTiers.valorArrecadado > 0 && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Arrecadado: <strong className="text-foreground">{formatCurrency(prizeTiers.valorArrecadado)}</strong>
                      </span>
                    )}
                    {prizeTiers.acumulou && prizeTiers.valorAcumulado > 0 && (
                      <span className="flex items-center gap-1 text-accent">
                        <TrendingUp className="w-3 h-3" />
                        Acumulado: <strong>{formatCurrency(prizeTiers.valorAcumulado)}</strong>
                      </span>
                    )}
                    {prizeTiers.valorEstimado > 0 && (
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        Próximo: <strong className="text-foreground">{formatCurrency(prizeTiers.valorEstimado)}</strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Prize table */}
                <div className="rounded-md border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Faixa</th>
                        <th className="text-center px-3 py-2 text-muted-foreground font-medium">
                          <Users className="w-3 h-3 inline mr-1" />
                          Ganhadores
                        </th>
                        <th className="text-right px-3 py-2 text-muted-foreground font-medium">
                          <Trophy className="w-3 h-3 inline mr-1" />
                          Prêmio
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {prizeTiers.premiacoes.map((tier, i) => (
                        <tr key={i} className={`border-t border-border/30 ${i === 0 ? "bg-primary/5" : ""}`}>
                          <td className="px-3 py-2 text-foreground font-medium">
                            {tier.descricao}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`font-bold ${
                              tier.ganhadores > 0 ? "text-primary" : "text-muted-foreground"
                            }`}>
                              {tier.ganhadores.toLocaleString("pt-BR")}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            <span className={`${
                              tier.ganhadores > 0 ? "text-primary font-bold" : "text-muted-foreground"
                            }`}>
                              {formatCurrency(tier.valorPremio)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
