import { useMemo } from "react";
import { Trophy, MapPin, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { motion } from "framer-motion";

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export function LatestDrawCard() {
  const { config, drawsWithPrizes, syncDraws, syncing } = useLotteryContext();
  const latest = useMemo(() => drawsWithPrizes[0], [drawsWithPrizes]);

  if (!latest) return null;

  const tiers = latest.prizeTiers;
  const locals = (tiers as any)?.localGanhadores as
    | Array<{ municipio: string; uf: string; ganhadores: number; nomeFantasia?: string }>
    | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl border border-primary/20 p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary font-bold">
            <Sparkles className="w-3 h-3" /> Último sorteio — {config.name}
          </div>
          <h3 className="text-2xl font-black tracking-tight">
            Concurso #{latest.concurso}
            <span className="ml-2 text-xs font-medium text-muted-foreground">{latest.date}</span>
          </h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={syncDraws}
          disabled={syncing}
          className="gap-2 h-8 text-xs"
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Atualizando..." : "Atualizar concurso"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {latest.numbers.map(n => (
          <span key={n} className="lottery-ball w-9 h-9 text-xs">
            {String(n).padStart(2, "0")}
          </span>
        ))}
      </div>

      {tiers ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="rounded-lg bg-muted/30 p-2.5">
              <div className="text-[10px] text-muted-foreground uppercase">Arrecadado</div>
              <div className="font-mono font-bold">{fmtBRL(tiers.valorArrecadado)}</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5">
              <div className="text-[10px] text-muted-foreground uppercase">Acumulado p/ próximo</div>
              <div className="font-mono font-bold">{fmtBRL(tiers.valorAcumulado)}</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5">
              <div className="text-[10px] text-muted-foreground uppercase">Estimado próximo</div>
              <div className="font-mono font-bold">{fmtBRL(tiers.valorEstimado)}</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5">
              <div className="text-[10px] text-muted-foreground uppercase">Status</div>
              <div className={`font-bold ${tiers.acumulou ? "text-amber-500" : "text-emerald-500"}`}>
                {tiers.acumulou ? "Acumulou" : "Houve ganhador"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> Premiações por faixa
            </div>
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">Faixa</th>
                    <th className="text-right px-3 py-2 font-semibold">Ganhadores</th>
                    <th className="text-right px-3 py-2 font-semibold">Prêmio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {tiers.premiacoes.map(p => (
                    <tr key={p.faixa} className="hover:bg-primary/5">
                      <td className="px-3 py-2">{p.descricao}</td>
                      <td className="px-3 py-2 text-right font-mono">{p.ganhadores.toLocaleString("pt-BR")}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{fmtBRL(p.valorPremio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {locals && locals.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Estados/Cidades com apostas ganhadoras
              </div>
              <div className="flex flex-wrap gap-1.5">
                {locals.map((l, i) => (
                  <span
                    key={`${l.uf}-${l.municipio}-${i}`}
                    className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[11px] font-mono"
                  >
                    {l.municipio}/{l.uf}
                    {l.ganhadores > 1 ? ` ×${l.ganhadores}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-xs text-muted-foreground">
          Premiações ainda não disponíveis. Clique em "Atualizar concurso" para buscar.
        </div>
      )}
    </motion.div>
  );
}
