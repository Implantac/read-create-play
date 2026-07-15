/**
 * suggestBase — sugere uma base ideal (tamanho + dezenas) para atingir
 * uma garantia com o menor custo possível, usando estatística histórica.
 */

import { schonheimBound } from "../core/combinatorics";

export interface BaseSuggestion {
  baseSize: number;
  numbers: number[];
  minHits: number;
  estimatedGames: number;
  estimatedCost: number;
  coverageHint: string;
  rationale: string[];
}

export interface SuggestBaseInput {
  totalNumbers: number;
  pick: number;
  ticketPrice: number;
  recentDraws: number[][];
  targetGuarantee: number;  // acertos garantidos desejados
  budget?: number;          // orçamento em R$
  /** conservative | balanced | aggressive */
  risk?: "conservative" | "balanced" | "aggressive";
}

export function suggestBase(input: SuggestBaseInput): BaseSuggestion[] {
  const risk = input.risk ?? "balanced";
  const draws = input.recentDraws.slice(0, 80);

  // Frequência
  const freq = new Map<number, number>();
  for (let i = 1; i <= input.totalNumbers; i++) freq.set(i, 0);
  for (const d of draws) for (const n of d) freq.set(n, (freq.get(n) ?? 0) + 1);

  const sortedByFreq = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);

  // Candidatos de tamanho de base
  const minBase = input.pick + 1;
  const maxBase = Math.min(input.totalNumbers, input.pick + 8);
  const suggestions: BaseSuggestion[] = [];

  for (let size = minBase; size <= maxBase; size++) {
    // Estima jogos via lower bound de Schönheim
    const games = schonheimBound(size, input.pick, input.targetGuarantee);
    const cost = games * input.ticketPrice;
    if (input.budget && cost > input.budget * 1.5) continue;

    // Selecionar dezenas conforme perfil
    let picks: number[];
    if (risk === "aggressive") {
      // Mix quentes + atrasadas
      picks = sortedByFreq.slice(0, size);
    } else if (risk === "conservative") {
      // Alternar quentes e frias para diversificar
      const hot = sortedByFreq.slice(0, Math.ceil(size * 0.6));
      const rest = sortedByFreq.slice(Math.ceil(size * 0.6));
      picks = [...hot, ...rest.slice(0, size - hot.length)];
    } else {
      // Balanceado: 70% top freq, 30% médias
      const top = sortedByFreq.slice(0, Math.ceil(size * 0.7));
      const mid = sortedByFreq.slice(Math.floor(input.totalNumbers * 0.3), Math.floor(input.totalNumbers * 0.7));
      picks = [...top];
      for (const n of mid) {
        if (picks.length >= size) break;
        if (!picks.includes(n)) picks.push(n);
      }
    }
    picks = [...new Set(picks)].slice(0, size).sort((a, b) => a - b);

    const rationale = [
      `Base ${size}: cobre garantia de ${input.targetGuarantee} acertos com ~${games} jogos.`,
      `Custo estimado ${cost.toFixed(2)} (${input.ticketPrice.toFixed(2)}/jogo).`,
      risk === "aggressive"
        ? "Perfil agressivo: prioriza dezenas mais frequentes recentes."
        : risk === "conservative"
        ? "Perfil conservador: mistura quentes e frias para diversificação."
        : "Perfil balanceado: 70% quentes + 30% médias.",
    ];

    suggestions.push({
      baseSize: size,
      numbers: picks,
      minHits: input.targetGuarantee,
      estimatedGames: games,
      estimatedCost: cost,
      coverageHint: input.budget && cost <= input.budget ? "Cabe no orçamento" : "Acima do orçamento",
      rationale,
    });
  }

  // Ordena: primeiro os que cabem no orçamento, depois por menor custo
  return suggestions.sort((a, b) => {
    if (input.budget) {
      const aFits = a.estimatedCost <= input.budget;
      const bFits = b.estimatedCost <= input.budget;
      if (aFits !== bFits) return aFits ? -1 : 1;
    }
    return a.estimatedGames - b.estimatedGames;
  }).slice(0, 4);
}
