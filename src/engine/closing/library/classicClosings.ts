/**
 * Biblioteca de fechamentos clássicos — apenas metadados.
 * Ao aplicar um preset, o Motor Universal roda `generateClosing()` com os
 * parâmetros exatos. Nada é armazenado como matriz fixa.
 */

import type { ClosingStrategy } from "../core/types";

export type Complexity = "baixa" | "media" | "alta" | "extrema";

export interface ClassicClosing {
  id: string;
  /** Nome curto tipo "17x8" (base × jogos). */
  code: string;
  /** Nome descritivo humano. */
  name: string;
  /** Modalidade principal para a qual foi originalmente projetado. */
  primaryLottery: string;
  /** Lista de modalidades onde o preset pode ser aplicado. */
  applicableLotteries: string[];
  /** Tamanho da base de dezenas do fechamento clássico. */
  base: number;
  /** Garantia mínima (acertos). */
  minHits: number;
  /** Nº de jogos-alvo. Usado como `maxGames`. */
  games: number;
  /** Cobertura esperada (% aproximado). */
  coverage: number;
  complexity: Complexity;
  /** Origem histórica / autor / referência. */
  origin: string;
  /** Estratégia sugerida para gerar. */
  strategy: ClosingStrategy;
  /** Descrição curta. */
  description: string;
}

