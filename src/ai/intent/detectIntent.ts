/**
 * Native AI — Intent Classifier
 * Parses natural language input into structured intent
 */

import { LOTTERIES } from "@/data/lotteries";
import type { AIIntent, RiskProfile, ParsedIntent, IntentFilters } from "../core/aiTypes";

const LOTTERY_ALIASES: Record<string, string> = {
  "lotofacil": "lotofacil", "lotofácil": "lotofacil", "loto facil": "lotofacil", "loto fácil": "lotofacil",
  "mega sena": "megasena", "megasena": "megasena", "mega": "megasena",
  "quina": "quina",
  "lotomania": "lotomania",
  "dupla sena": "duplasena", "duplasena": "duplasena", "dupla": "duplasena",
  "timemania": "timemania",
  "dia de sorte": "diadesorte", "diadesorte": "diadesorte", "dia da sorte": "diadesorte",
  "super sete": "supersete", "supersete": "supersete", "super 7": "supersete",
};

const INTENT_PATTERNS: { pattern: RegExp; intent: AIIntent; weight: number }[] = [
  { pattern: /fecha(mento|r)|wheel|cobert(ura|rir)|desdobr/i, intent: "create_wheeling", weight: 10 },
  { pattern: /simul(ar|ação|e)|testar?\s+jog/i, intent: "simulate", weight: 9 },
  { pattern: /rank(ear|ing)|classific|pontua|melhor(es)?\s+jog/i, intent: "rank_games", weight: 8 },
  { pattern: /analis(ar|e)|históric|estatístic|padr(ão|ões)/i, intent: "analyze_history", weight: 7 },
  { pattern: /explic(ar|ação|que)|por\s*qu[eê]|como\s+funciona|estratégia/i, intent: "explain_strategy", weight: 6 },
  { pattern: /compar(ar|e|ação)|versus|vs\b/i, intent: "compare_games", weight: 6 },
  { pattern: /suger(ir|estão)|recomen(dar|dação)|qual\s+melhor/i, intent: "suggest_strategy", weight: 5 },
  { pattern: /ger(ar|e)|cri(ar|e)|mont(ar|e)|jog(o|os)|aposta|número/i, intent: "generate_games", weight: 4 },
];

const RISK_PATTERNS: { pattern: RegExp; profile: RiskProfile }[] = [
  { pattern: /conservador|segur|estável|consistente/i, profile: "conservative" },
  { pattern: /equilibrad|balancead|moderado/i, profile: "balanced" },
  { pattern: /agressiv|arrojad|ousad|arriscad/i, profile: "aggressive" },
  { pattern: /estatístic|análise pura|dados/i, profile: "statistical" },
  { pattern: /exploratóri|diferente|incomum|raro/i, profile: "exploratory" },
  { pattern: /cobertura|máxim|cobrir/i, profile: "max_coverage" },
  { pattern: /anti.?popular|impopular|evitar óbvi/i, profile: "anti_popular" },
];

export function detectIntent(input: string, currentLotteryId?: string): ParsedIntent {
  const lower = input.toLowerCase().trim();

  // Detect lottery
  let lotteryId = currentLotteryId || null;
  for (const [alias, id] of Object.entries(LOTTERY_ALIASES)) {
    if (lower.includes(alias)) { lotteryId = id; break; }
  }

  // Detect intent
  let intent: AIIntent = "generate_games";
  let maxWeight = 0;
  for (const p of INTENT_PATTERNS) {
    if (p.pattern.test(lower) && p.weight > maxWeight) {
      intent = p.intent;
      maxWeight = p.weight;
    }
  }

  // Detect quantity
  let quantity = 10;
  const qtyMatch = lower.match(/(\d+)\s*(jog|aposta|número|combin)/);
  if (qtyMatch) quantity = Math.min(100, Math.max(1, parseInt(qtyMatch[1])));
  const qtyMatch2 = lower.match(/ger[ae]\s+(\d+)/);
  if (qtyMatch2) quantity = Math.min(100, Math.max(1, parseInt(qtyMatch2[1])));

  // Detect risk profile
  let riskProfile: RiskProfile = "balanced";
  for (const r of RISK_PATTERNS) {
    if (r.pattern.test(lower)) { riskProfile = r.profile; break; }
  }

  // Detect history window
  let historyWindow = 100;
  const histMatch = lower.match(/últimos?\s+(\d+)\s*(concurso|resultado|sorteio)/);
  if (histMatch) historyWindow = Math.min(500, parseInt(histMatch[1]));

  // Detect wheeling base
  let wheelingBase: number | null = null;
  const wheelMatch = lower.match(/(\d+)\s*dezenas?\s*(base|escolh)/);
  if (wheelMatch) wheelingBase = parseInt(wheelMatch[1]);
  const wheelMatch2 = lower.match(/fecha(mento|r)\s*(de\s+)?(\d+)/);
  if (wheelMatch2) wheelingBase = parseInt(wheelMatch2[3]);

  // Detect filters
  const filters: IntentFilters = {
    avoidSequences: /evit(ar|e)\s*(muitas?\s*)?sequ[eê]nc/i.test(lower) || /sem\s+sequ/i.test(lower),
    balanceParity: /par(es)?.*ímpar|ímpar.*par|equil.*par/i.test(lower),
    balanceHighLow: /equil.*alt|equil.*baix|distribuição/i.test(lower),
    prioritizeHot: /quentes|mais\s+sorteados|frequentes/i.test(lower),
    prioritizeCold: /frios|menos\s+sorteados|atrasados/i.test(lower),
    frameCenter: /moldura|centro|borda|miolo/i.test(lower),
    limitRepetition: /repet|limitar.*repet/i.test(lower),
  };

  const confidence = maxWeight > 0 ? Math.min(1, maxWeight / 10) : 0.5;

  return {
    intent, lotteryId, quantity, riskProfile, filters,
    historyWindow, wheelingBase, rawInput: input, confidence,
  };
}
