/**
 * ClosingCompareTwoPanel — permite ao usuário selecionar 2 fechamentos salvos
 * na biblioteca e comparar lado a lado: custo, cobertura, sobreposição de jogos,
 * dezenas em comum na base, nota IA e validação da garantia.
 *
 * Somente leitura — não altera o resultado ativo.
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitCompare, ArrowRightLeft, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClosingHistory, type ClosingHistoryRow } from "@/hooks/useClosingHistory";
import { formatCurrency } from "@/utils/formatters";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  lotteryId: string;
}

function keyOf(game: number[]): string {
  return [...game].sort((a, b) => a - b).join("-");
}

function computeDiff(a: ClosingHistoryRow, b: ClosingHistoryRow) {
  const setA = new Set(a.games.map(keyOf));
  const setB = new Set(b.games.map(keyOf));
  let shared = 0;
  setA.forEach((k) => { if (setB.has(k)) shared += 1; });
  const onlyA = setA.size - shared;
  const onlyB = setB.size - shared;

  const baseA = new Set(a.base_numbers);
  const baseB = new Set(b.base_numbers);
  const sharedBase = [...baseA].filter((n) => baseB.has(n)).length;

  const costDelta = Number(b.cost) - Number(a.cost);
  const scoreDelta = (b.score?.overall ?? 0) - (a.score?.overall ?? 0);
  const jaccard = setA.size + setB.size - shared > 0
    ? shared / (setA.size + setB.size - shared)
    : 0;

  return { shared, onlyA, onlyB, sharedBase, costDelta, scoreDelta, jaccard };
}

export function ClosingCompareTwoPanel({ lotteryId }: Props) {
  const { history, isLoading } = useClosingHistory(lotteryId);
  const [idA, setIdA] = useState<string>("");
  const [idB, setIdB] = useState<string>("");

  const rowA = useMemo(() => history.find((h) => h.id === idA), [history, idA]);
  const rowB = useMemo(() => history.find((h) => h.id === idB), [history, idB]);
  const diff = useMemo(() => (rowA && rowB ? computeDiff(rowA, rowB) : null), [rowA, rowB]);

  const options = history.map((h) => ({
    id: h.id,
    label: `${h.strategy} · ${h.game_count}j · ${formatCurrency(Number(h.cost))} · ${formatDistanceToNow(new Date(h.created_at), { addSuffix: true, locale: ptBR })}`,
  }));

  const swap = () => { setIdA(idB); setIdB(idA); };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="h-5 w-5" />
          Comparar Dois Fechamentos
          <Badge variant="secondary" className="ml-auto text-[10px]">Beta</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando biblioteca...
          </div>
        ) : history.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            Salve pelo menos 2 fechamentos desta loteria para habilitar a comparação.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-end gap-2">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Fechamento A</label>
                <Select value={idA} onValueChange={setIdA}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {options.filter((o) => o.id !== idB).map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={swap}
                disabled={!idA || !idB}
                title="Inverter A ↔ B"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Fechamento B</label>
                <Select value={idB} onValueChange={setIdB}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {options.filter((o) => o.id !== idA).map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {rowA && rowB && diff && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <Metric
                    label="Custo A vs B"
                    value={`${formatCurrency(Number(rowA.cost))} → ${formatCurrency(Number(rowB.cost))}`}
                    hint={diff.costDelta === 0 ? "igual" : diff.costDelta > 0 ? `+${formatCurrency(diff.costDelta)}` : `${formatCurrency(diff.costDelta)}`}
                    tone={diff.costDelta === 0 ? "neutral" : diff.costDelta > 0 ? "warn" : "good"}
                  />
                  <Metric
                    label="Nota IA A vs B"
                    value={`${rowA.score?.overall ?? "-"} → ${rowB.score?.overall ?? "-"}`}
                    hint={diff.scoreDelta === 0 ? "igual" : diff.scoreDelta > 0 ? `+${diff.scoreDelta}` : `${diff.scoreDelta}`}
                    tone={diff.scoreDelta === 0 ? "neutral" : diff.scoreDelta > 0 ? "good" : "warn"}
                  />
                  <Metric
                    label="Jogos em comum"
                    value={String(diff.shared)}
                    hint={`Similaridade ${Math.round(diff.jaccard * 100)}%`}
                  />
                  <Metric
                    label="Base compartilhada"
                    value={`${diff.sharedBase} dezenas`}
                    hint={`A: ${rowA.base_numbers.length} · B: ${rowB.base_numbers.length}`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <SummaryCard row={rowA} tag="A" exclusive={diff.onlyA} />
                  <SummaryCard row={rowB} tag="B" exclusive={diff.onlyB} />
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  hint,
  tone = "neutral",
}: { label: string; value: string; hint?: string; tone?: "good" | "warn" | "neutral" }) {
  const toneClass =
    tone === "good" ? "text-emerald-400" : tone === "warn" ? "text-amber-400" : "text-muted-foreground";
  return (
    <div className="rounded-lg border bg-muted/10 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono font-semibold text-sm mt-0.5">{value}</div>
      {hint && <div className={`text-[10px] mt-0.5 ${toneClass}`}>{hint}</div>}
    </div>
  );
}

function SummaryCard({ row, tag, exclusive }: { row: ClosingHistoryRow; tag: string; exclusive: number }) {
  const meets = row.validation?.meetsGuarantee;
  return (
    <div className="rounded-lg border bg-muted/5 p-3 space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-primary/20 text-primary border-primary/40">Fechamento {tag}</Badge>
        <Badge variant="outline" className="text-[10px]">{row.strategy}</Badge>
        {meets ? (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">Garantia OK</Badge>
        ) : (
          <Badge variant="destructive" className="text-[10px]">Parcial</Badge>
        )}
      </div>
      <div className="text-[11px] text-muted-foreground font-mono">
        {row.game_count} jogos · Base {row.base_numbers.length} · Garantia {row.min_hits}
      </div>
      <div className="text-[11px] text-muted-foreground">
        Exclusivos deste fechamento: <span className="font-mono font-semibold text-foreground">{exclusive}</span>
      </div>
    </div>
  );
}
