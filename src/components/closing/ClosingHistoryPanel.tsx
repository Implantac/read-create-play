/**
 * ClosingHistoryPanel — biblioteca de fechamentos salvos na nuvem (por usuario/loteria).
 * Permite reabrir (rehidrata jogos e parametros), duplicar (aplica params ao formulario)
 * e excluir cada fechamento arquivado.
 */
import { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Cloud, FolderOpen, Copy, Trash2, Loader2, Share2, Link2Off, Star, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { useClosingHistory, type ClosingHistoryRow } from "@/hooks/useClosingHistory";
import type { ClosingResult, ClosingStrategy } from "@/engine/closing";
import { formatCurrency } from "@/utils/formatters";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  lotteryId: string;
  onReopen?: (result: ClosingResult) => void;
  onDuplicate?: (params: { baseNumbers: number[]; minHits: number; maxGames: number; strategy: ClosingStrategy }) => void;
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

const FAV_STORAGE_KEY = "titan.closingHistory.favorites.v1";

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAV_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch { return new Set(); }
}

function saveFavorites(set: Set<string>) {
  try { localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify([...set])); } catch { /* noop */ }
}

export function ClosingHistoryPanel({ lotteryId, onReopen, onDuplicate }: Props) {
  const { history, isLoading, deleteClosing, shareClosing, unshareClosing } = useClosingHistory(lotteryId);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  const [search, setSearch] = useState("");
  const [showFavOnly, setShowFavOnly] = useState(false);

  useEffect(() => { saveFavorites(favorites); }, [favorites]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = showFavOnly ? history.filter((r) => favorites.has(r.id)) : history;
    const searched = q
      ? base.filter((r) =>
          r.strategy.toLowerCase().includes(q) ||
          String(r.game_count).includes(q) ||
          (r.lottery_name ?? "").toLowerCase().includes(q) ||
          r.base_numbers.join(",").includes(q),
        )
      : base;
    return [...searched].sort((a, b) => {
      const fa = favorites.has(a.id) ? 1 : 0;
      const fb = favorites.has(b.id) ? 1 : 0;
      if (fa !== fb) return fb - fa;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [history, search, showFavOnly, favorites]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Cloud className="h-5 w-5" />
          Biblioteca na Nuvem
          <Badge variant="secondary" className="ml-auto">{filtered.length}/{history.length}</Badge>
        </CardTitle>
        {history.length > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por estratégia, base, jogos..."
                className="pl-7 h-8 text-xs"
              />
            </div>
            <Button
              variant={showFavOnly ? "default" : "outline"}
              size="sm"
              className="h-8"
              onClick={() => setShowFavOnly((v) => !v)}
              title="Somente favoritos"
            >
              <Filter className="h-3.5 w-3.5 mr-1" />
              <Star className={`h-3.5 w-3.5 ${showFavOnly ? "fill-current" : ""}`} />
            </Button>
          </div>
        )}
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
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum fechamento corresponde ao filtro atual.
          </p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filtered.map((row) => {
              const meets = row.validation?.meetsGuarantee;
              const isFav = favorites.has(row.id);
              return (
                <div key={row.id} className="rounded-lg border bg-muted/10 p-3 flex flex-wrap items-center gap-3 hover:bg-muted/20 transition-colors">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-8 w-8 p-0 ${isFav ? "text-amber-400 hover:text-amber-300" : "text-muted-foreground hover:text-amber-400"}`}
                    onClick={() => toggleFavorite(row.id)}
                    title={isFav ? "Remover dos favoritos" : "Marcar como favorito"}
                  >
                    <Star className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                  </Button>
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
                    {onReopen && (
                      <Button size="sm" variant="outline" onClick={() => onReopen(rowToResult(row))} title="Reabrir">
                        <FolderOpen className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {onDuplicate && (
                      <Button size="sm" variant="outline" onClick={() => onDuplicate({
                        baseNumbers: row.base_numbers,
                        minHits: row.min_hits,
                        maxGames: row.max_games ?? 0,
                        strategy: row.strategy as ClosingStrategy,
                      })} title="Duplicar parametros">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={sharingId === row.id}
                      onClick={async () => {
                        setSharingId(row.id);
                        try {
                          if (row.share_id) {
                            const ok = await unshareClosing(row.id);
                            if (ok) toast.success("Compartilhamento removido.");
                          } else {
                            const sid = await shareClosing(row.id);
                            if (sid) {
                              const url = `${window.location.origin}/f/${sid}`;
                              try { await navigator.clipboard.writeText(url); } catch { /* noop */ }
                              toast.success("Link copiado para a área de transferência.", { description: url });
                            }
                          }
                        } finally {
                          setSharingId(null);
                        }
                      }}
                      title={row.share_id ? "Remover compartilhamento" : "Compartilhar por link"}
                      className={row.share_id ? "text-emerald-500 hover:text-emerald-400" : ""}
                    >
                      {sharingId === row.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : row.share_id ? (
                        <Link2Off className="h-3.5 w-3.5" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5" />
                      )}
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
