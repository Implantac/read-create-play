import { useState, useMemo } from "react";
import { Copy, Check, Shuffle, Heart, CalendarDays } from "lucide-react";
import {
  generateLotteryExtra,
  requiresExtra,
  TIMES_TIMEMANIA,
  MESES_DIA_DE_SORTE,
} from "@/engine/lottery-extras";
import { toast } from "sonner";

interface Props {
  lotteryId: string;
}

/**
 * Card compacto que exibe o elemento extra obrigatório da modalidade
 * (Time do Coração para Timemania, Mês da Sorte para Dia de Sorte).
 * Permite sortear novo, escolher manualmente e copiar para colar na Caixa.
 */
export function LotteryExtraCard({ lotteryId }: Props) {
  const isTime = lotteryId === "timemania";
  const isMes = lotteryId === "diadesorte";
  const list = useMemo(
    () => (isTime ? TIMES_TIMEMANIA : isMes ? MESES_DIA_DE_SORTE : []),
    [isTime, isMes],
  );

  const [extra, setExtra] = useState(() => generateLotteryExtra(lotteryId));
  const [copied, setCopied] = useState(false);

  if (!requiresExtra(lotteryId) || !extra) return null;

  const roll = () => setExtra(generateLotteryExtra(lotteryId));
  const pick = (value: string) => setExtra(generateLotteryExtra(lotteryId, value));

  const copy = () => {
    navigator.clipboard.writeText(`${extra.label}: ${extra.value} (${extra.index})`);
    setCopied(true);
    toast.success(`${extra.label} copiado`);
    setTimeout(() => setCopied(false), 1500);
  };

  const Icon = isTime ? Heart : CalendarDays;
  const accent = isTime ? "text-rose-400" : "text-amber-400";
  const border = isTime ? "border-rose-400/20" : "border-amber-400/20";
  const bg = isTime ? "bg-rose-500/5" : "bg-amber-500/5";

  return (
    <div className={`rounded-xl ${bg} border ${border} p-4 space-y-3`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${accent}`} />
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              {extra.label} — Obrigatório
            </p>
            <p className={`text-sm font-black ${accent}`}>
              {String(extra.index).padStart(2, "0")} · {extra.value}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={roll}
            className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
            title="Sortear outro"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={copy}
            className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
            title="Copiar"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <select
        value={extra.value}
        onChange={(e) => pick(e.target.value)}
        className="w-full text-[10px] rounded-md bg-background/60 border border-white/10 px-2 py-1.5 font-mono"
      >
        {list.map((v, i) => (
          <option key={v} value={v}>
            {String(i + 1).padStart(2, "0")} — {v}
          </option>
        ))}
      </select>

      <p className="text-[9px] text-muted-foreground leading-tight">
        {isTime
          ? "A Timemania exige 1 time do coração — dá direito a prêmio fixo de R$ 6,50 quando sorteado."
          : "O Dia de Sorte exige 1 mês da sorte — integra a faixa principal do prêmio."}
      </p>
    </div>
  );
}
