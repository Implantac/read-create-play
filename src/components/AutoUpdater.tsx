import { useState, useEffect, useCallback } from "react";
import { DrawResult } from "@/data/lotteries";
import { fetchLatestDraw } from "@/services/lotteryApi";
import { motion } from "framer-motion";
import { RefreshCw, Wifi, WifiOff, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  lotteryId: string;
  onNewDraw: (draw: DrawResult) => void;
  latestConcurso: number;
}

export function AutoUpdater({ lotteryId, onNewDraw, latestConcurso }: Props) {
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [latestFromApi, setLatestFromApi] = useState<DrawResult | null>(null);

  const checkForUpdates = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchLatestDraw(lotteryId);
      setLastCheck(new Date());

      if (result) {
        setLatestFromApi(result);
        if (result.concurso > latestConcurso) {
          onNewDraw(result);
          toast.success(`Novo resultado! Concurso #${result.concurso}`);
        } else {
          toast.info("Nenhum resultado novo disponível");
        }
        setIsOnline(true);
      } else {
        setIsOnline(false);
        toast.error("Não foi possível conectar à API da Caixa");
      }
    } catch {
      setIsOnline(false);
      toast.error("Erro ao buscar resultados");
    } finally {
      setLoading(false);
    }
  }, [lotteryId, latestConcurso, onNewDraw]);

  // Auto-check every 5 minutes if enabled
  useEffect(() => {
    if (!autoEnabled) return;
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoEnabled, checkForUpdates]);

  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-neon-green animate-pulse-glow" : "bg-destructive"}`} />
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-neon-green" /> : <WifiOff className="w-3.5 h-3.5 text-destructive" />}
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
                ? "border-neon-green text-neon-green bg-neon-green/10"
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

      {/* Latest result from API */}
      {latestFromApi && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 rounded-lg bg-secondary/50 border border-border p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-neon-green" />
            <span className="text-xs text-foreground font-semibold">
              Último resultado: Concurso #{latestFromApi.concurso}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">{latestFromApi.date}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {latestFromApi.numbers.map(n => (
              <span key={n} className="lottery-ball text-xs w-8 h-8">
                {String(n).padStart(2, "0")}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