export const CLASSIC_CLOSINGS: ClassicClosing[] = [
  // ---------- Lotofácil ----------
  {
    id: "lf-17x8",
    code: "17x8",
    name: "Lotofácil 17 dezenas em 8 jogos",
    primaryLottery: "lotofacil",
    applicableLotteries: ["lotofacil"],
    base: 17, minHits: 14, games: 8, coverage: 82,
    complexity: "baixa",
    origin: "Fechamento popular brasileiro — Chvátal Greedy.",
    strategy: "greedy",
    description: "Custo baixo com garantia de 14 pontos se 15 caírem na base.",
  },
  {
    id: "lf-18x12",
    code: "18x12",
    name: "Lotofácil 18 dezenas em 12 jogos",
    primaryLottery: "lotofacil",
    applicableLotteries: ["lotofacil"],
    base: 18, minHits: 14, games: 12, coverage: 94,
    complexity: "media",
    origin: "Clássico de bancas — Simulated Annealing.",
    strategy: "simulated_annealing",
    description: "Excelente relação custo/benefício, cobertura quase total.",
  },
  {
    id: "lf-19x5",
    code: "19x5",
    name: "Lotofácil 19 dezenas em 5 jogos",
    primaryLottery: "lotofacil",
    applicableLotteries: ["lotofacil"],
    base: 19, minHits: 13, games: 5, coverage: 71,
    complexity: "baixa",
    origin: "Fechamento econômico.",
    strategy: "greedy",
    description: "Máxima economia — foca no 13 pontos.",
  },
  {
    id: "lf-19x20",
    code: "19x20",
    name: "Lotofácil 19 dezenas em 20 jogos",
    primaryLottery: "lotofacil",
    applicableLotteries: ["lotofacil"],
    base: 19, minHits: 14, games: 20, coverage: 98,
    complexity: "media",
    origin: "Fechamento intermediário premium.",
    strategy: "genetic",
    description: "Cobertura próxima de 100% com 20 jogos.",
  },
  {
    id: "lf-20x25",
    code: "20x25",
    name: "Lotofácil 20 dezenas em 25 jogos",
    primaryLottery: "lotofacil",
    applicableLotteries: ["lotofacil"],
    base: 20, minHits: 14, games: 25, coverage: 99,
    complexity: "alta",
    origin: "Fechamento avançado — Genético.",
    strategy: "genetic",
    description: "Praticamente garante 14 pontos com base de 20 dezenas.",
  },
  {
    id: "lf-21x50",
    code: "21x50",
    name: "Lotofácil 21 dezenas em 50 jogos",
    primaryLottery: "lotofacil",
    applicableLotteries: ["lotofacil"],
    base: 21, minHits: 14, games: 50, coverage: 100,
    complexity: "alta",
    origin: "Fechamento estendido — Covering Design.",
    strategy: "covering_design",
    description: "Garantia matemática de 14 pontos em 21 dezenas.",
  },
  {
    id: "lf-22x100",
    code: "22x100",
    name: "Lotofácil 22 dezenas em 100 jogos",
    primaryLottery: "lotofacil",
    applicableLotteries: ["lotofacil"],
    base: 22, minHits: 14, games: 100, coverage: 100,
    complexity: "alta",
    origin: "Sindicato de apostadores.",
    strategy: "covering_design",
    description: "Base ampla, garantia sólida de 14 pontos.",
  },
  {
    id: "lf-23x200",
    code: "23x200",
    name: "Lotofácil 23 dezenas em 200 jogos",
    primaryLottery: "lotofacil",
    applicableLotteries: ["lotofacil"],
    base: 23, minHits: 14, games: 200, coverage: 100,
    complexity: "extrema",
    origin: "Bolão profissional — Covering Design ótimo.",
    strategy: "covering_design",
    description: "Cobertura completa com base de 23 dezenas.",
  },
  {
    id: "lf-24x400",
    code: "24x400",
    name: "Lotofácil 24 dezenas em 400 jogos",
    primaryLottery: "lotofacil",
    applicableLotteries: ["lotofacil"],
    base: 24, minHits: 14, games: 400, coverage: 100,
    complexity: "extrema",
    origin: "Fechamento máximo antes do bolão fechado 25 dezenas.",
    strategy: "covering_design",
    description: "Praticamente exaustivo — cobre todos os cenários realistas.",
  },
  // ---------- Mega-Sena ----------
  {
    id: "ms-8x7",
    code: "8x7",
    name: "Mega-Sena 8 dezenas em 7 jogos",
    primaryLottery: "megasena",
    applicableLotteries: ["megasena"],
    base: 8, minHits: 5, games: 7, coverage: 88,
    complexity: "baixa",
    origin: "Fechamento tradicional de bancas.",
    strategy: "greedy",
    description: "Garante Quina se 6 caírem na base.",
  },
  {
    id: "ms-10x21",
    code: "10x21",
    name: "Mega-Sena 10 dezenas em 21 jogos",
    primaryLottery: "megasena",
    applicableLotteries: ["megasena"],
    base: 10, minHits: 5, games: 21, coverage: 98,
    complexity: "media",
    origin: "Covering Design C(10,6,5).",
    strategy: "covering_design",
    description: "Boa cobertura para 10 dezenas na Mega.",
  },
  {
    id: "ms-12x50",
    code: "12x50",
    name: "Mega-Sena 12 dezenas em 50 jogos",
    primaryLottery: "megasena",
    applicableLotteries: ["megasena"],
    base: 12, minHits: 5, games: 50, coverage: 100,
    complexity: "alta",
    origin: "Bolão profissional.",
    strategy: "genetic",
    description: "Garantia total de Quina em base de 12.",
  },
  // ---------- Quina ----------
  {
    id: "qn-8x6",
    code: "8x6",
    name: "Quina 8 dezenas em 6 jogos",
    primaryLottery: "quina",
    applicableLotteries: ["quina"],
    base: 8, minHits: 4, games: 6, coverage: 85,
    complexity: "baixa",
    origin: "Fechamento popular Quina.",
    strategy: "greedy",
    description: "Garante Quadra se 5 caírem em 8.",
  },
  {
    id: "qn-10x15",
    code: "10x15",
    name: "Quina 10 dezenas em 15 jogos",
    primaryLottery: "quina",
    applicableLotteries: ["quina"],
    base: 10, minHits: 4, games: 15, coverage: 97,
    complexity: "media",
    origin: "Covering Design.",
    strategy: "covering_design",
    description: "Ótima cobertura de Quadra.",
  },
  // ---------- Lotomania ----------
  {
    id: "lm-55x10",
    code: "55x10",
    name: "Lotomania 55 dezenas em 10 jogos",
    primaryLottery: "lotomania",
    applicableLotteries: ["lotomania"],
    base: 55, minHits: 18, games: 10, coverage: 90,
    complexity: "media",
    origin: "Fechamento clássico Lotomania.",
    strategy: "genetic",
    description: "Base ampliada de 55 números para garantir 18 pontos.",
  },
];

export type ClassicComplexityFilter = Complexity | "todas";

export function filterClassicClosings(list: ClassicClosing[], opts: {
  lottery?: string;
  complexity?: ClassicComplexityFilter;
  maxGames?: number;
  search?: string;
}): ClassicClosing[] {
  let out = list;
  if (opts.lottery) out = out.filter(c => c.applicableLotteries.includes(opts.lottery!));
  if (opts.complexity && opts.complexity !== "todas") out = out.filter(c => c.complexity === opts.complexity);
  if (opts.maxGames && opts.maxGames > 0) out = out.filter(c => c.games <= opts.maxGames!);
  if (opts.search) {
    const q = opts.search.toLowerCase();
    out = out.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.origin.toLowerCase().includes(q),
    );
  }
  return out;
}
