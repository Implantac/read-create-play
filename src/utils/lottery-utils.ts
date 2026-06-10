import { DrawPrizeData } from "@/services/api/lottery";

export function getMaxPossibleHits(lotteryId: string, pick: number): number {
  switch (lotteryId) {
    case "lotomania": return 20;
    case "timemania": return 7;
    default: return pick;
  }
}

export function matchBetAgainstDraw(bet: number[], draw: number[], lotteryId: string): { hits: number; matched: number[] } {
  if (lotteryId === "supersete") {
    const matched: number[] = [];
    const len = Math.min(bet.length, draw.length);
    for (let i = 0; i < len; i++) {
      if (bet[i] === draw[i]) matched.push(bet[i]);
    }
    return { hits: matched.length, matched };
  }
  const matched = bet.filter(n => draw.includes(n));
  return { hits: matched.length, matched };
}

export function getEstimatedPrize(lotteryId: string, hits: number): { value: number; label: string } | null {
  const prizes: Record<string, Record<number, { value: number; label: string }>> = {
    megasena: {
      6: { value: 50000000, label: "Sena (~R$50M)" }, 5: { value: 40000, label: "Quina (~R$40k)" }, 4: { value: 800, label: "Quadra (~R$800)" },
    },
    lotofacil: {
      15: { value: 1500000, label: "15 pts (~R$1.5M)" }, 14: { value: 2000, label: "14 pts (~R$2k)" },
      13: { value: 35, label: "13 pts (R$35)" }, 12: { value: 14, label: "12 pts (R$14)" }, 11: { value: 7, label: "11 pts (R$7)" },
    },
    quina: {
      5: { value: 5000000, label: "Quina (~R$5M)" }, 4: { value: 6000, label: "Quadra (~R$6k)" },
      3: { value: 150, label: "Terno (~R$150)" }, 2: { value: 5, label: "Duque (~R$5)" },
    },
    lotomania: {
      20: { value: 3000000, label: "20 pts (~R$3M)" }, 19: { value: 50000, label: "19 pts (~R$50k)" },
      18: { value: 2000, label: "18 pts (~R$2k)" }, 17: { value: 200, label: "17 pts (~R$200)" },
      16: { value: 30, label: "16 pts (~R$30)" }, 15: { value: 6, label: "15 pts (R$6)" }, 0: { value: 6, label: "0 pts (R$6)" },
    },
    duplasena: {
      6: { value: 3000000, label: "Sena (~R$3M)" }, 5: { value: 5000, label: "Quina (~R$5k)" },
      4: { value: 100, label: "Quadra (~R$100)" }, 3: { value: 3, label: "Terno (~R$3)" },
    },
    timemania: {
      7: { value: 8000000, label: "7 pts (~R$8M)" }, 6: { value: 50000, label: "6 pts (~R$50k)" },
      5: { value: 1000, label: "5 pts (~R$1k)" }, 4: { value: 10, label: "4 pts (~R$10)" }, 3: { value: 3, label: "3 pts (R$3)" },
    },
    diadesorte: {
      7: { value: 1000000, label: "7 pts (~R$1M)" }, 6: { value: 5000, label: "6 pts (~R$5k)" },
      5: { value: 100, label: "5 pts (~R$100)" }, 4: { value: 5, label: "4 pts (~R$5)" },
    },
    supersete: {
      7: { value: 1000000, label: "7 pts (~R$1M)" }, 6: { value: 50000, label: "6 pts (~R$50k)" },
      5: { value: 1000, label: "5 pts (~R$1k)" }, 4: { value: 10, label: "4 pts (~R$10)" }, 3: { value: 3, label: "3 pts (R$3)" },
    },
  };
  return prizes[lotteryId]?.[hits] || null;
}

export function getRealPrizeLabel(prizeTiers: DrawPrizeData | null | undefined, hits: number): string | undefined {
  if (!prizeTiers?.premiacoes) return undefined;
  const tier = prizeTiers.premiacoes.find(p => {
    const desc = p.descricao.toLowerCase();
    return desc.includes(`${hits} acerto`) || desc.includes(`${hits} ponto`) || p.faixa === hits;
  });
  if (tier && tier.valorPremio > 0) {
    return `R$ ${tier.valorPremio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}${tier.ganhadores > 0 ? ` (${tier.ganhadores} ganh.)` : ""}`;
  }
  return undefined;
}

export function formatCurrency(value: number): string {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return `R$ ${value.toFixed(0)}`;
}
