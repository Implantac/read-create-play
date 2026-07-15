/**
 * ClosingSharePage — visualização pública (somente leitura) de um fechamento
 * compartilhado por link. Acessível sem autenticação via /f/:shareId.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchSharedClosing, type ClosingHistoryRow } from "@/hooks/useClosingHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldOff, Copy, Sparkles } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function ClosingSharePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [row, setRow] = useState<ClosingHistoryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!shareId) return;
      try {
        const r = await fetchSharedClosing(shareId);
        if (!cancelled) {
          if (!r) setError("Fechamento não encontrado ou não está mais compartilhado.");
          else setRow(r);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro ao carregar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !row) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <ShieldOff className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h1 className="font-bold text-lg">Link indisponível</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {error ?? "Este fechamento não está mais compartilhado."}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/">Voltar ao início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const copyAll = async () => {
    const text = row.games
      .map((g, i) => `${String(i + 1).padStart(3, "0")}: ${g.map(n => String(n).padStart(2, "0")).join(" ")}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Jogos copiados.");
    } catch {
      toast.error("Falha ao copiar.");
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Titan <span className="text-primary">Loterias</span>
          </Link>
          <Badge variant="outline" className="text-[10px]">Visualização pública</Badge>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-wrap">
              Fechamento — {row.lottery_name ?? row.lottery_id}
              <Badge variant="secondary">{row.game_count} jogos</Badge>
              <Badge className="bg-primary/20 text-primary border-primary/40">{row.strategy}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <Metric label="Custo" value={formatCurrency(Number(row.cost))} />
              <Metric label="Base" value={`${row.base_numbers.length} dezenas`} />
              <Metric label="Garantia" value={`${row.min_hits} acertos`} />
              <Metric label="Nota IA" value={`${row.score?.overall ?? "-"}/100`} />
            </div>
            <p className="text-xs text-muted-foreground">
              Compartilhado {formatDistanceToNow(new Date(row.created_at), { addSuffix: true, locale: ptBR })}.
            </p>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Dezenas-base</h3>
              </div>
              <div className="flex flex-wrap gap-1">
                {row.base_numbers.map(n => (
                  <span key={n} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-mono font-bold border border-primary/40">
                    {String(n).padStart(2, "0")}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Jogos do fechamento</span>
              <Button size="sm" variant="outline" onClick={copyAll}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Copiar todos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
              {row.games.map((g, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border bg-muted/10 p-2">
                  <span className="font-mono text-xs text-muted-foreground w-10 text-right">
                    #{String(i + 1).padStart(3, "0")}
                  </span>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {g.map(n => (
                      <span key={n} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30">
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <footer className="text-center text-xs text-muted-foreground pb-6">
          <Link to="/" className="hover:text-primary">
            Criar seus próprios fechamentos no Titan Loterias →
          </Link>
        </footer>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/10 p-2">
      <div className="text-[10px] uppercase text-muted-foreground tracking-wider">{label}</div>
      <div className="font-mono font-bold text-sm mt-0.5">{value}</div>
    </div>
  );
}
