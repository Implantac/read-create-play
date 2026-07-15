/**
 * ClosingFixedExcludedPanel
 * Permite marcar dezenas que DEVEM aparecer em todos os jogos (fixas)
 * e dezenas que NUNCA devem aparecer (excluídas).
 * Aplica um filtro pós-geração sobre `result.games`.
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Ban, Info, Wand2 } from "lucide-react";
import type { ClosingResult } from "@/engine/closing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  result: ClosingResult;
  onApply: (games: number[][]) => void;
}

type Mode = "free" | "fixed" | "excluded";

export function ClosingFixedExcludedPanel({ result, onApply }: Props) {
  const base = useMemo(() => [...result.request.baseNumbers].sort((a, b) => a - b), [result]);
  const [fixed, setFixed] = useState<Set<number>>(new Set());
  const [excluded, setExcluded] = useState<Set<number>>(new Set());

  const cycle = (n: number) => {
    if (fixed.has(n)) {
      const f = new Set(fixed); f.delete(n);
      const e = new Set(excluded); e.add(n);
      setFixed(f); setExcluded(e);
    } else if (excluded.has(n)) {
      const e = new Set(excluded); e.delete(n);
      setExcluded(e);
    } else {
      const f = new Set(fixed); f.add(n);
      setFixed(f);
    }
  };

  const modeOf = (n: number): Mode =>
    fixed.has(n) ? "fixed" : excluded.has(n) ? "excluded" : "free";

  const filtered = useMemo(() => {
    return result.games.filter(g => {
      for (const n of fixed) if (!g.includes(n)) return false;
      for (const n of excluded) if (g.includes(n)) return false;
      return true;
    });
  }, [result.games, fixed, excluded]);

  const canApply = filtered.length > 0 && (fixed.size > 0 || excluded.size > 0);
  const reduction = result.gameCount - filtered.length;
  const reductionPct = result.gameCount > 0 ? (reduction / result.gameCount) * 100 : 0;

  const apply = () => {
    if (filtered.length === 0) {
      toast.error("Nenhum jogo restante — relaxe as restrições.");
      return;
    }
    onApply(filtered);
    toast.success(`Filtro aplicado: ${filtered.length} jogos mantidos, ${reduction} removidos.`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          Dezenas Fixas e Excluídas
          <Badge variant="outline" className="ml-2 text-xs">Pós-filtro</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Clique em uma dezena da base para alternar entre: <strong>livre</strong> → <strong className="text-emerald-500">fixa</strong> (deve estar em todo jogo) → <strong className="text-red-500">excluída</strong> (não pode aparecer) → livre.
            O filtro é aplicado sobre os {result.gameCount} jogos gerados.
          </AlertDescription>
        </Alert>

        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))" }}>
          {base.map(n => {
            const m = modeOf(n);
            return (
              <button
                key={n}
                onClick={() => cycle(n)}
                className={cn(
                  "aspect-square rounded-lg border font-mono font-semibold text-sm transition-all",
                  m === "free" && "bg-muted/40 border-border hover:bg-muted",
                  m === "fixed" && "bg-emerald-500 text-white border-emerald-600 shadow-md",
                  m === "excluded" && "bg-red-500 text-white border-red-600 line-through opacity-80",
                )}
                title={m === "fixed" ? "Fixa (obrigatória)" : m === "excluded" ? "Excluída" : "Livre"}
              >
                {n.toString().padStart(2, "0")}
              </button>
            );
          })}
        </div>

        <div className="grid md:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border bg-emerald-500/5 p-3">
            <p className="flex items-center gap-1 font-medium text-emerald-500 mb-1">
              <Lock className="h-3 w-3" /> Fixas ({fixed.size})
            </p>
            <p className="text-muted-foreground">
              {fixed.size ? [...fixed].sort((a, b) => a - b).map(n => n.toString().padStart(2, "0")).join(", ") : "Nenhuma"}
            </p>
          </div>
          <div className="rounded-lg border bg-red-500/5 p-3">
            <p className="flex items-center gap-1 font-medium text-red-500 mb-1">
              <Ban className="h-3 w-3" /> Excluídas ({excluded.size})
            </p>
            <p className="text-muted-foreground">
              {excluded.size ? [...excluded].sort((a, b) => a - b).map(n => n.toString().padStart(2, "0")).join(", ") : "Nenhuma"}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="font-medium mb-1">Impacto</p>
            <p className="font-mono">
              {filtered.length}/{result.gameCount} jogos ({(100 - reductionPct).toFixed(0)}%)
            </p>
            <p className="text-muted-foreground">
              {reduction > 0 ? `−${reduction} removidos` : "Sem remoções"}
            </p>
          </div>
        </div>

        {filtered.length === 0 && (fixed.size > 0 || excluded.size > 0) && (
          <Alert variant="destructive" className="text-xs">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Nenhum jogo satisfaz simultaneamente todas as restrições. Reduza o número de fixas/excluídas
              ou regenere o fechamento com estas dezenas já no ponto de partida.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={apply} disabled={!canApply}>
            <Wand2 className="h-4 w-4 mr-1" /> Aplicar filtro ao fechamento
          </Button>
          <Button variant="outline" onClick={() => { setFixed(new Set()); setExcluded(new Set()); }}>
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
