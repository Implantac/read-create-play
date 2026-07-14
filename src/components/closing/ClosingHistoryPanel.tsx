/**
 * ClosingHistoryPanel — mostra os fechamentos arquivados no Motor Universal
 * do usuário, expandíveis para revisar parâmetros, métricas e jogos.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp, Trash2, Loader2, Target, Coins, Shield } from "lucide-react";
import { useClosingHistory, type ClosingHistoryRow } from "@/hooks/useClosingHistory";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const STRATEGY_LABELS: Record<string, string> = {
  greedy: "Guloso",
  hill_climbing: "Hill Climbing",
  simulated_annealing: "Simulated Annealing",
  genetic: "Genético",
  covering_design: "Covering Design",
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

export function ClosingHistoryPanel({ lotteryId }: { lotteryId: string }) {
  const { history, isLoading, deleteClosing } = useClosingHistory(lotteryId);
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Fechamentos Salvos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nenhum fechamento arquivado ainda. Gere um no Motor Universal — ele
          será salvo automaticamente aqui.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" /> Fechamentos Salvos
          <Badge variant="secondary" className="ml-2">{history.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {history.map(row => (
          <ClosingRow
            key={row.id}
            row={row}
            open={openId === row.id}
            onToggle={() => setOpenId(openId === row.id ? null : row.id)}
            onDelete={() => deleteClosing(row.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function ClosingRow({
  row, open, onToggle, onDelete,
}: {
  row: ClosingHistoryRow;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const overall = row.score?.overall ?? 0;
  const guaranteed = row.validation?.guaranteedHits ?? 0;
  const meets = row.validation?.meetsGuarantee ?? false;
  return (
    <div className="rounded-lg border bg-muted/20">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
      >
        <Badge variant="outline" className="font-mono">
          {STRATEGY_LABELS[row.strategy] ?? row.strategy}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {row.game_count} jogos · {formatCurrency(Number(row.cost))}
          </p>
          <p className="text-xs text-muted-foreground">
            Meta {row.min_hits} · Garantia {guaranteed}{meets ? " ✓" : ""} · Nota {overall} · {fmtDate(row.created_at)}
          </p>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t p-3 space-y-3 text-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Metric icon={Target} label="Base" value={`${row.base_numbers.length} dezenas`} />
            <Metric icon={Shield} label="Meta acertos" value={String(row.min_hits)} />
            <Metric icon={Coins} label="Custo" value={formatCurrency(Number(row.cost))} />
            <Metric
              icon={Sparkles}
              label="Nota / Cobertura"
              value={`${overall} / ${(row.validation?.coveragePercent ?? 0).toFixed(0)}%`}
            />
          </div>

          <div>
            <p className="font-semibold mb-1">Dezenas-base</p>
            <div className="flex flex-wrap gap-1">
              {row.base_numbers.map(n => (
                <span key={n} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-mono">
                  {n.toString().padStart(2, "0")}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold mb-1">Jogos ({row.games.length})</p>
            <div className="max-h-56 overflow-auto space-y-1">
              {row.games.map((g, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-background">
                  <span className="text-muted-foreground font-mono w-6">#{i + 1}</span>
                  <div className="flex flex-wrap gap-1">
                    {g.map(n => (
                      <span key={n} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted font-mono">
                        {n.toString().padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={onDelete}
              className="text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  icon: Icon, label, value,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className={cn("rounded border bg-background/60 p-2")}>
      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="font-mono font-semibold text-sm">{value}</p>
    </div>
  );
}
