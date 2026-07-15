/**
 * ClosingBolaoPanel — divide os jogos do fechamento em cotas para N participantes,
 * gerando resumo por pessoa (jogos atribuídos + valor) e mensagens prontas para
 * WhatsApp/Telegram.
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Copy, Share2, Trash2, UserPlus } from "lucide-react";
import type { ClosingResult } from "@/engine/closing";
import { formatCurrency } from "@/utils/formatters";
import { toast } from "sonner";

interface Props {
  result: ClosingResult;
  /** Se o fechamento já tem share_id ativo, permite montar link direto por cota. */
  shareBaseUrl?: string;
}

interface Participant {
  id: string;
  name: string;
  shares: number; // qtos "quinhões" desse participante
}

interface Cota {
  participant: Participant;
  gameIndices: number[];
  cost: number;
}

function splitGames(participants: Participant[], gameCount: number): Cota[] {
  const totalShares = participants.reduce((a, p) => a + p.shares, 0);
  if (totalShares <= 0) return participants.map(p => ({ participant: p, gameIndices: [], cost: 0 }));
  const perShare = gameCount / totalShares;
  const cotas: Cota[] = [];
  let cursor = 0;
  participants.forEach((p, i) => {
    const isLast = i === participants.length - 1;
    const end = isLast ? gameCount : Math.round((cursor / perShare + p.shares) * perShare);
    const idxs: number[] = [];
    for (let k = cursor; k < Math.min(end, gameCount); k++) idxs.push(k);
    cotas.push({ participant: p, gameIndices: idxs, cost: 0 });
    cursor = Math.min(end, gameCount);
  });
  return cotas;
}

export function ClosingBolaoPanel({ result, shareBaseUrl }: Props) {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: crypto.randomUUID(), name: "Participante 1", shares: 1 },
    { id: crypto.randomUUID(), name: "Participante 2", shares: 1 },
  ]);

  const totalShares = participants.reduce((a, p) => a + p.shares, 0);
  const perShareCost = result.cost / Math.max(1, totalShares);

  const cotas = useMemo<Cota[]>(() => {
    const gameCount = result.gameCount;
    // Distribuição arredondada por peso
    const totShares = participants.reduce((a, p) => a + p.shares, 0);
    if (totShares <= 0) return participants.map(p => ({ participant: p, gameIndices: [], cost: 0 }));
    const rawSizes = participants.map(p => (p.shares / totShares) * gameCount);
    const sizes = rawSizes.map(Math.floor);
    let assigned = sizes.reduce((a, b) => a + b, 0);
    // distribui sobra pelas maiores frações
    const remainders = rawSizes.map((v, i) => ({ i, r: v - Math.floor(v) }))
      .sort((a, b) => b.r - a.r);
    let k = 0;
    while (assigned < gameCount && k < remainders.length) {
      sizes[remainders[k].i]++;
      assigned++;
      k++;
    }
    const out: Cota[] = [];
    let cursor = 0;
    participants.forEach((p, i) => {
      const idxs: number[] = [];
      for (let j = 0; j < sizes[i] && cursor < gameCount; j++) idxs.push(cursor++);
      out.push({
        participant: p,
        gameIndices: idxs,
        cost: idxs.length * result.request.lottery.ticketPrice,
      });
    });
    return out;
  }, [participants, result]);

  const addParticipant = () => {
    setParticipants(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: `Participante ${prev.length + 1}`, shares: 1 },
    ]);
  };

  const removeParticipant = (id: string) => {
    if (participants.length <= 2) {
      toast.warning("Um bolão precisa de ao menos 2 participantes.");
      return;
    }
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const updateParticipant = (id: string, patch: Partial<Participant>) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  };

  const pad = (n: number) => n.toString().padStart(2, "0");

  const cotaMessage = (cota: Cota): string => {
    const lines: string[] = [];
    lines.push(`🎯 Bolão — ${result.request.lottery.name}`);
    lines.push(`Participante: ${cota.participant.name}`);
    lines.push(`Cotas: ${cota.participant.shares}/${totalShares}`);
    lines.push(`Jogos atribuídos: ${cota.gameIndices.length}`);
    lines.push(`Valor: ${formatCurrency(cota.cost)}`);
    lines.push("");
    cota.gameIndices.forEach(idx => {
      const g = result.games[idx];
      lines.push(`#${String(idx + 1).padStart(3, "0")}: ${g.map(pad).join(" ")}`);
    });
    if (shareBaseUrl) {
      lines.push("");
      lines.push(`Ver fechamento completo: ${shareBaseUrl}`);
    }
    return lines.join("\n");
  };

  const copyCota = async (cota: Cota) => {
    try {
      await navigator.clipboard.writeText(cotaMessage(cota));
      toast.success(`Cota de ${cota.participant.name} copiada.`);
    } catch {
      toast.error("Falha ao copiar.");
    }
  };

  const shareCota = async (cota: Cota) => {
    const msg = cotaMessage(cota);
    if (navigator.share) {
      try {
        await navigator.share({ title: `Bolão — ${cota.participant.name}`, text: msg });
      } catch { /* user cancel */ }
    } else {
      const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Users className="h-5 w-5 text-primary" />
          Fechamento Colaborativo (Bolão)
          <Badge variant="outline" className="ml-auto text-[10px]">
            {totalShares} cotas · {formatCurrency(perShareCost)}/cota
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <Input
                value={p.name}
                onChange={(e) => updateParticipant(p.id, { name: e.target.value })}
                className="flex-1"
                placeholder="Nome do participante"
              />
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Cotas</Label>
                <Input
                  type="number"
                  min={1}
                  max={result.gameCount}
                  value={p.shares}
                  onChange={(e) => updateParticipant(p.id, { shares: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-16"
                />
              </div>
              <Button size="icon" variant="ghost" onClick={() => removeParticipant(p.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={addParticipant}>
            <UserPlus className="h-4 w-4 mr-1" /> Adicionar participante
          </Button>
        </div>

        <div className="space-y-3">
          {cotas.map((cota) => (
            <div key={cota.participant.id} className="rounded-lg border bg-muted/10 p-3 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-sm">{cota.participant.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cota.participant.shares} cota{cota.participant.shares > 1 ? "s" : ""} · {cota.gameIndices.length} jogos · {formatCurrency(cota.cost)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => copyCota(cota)}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => shareCota(cota)}>
                    <Share2 className="h-3.5 w-3.5 mr-1" /> Compartilhar
                  </Button>
                </div>
              </div>
              <details>
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Ver jogos ({cota.gameIndices.length})
                </summary>
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {cota.gameIndices.map(idx => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-muted-foreground w-10">#{String(idx + 1).padStart(3, "0")}</span>
                      <div className="flex flex-wrap gap-1">
                        {result.games[idx].map(n => (
                          <span key={n} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-mono text-[10px]">
                            {pad(n)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-primary/5 border-primary/30 p-3 text-xs">
          <p className="font-semibold mb-1">Resumo do bolão</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-muted-foreground">Custo total</span>
            <span className="font-mono text-right">{formatCurrency(result.cost)}</span>
            <span className="text-muted-foreground">Participantes</span>
            <span className="font-mono text-right">{participants.length}</span>
            <span className="text-muted-foreground">Jogos distribuídos</span>
            <span className="font-mono text-right">{cotas.reduce((a, c) => a + c.gameIndices.length, 0)}/{result.gameCount}</span>
            <span className="text-muted-foreground">Valor por cota</span>
            <span className="font-mono text-right">{formatCurrency(perShareCost)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
