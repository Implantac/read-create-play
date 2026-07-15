/**
 * ClosingHistoryPanel — biblioteca de fechamentos salvos na nuvem (por usuario/loteria).
 * Permite reabrir (rehidrata jogos e parametros), duplicar (aplica params ao formulario)
 * e excluir cada fechamento arquivado.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cloud, FolderOpen, Copy, Trash2, Loader2 } from "lucide-react";
import { useClosingHistory, type ClosingHistoryRow } from "@/hooks/useClosingHistory";
import type { ClosingResult, ClosingStrategy } from "@/engine/closing";
import { formatCurrency } from "@/utils/formatters";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  lotteryId: string;
  onReopen: (result: ClosingResult) => void;
  onDuplicate: (params: { baseNumbers: number[]; minHits: number; maxGames: number; strategy: ClosingStrategy }) => void;
}

function rowToResult(row: ClosingHistoryRow): ClosingResult {
  return {
    strategy: row.strategy as ClosingStrategy,
    request: {
      lottery: { id: row.lottery_id, name: row.lottery_name ?? row.lottery_id, totalNumbers: 0, pick: (row.games[0]?.length ?? 0), ticketPrice: 3 },
      baseNumbers: row.base_numbers,
      guarantee: { hitsInBase: row.games[0]?.length ?? 0, minHits: row.min_hits },
      maxGames: row.max_games ?? undefined,
      strategy: row.strategy as ClosingStrategy,
      kind: "guaranteed",
    },
    games: row.games,
    gameCount: row.game_count,
    cost: Number(row.cost),
    validation: row.validation,
    score: row.score,
    lowerBound: row.lower_bound ?? 0,
    elapsedMs: row.elapsed_ms ?? 0,
    notes: row.notes ?? [],
  } as unknown as ClosingResult;
}

export function ClosingHistoryPanel({ lotteryId, onReopen, onDuplicate }: Props) {
  const { history, isLoading, deleteClosing } = useClosingHistory(lotteryId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Biblioteca na Nuvem
          <Badge variant="secondary" className="ml-auto">{history.length} salvos</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum fechamento salvo. Gere um fechamento e ele sera arquivado aqui automaticamente.
          </p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {history.map((row) => {
              const meets = row.validation?.meetsGuarantee;
              return (
                <div key={row.id} className="rounded-lg border bg-muted/10 p-3 flex flex-wrap items-center gap-3 hover:bg-muted/20 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{row.strategy}</Badge>
                      <span className="font-semibold text-sm">{row.game_count} jogos</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">Base {row.base_numbers.length} · Garantia {row.min_hits}</span>
                      {meets ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">OK</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">Parcial</Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                      {formatCurrency(Number(row.cost))} · Nota {row.score?.overall ?? "-"}/100 ·{" "}
                      {formatDistanceToNow(new Date(row.created_at), { addSuffix: true, locale: ptBR })}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => onReopen(rowToResult(row))} title="Reabrir">
                      <FolderOpen className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDuplicate({
                      baseNumbers: row.base_numbers,
                      minHits: row.min_hits,
                      maxGames: row.max_games ?? 0,
                      strategy: row.strategy as ClosingStrategy,
                    })} title="Duplicar parametros">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      disabled={deletingId === row.id}
                      onClick={async () => {
                        setDeletingId(row.id);
                        await deleteClosing(row.id);
                        setDeletingId(null);
                      }}
                      title="Excluir"
                    >
                      {deletingId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
