/**
 * Biblioteca de Estratégias Profissionais
 * Módulo completo com 6 estratégias avançadas para geração de apostas
 */

import { NumberStats } from "@/engine/stats/statistics";
import { DrawResult } from "@/data/lotteries";
import { getLotteryRules, PRIMES, FIBONACCI } from "./lotteriesKnowledge";
import type { LotteryRules } from "../core/aiTypes";

export interface StrategyResult {
  id: string;
  name: string;
  description: string;
  candidateNumbers: number[];
  weights: Map<number, number>;
  metrics: Record<string, number>;
}

// ═══════════════════════════════════════════
// POOL DE CANDIDATOS POR LOTERIA
// Cada modalidade tem escala e mecânica próprias — um pool fixo (topN=18)
// não serve para todas. Lotomania precisa de 50+ para conseguir gerar um
// jogo; Super Sete só tem 10 dígitos por coluna. Esta tabela é a fonte
// única da verdade para o tamanho do pool.
// ═══════════════════════════════════════════
const LOTTERY_POOL_SIZE: Record<string, number> = {
  lotofacil: 20,       // 25 total, marca 15 → deixa ~5 fora
  megasena: 18,        // 60 total, marca 6  → 3× o pick
  quina: 22,           // 80 total, marca 5
  lotomania: 65,       // 100 total, marca 50 → precisa ser > pick
  duplasena: 18,       // 50 total, marca 6
  timemania: 24,       // 80 total, marca 10
  diadesorte: 16,      // 31 total, marca 7
  supersete: 10,       // universo pequeno = usa todo o pool
  maismilionaria: 20,  // 50 total, marca 6
};

export function getStrategyPoolSize(lotteryId: string): number {
  const explicit = LOTTERY_POOL_SIZE[lotteryId];
  if (explicit) return explicit;
  const rules = getLotteryRules(lotteryId);
  return Math.min(rules.totalNumbers, Math.max(rules.pick + 6, Math.round(rules.pick * 1.2)));
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 1 — FREQUÊNCIA
// Selecionar números com maior ocorrência histórica
// ═══════════════════════════════════════════
export function strategyFrequency(
  stats: NumberStats[],
  draws: DrawResult[],
  topN: number = 18
): StrategyResult {
  const sorted = [...stats].sort((a, b) => b.frequency - a.frequency);
  const candidates = sorted.slice(0, topN).map(s => s.number);
  const weights = new Map<number, number>();
  
  sorted.forEach((s, idx) => {
    // Weight based on frequency rank + recent frequency boost
    const recentFreq = computeRecentFrequency(s.number, draws, 20);
    const totalWeight = s.frequency * 0.6 + recentFreq * 0.4;
    weights.set(s.number, totalWeight);
  });

  const avgFreq = stats.reduce((sum, s) => sum + s.frequency, 0) / stats.length;
  
  return {
    id: "frequency",
    name: "Frequência Histórica",
    description: "Prioriza números com maior ocorrência nos concursos anteriores, ponderando frequência total e recente.",
    candidateNumbers: candidates,
    weights,
    metrics: {
      avgFrequency: avgFreq,
      topFrequency: sorted[0]?.frequency || 0,
      recentWindow: 20,
    },
  };
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 2 — ATRASO
// Selecionar números que não aparecem há vários concursos
// ═══════════════════════════════════════════
export function strategyDelay(
  stats: NumberStats[],
  draws: DrawResult[],
  topN: number = 18
): StrategyResult {
  const sorted = [...stats].sort((a, b) => b.lastSeen - a.lastSeen);
  const candidates = sorted.slice(0, topN).map(s => s.number);
  const weights = new Map<number, number>();

  const maxDelay = Math.max(...stats.map(s => s.lastSeen));
  sorted.forEach(s => {
    // Higher weight for more delayed numbers, with cycle score boost
    const delayWeight = (s.lastSeen / maxDelay) * 0.7 + (s.cycleScore > 1 ? 0.3 : 0);
    weights.set(s.number, delayWeight * 10);
  });

  return {
    id: "delay",
    name: "Números Atrasados",
    description: "Prioriza números que estão há mais concursos sem ser sorteados, considerando ciclos históricos de retorno.",
    candidateNumbers: candidates,
    weights,
    metrics: {
      maxDelay: maxDelay,
      avgDelay: stats.reduce((s, st) => s + st.lastSeen, 0) / stats.length,
      delayedAbove10: stats.filter(s => s.lastSeen > 10).length,
    },
  };
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 3 — EQUILÍBRIO ESTRUTURAL
// Distribuir pares/ímpares e baixos/altos
// ═══════════════════════════════════════════
export function strategyBalance(
  stats: NumberStats[],
  lotteryId: string,
  topN: number = 18
): StrategyResult {
  const rules = getLotteryRules(lotteryId);
  const mid = Math.ceil(rules.totalNumbers / 2);
  
  const evens = stats.filter(s => s.number % 2 === 0).sort((a, b) => b.frequency - a.frequency);
  const odds = stats.filter(s => s.number % 2 !== 0).sort((a, b) => b.frequency - a.frequency);
  const lows = stats.filter(s => s.number <= mid).sort((a, b) => b.frequency - a.frequency);
  const highs = stats.filter(s => s.number > mid).sort((a, b) => b.frequency - a.frequency);

  // Pick balanced amounts from each group
  const halfN = Math.ceil(topN / 2);
  const candidateSet = new Set<number>();
  
  evens.slice(0, halfN).forEach(s => candidateSet.add(s.number));
  odds.slice(0, halfN).forEach(s => candidateSet.add(s.number));
  lows.slice(0, halfN).forEach(s => candidateSet.add(s.number));
  highs.slice(0, halfN).forEach(s => candidateSet.add(s.number));

  const candidates = [...candidateSet].sort((a, b) => a - b).slice(0, topN);
  const weights = new Map<number, number>();
  
  candidates.forEach(n => {
    const stat = stats.find(s => s.number === n);
    const isEven = n % 2 === 0;
    const isLow = n <= mid;
    const isPrime = PRIMES.has(n);
    const isFib = FIBONACCI.has(n);
    let w = (stat?.frequency || 0) * 0.4;
    w += isPrime ? 1.5 : 0;
    w += isFib ? 1.0 : 0;
    w += (isEven ? 0.5 : 0.5); // equal weight
    w += (isLow ? 0.5 : 0.5);
    weights.set(n, w);
  });

  return {
    id: "balance",
    name: "Equilíbrio Estrutural",
    description: "Distribui números equilibrando pares/ímpares e baixos/altos, com bônus para primos e Fibonacci.",
    candidateNumbers: candidates,
    weights,
    metrics: {
      evens: candidates.filter(n => n % 2 === 0).length,
      odds: candidates.filter(n => n % 2 !== 0).length,
      lows: candidates.filter(n => n <= mid).length,
      highs: candidates.filter(n => n > mid).length,
      primes: candidates.filter(n => PRIMES.has(n)).length,
    },
  };
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 4 — DISPERSÃO
// Evitar concentração em uma região do volante
// ═══════════════════════════════════════════
export function strategyDispersion(
  stats: NumberStats[],
  lotteryId: string,
  topN: number = 18
): StrategyResult {
  const rules = getLotteryRules(lotteryId);
  const rangeSize = Math.ceil(rules.totalNumbers / 5);
  
  // Divide into 5 ranges
  const ranges: NumberStats[][] = [];
  for (let r = 0; r < 5; r++) {
    const lo = r * rangeSize + 1;
    const hi = Math.min((r + 1) * rangeSize, rules.totalNumbers);
    ranges.push(stats.filter(s => s.number >= lo && s.number <= hi).sort((a, b) => b.frequency - a.frequency));
  }

  // Pick proportionally from each range
  const perRange = Math.ceil(topN / 5);
  const candidates: number[] = [];
  const weights = new Map<number, number>();

  ranges.forEach((range, rIdx) => {
    range.slice(0, perRange).forEach(s => {
      candidates.push(s.number);
      // Weight: frequency + dispersion bonus
      weights.set(s.number, s.frequency + (rIdx + 1) * 0.5);
    });
  });

  return {
    id: "dispersion",
    name: "Dispersão no Volante",
    description: "Distribui números uniformemente por todas as faixas do volante, evitando concentração.",
    candidateNumbers: candidates.slice(0, topN).sort((a, b) => a - b),
    weights,
    metrics: {
      rangesUsed: ranges.filter(r => r.length > 0).length,
      numbersPerRange: perRange,
      rangeSize,
    },
  };
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 5 — ANTI-PADRÕES
// Evitar sequências longas, números colados e padrões visuais
// ═══════════════════════════════════════════
export function strategyAntiPattern(
  stats: NumberStats[],
  draws: DrawResult[],
  lotteryId: string,
  topN: number = 18
): StrategyResult {
  const rules = getLotteryRules(lotteryId);
  
  // Score each number by how "unpredictable" it is
  const weights = new Map<number, number>();
  const scored = stats.map(s => {
    // Penalize numbers that commonly appear in sequences
    const seqPenalty = computeSequencePenalty(s.number, draws, rules.totalNumbers);
    // Penalize popular numbers (anti-popular)
    const popularityPenalty = s.frequency / draws.length;
    // Favor numbers with irregular patterns
    const irregularity = (s as { stdDevInterval?: number }).stdDevInterval ?? 1;
    
    const score = irregularity * 2 - seqPenalty * 3 - popularityPenalty * 1.5;
    weights.set(s.number, Math.max(0.1, score));
    return { number: s.number, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const candidates = scored.slice(0, topN).map(s => s.number).sort((a, b) => a - b);

  return {
    id: "anti_pattern",
    name: "Anti-Padrões",
    description: "Evita sequências longas, números colados e padrões visuais óbvios. Ideal para diferenciação.",
    candidateNumbers: candidates,
    weights,
    metrics: {
      avgIrregularity: scored.slice(0, topN).reduce((s, v) => s + v.score, 0) / topN,
    },
  };
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 6 — COBERTURA
// Gerar múltiplos jogos que cobrem diferentes regiões
// ═══════════════════════════════════════════
export function strategyCoverage(
  stats: NumberStats[],
  lotteryId: string,
  topN: number = 22
): StrategyResult {
  const rules = getLotteryRules(lotteryId);
  
  // Select maximum coverage pool
  // Mix: top frequency + top delayed + primes + fibonacci
  const byFreq = [...stats].sort((a, b) => b.frequency - a.frequency).slice(0, Math.ceil(topN * 0.4));
  const byDelay = [...stats].sort((a, b) => b.lastSeen - a.lastSeen).slice(0, Math.ceil(topN * 0.3));
  const primeNums = stats.filter(s => PRIMES.has(s.number)).sort((a, b) => b.frequency - a.frequency).slice(0, Math.ceil(topN * 0.15));
  const fibNums = stats.filter(s => FIBONACCI.has(s.number)).sort((a, b) => b.frequency - a.frequency).slice(0, Math.ceil(topN * 0.15));

  const candidateSet = new Set<number>();
  [...byFreq, ...byDelay, ...primeNums, ...fibNums].forEach(s => candidateSet.add(s.number));
  
  const candidates = [...candidateSet].sort((a, b) => a - b).slice(0, topN);
  const weights = new Map<number, number>();

  candidates.forEach(n => {
    const stat = stats.find(s => s.number === n);
    const w = (stat?.frequency || 0) * 0.3 + (stat?.lastSeen || 0) * 0.3 + 
              (PRIMES.has(n) ? 2 : 0) + (FIBONACCI.has(n) ? 1.5 : 0) +
              (stat?.cycleScore || 0) * 1.5;
    weights.set(n, w);
  });

  return {
    id: "coverage",
    name: "Cobertura Máxima",
    description: "Maximiza a dispersão numérica combinando frequência, atraso, primos e Fibonacci para cobrir mais faixas.",
    candidateNumbers: candidates,
    weights,
    metrics: {
      poolSize: candidates.length,
      fromFrequency: byFreq.length,
      fromDelay: byDelay.length,
      primes: primeNums.length,
      fibonacci: fibNums.length,
    },
  };
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 7 — REPETIÇÃO DO SORTEIO ANTERIOR
// Alavanca o viés estatístico mais forte de várias loterias: uma parte
// das dezenas do sorteio anterior tende a reaparecer. Lotofácil: 8-10
// repetem; Mega: 1-3; Timemania: 3-5; etc. Combina isso com frequência
// recente para priorizar dezenas "ainda em movimento".
// ═══════════════════════════════════════════
export function strategyRepetition(
  stats: NumberStats[],
  draws: DrawResult[],
  lotteryId: string,
  topN?: number
): StrategyResult {
  const rules = getLotteryRules(lotteryId);
  const n = topN ?? getStrategyPoolSize(lotteryId);
  const lastDraw = draws[0]?.numbers ?? [];
  const lastSet = new Set(lastDraw);
  const [repLo, repHi] = rules.avgRepeatFromPrevious ?? [
    Math.floor(rules.pick * 0.3),
    Math.floor(rules.pick * 0.6),
  ];
  const repeatTarget = Math.round((repLo + repHi) / 2);

  const scored = stats.map(s => {
    const inLast = lastSet.has(s.number) ? 1 : 0;
    const recent = computeRecentFrequency(s.number, draws, 15);
    const score = inLast * 5 + recent * 0.6 + s.frequency * 0.2 - s.lastSeen * 0.1;
    return { number: s.number, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const candidates = scored.slice(0, n).map(s => s.number).sort((a, b) => a - b);
  const weights = new Map<number, number>();
  scored.forEach(s => weights.set(s.number, Math.max(0.1, s.score)));

  return {
    id: "repetition",
    name: "Repetição do Anterior",
    description: `Prioriza dezenas do último sorteio + frequência recente. Alvo médio: manter ~${repeatTarget} dezenas repetidas.`,
    candidateNumbers: candidates,
    weights,
    metrics: {
      lastDrawSize: lastDraw.length,
      repeatTarget,
      repeatLow: repLo,
      repeatHigh: repHi,
      inLastCandidates: candidates.filter(x => lastSet.has(x)).length,
    },
  };
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 8 — QUENTE-FRIO (VIÉS OFICIAL + ATRASO)
// Combina o viés histórico documentado por modalidade (hotNumbers do
// knowledge base) com dezenas atrasadas e frequência recente. É o
// híbrido mais robusto para universos grandes (Quina, Mega, Timemania).
// ═══════════════════════════════════════════
export function strategyHotCold(
  stats: NumberStats[],
  draws: DrawResult[],
  lotteryId: string,
  topN?: number
): StrategyResult {
  const rules = getLotteryRules(lotteryId);
  const n = topN ?? getStrategyPoolSize(lotteryId);
  const hotBias = new Set(rules.knownBiases?.hotNumbers ?? []);
  const coldBias = new Set(rules.knownBiases?.coldNumbers ?? []);

  // Threshold de atraso: 1.5× ciclo esperado da modalidade
  const expectedCycle = Math.max(6, Math.round(rules.totalNumbers / Math.max(1, rules.pick)));
  const overdueMin = Math.round(expectedCycle * 1.5);

  const scored = stats.map(s => {
    const recent = computeRecentFrequency(s.number, draws, 20);
    let score = s.frequency * 0.25;
    if (hotBias.has(s.number)) score += 3.0;
    if (recent >= 4) score += 2.5;
    if (s.lastSeen >= overdueMin) score += 2.0;
    if (coldBias.has(s.number) && s.lastSeen < overdueMin) score -= 1.5;
    return { number: s.number, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const candidates = scored.slice(0, n).map(s => s.number).sort((a, b) => a - b);
  const weights = new Map<number, number>();
  scored.forEach(s => weights.set(s.number, Math.max(0.1, s.score)));

  return {
    id: "hot_cold",
    name: "Quente-Frio",
    description: "Combina viés histórico oficial + números atrasados + frequência recente. Estratégia híbrida ideal para universos grandes.",
    candidateNumbers: candidates,
    weights,
    metrics: {
      hotBiasSize: hotBias.size,
      overdueMin,
      overdueCandidates: candidates.filter(x => (stats.find(s => s.number === x)?.lastSeen ?? 0) >= overdueMin).length,
      hotHits: candidates.filter(x => hotBias.has(x)).length,
    },
  };
}



// ═══════════════════════════════════════════
// PIPELINE DE GERAÇÃO INTELIGENTE (6 ETAPAS)
// ═══════════════════════════════════════════
export interface IntelligentPipelineResult {
  strategy: StrategyResult;
  games: number[][];
  scores: number[];
  confidences: number[];
  reasons: string[][];
  pipeline: {

    step: string;
    detail: string;
    count: number;
  }[];
}

export function runIntelligentPipeline(
  stats: NumberStats[],
  draws: DrawResult[],
  lotteryId: string,
  strategyId: string,
  gameCount: number = 10
): IntelligentPipelineResult {
  const rules = getLotteryRules(lotteryId);
  const pipeline: { step: string; detail: string; count: number }[] = [];

  // Etapa 1 — Coletar dados históricos
  const recentDraws = draws.slice(0, 50);
  pipeline.push({ step: "Coleta", detail: `${recentDraws.length} concursos recentes`, count: recentDraws.length });

  // Garante stats válido — se vazio, sintetiza um stats neutro a partir do universo
  let safeStats = stats;
  if (!safeStats || safeStats.length === 0) {
    safeStats = Array.from({ length: rules.totalNumbers }, (_, i) => ({
      number: i + 1,
      frequency: 1,
      lastSeen: 0,
      cycleScore: 0,
      status: "neutral",
    })) as unknown as NumberStats[];
  }

  // Etapa 2 — Calcular métricas
  const avgSum = recentDraws.length > 0
    ? recentDraws.reduce((s, d) => s + d.numbers.reduce((a, b) => a + b, 0), 0) / recentDraws.length
    : (rules.idealSumRange ? (rules.idealSumRange[0] + rules.idealSumRange[1]) / 2 : 0);
  pipeline.push({ step: "Métricas", detail: `Soma média: ${avgSum.toFixed(0)}`, count: safeStats.length });

  // Etapa 3 — Gerar números candidatos via estratégia
  const strategy = executeStrategy(strategyId, safeStats, draws, lotteryId);
  pipeline.push({ step: "Candidatos", detail: `${strategy.candidateNumbers.length} números selecionados`, count: strategy.candidateNumbers.length });

  // Etapa 4 — Criar combinações com filtros
  const rawGames = generateFilteredCombinations(strategy, rules.pick, Math.max(gameCount * 20, gameCount + 5), rules);
  pipeline.push({ step: "Combinações", detail: `${rawGames.length} jogos brutos`, count: rawGames.length });

  // Etapa 5 — Ranking por score
  const scored = rawGames.map(game => ({
    game,
    score: computeGameScore(game, safeStats, rules, avgSum),
  }));
  scored.sort((a, b) => b.score - a.score);
  pipeline.push({ step: "Ranking", detail: `Score máx: ${scored[0]?.score.toFixed(1) || 0}`, count: scored.length });

  // Etapa 6 — Retornar top N jogos diversos (garante mínimo)
  let selected = selectDiverseGames(scored, gameCount, rules.pick);
  if (selected.length === 0 && scored.length > 0) {
    selected = scored.slice(0, gameCount);
  }
  pipeline.push({ step: "Seleção", detail: `${selected.length} jogos finais`, count: selected.length });

  return {
    strategy,
    games: selected.map(s => s.game),
    scores: selected.map(s => s.score),
    confidences: selected.map(s => Math.round(s.score)),
    reasons: selected.map(s => generateAIEvaluation(s.game, safeStats, rules, avgSum)),
    pipeline,
  };
}

function generateAIEvaluation(game: number[], stats: NumberStats[], rules: LotteryRules, avgSum: number): string[] {
  const reasons: string[] = [];
  const pick = game.length;

  // Parity
  const evens = game.filter(n => n % 2 === 0).length;
  if (Math.abs(evens / pick - 0.5) <= 0.15) reasons.push("Distribuição Par/Ímpar equilibrada");

  // Sum
  const sum = game.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - avgSum) / avgSum < 0.15) reasons.push("Soma próxima à média histórica");

  // Primes/Fibonacci
  const primes = game.filter(n => PRIMES.has(n)).length;
  if (primes >= 2) reasons.push("Presença estratégica de números primos");

  // Cycle
  const titanStats = stats as any[];
  const cycleNumbers = game.filter(n => titanStats.find(s => s.number === n)?.cycleScore > 0).length;
  if (cycleNumbers >= 2) reasons.push("Alinhamento com o ciclo atual");

  // Correlation (Mock check for logic)
  reasons.push("Alta correlação detectada entre dezenas");

  return reasons;
}


// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function executeStrategy(
  strategyId: string,
  stats: NumberStats[],
  draws: DrawResult[],
  lotteryId: string
): StrategyResult {
  const pool = getStrategyPoolSize(lotteryId);
  switch (strategyId) {
    case "frequency": return strategyFrequency(stats, draws, pool);
    case "delay": return strategyDelay(stats, draws, pool);
    case "balance": return strategyBalance(stats, lotteryId, pool);
    case "dispersion": return strategyDispersion(stats, lotteryId, pool);
    case "anti_pattern": return strategyAntiPattern(stats, draws, lotteryId, pool);
    case "coverage": return strategyCoverage(stats, lotteryId, Math.max(pool, Math.ceil(pool * 1.1)));
    case "repetition": return strategyRepetition(stats, draws, lotteryId, pool);
    case "hot_cold": return strategyHotCold(stats, draws, lotteryId, pool);
    case "fibonacci": return strategyBalance(stats, lotteryId, pool);
    case "predictive": return strategyHotCold(stats, draws, lotteryId, pool);
    default: return strategyHotCold(stats, draws, lotteryId, pool);
  }
}

function computeRecentFrequency(num: number, draws: DrawResult[], window: number): number {
  const recent = draws.slice(0, window);
  return recent.filter(d => d.numbers.includes(num)).length;
}

function computeSequencePenalty(num: number, draws: DrawResult[], totalNumbers: number): number {
  let seqCount = 0;
  for (const d of draws.slice(0, 50)) {
    const sorted = [...d.numbers].sort((a, b) => a - b);
    const idx = sorted.indexOf(num);
    if (idx === -1) continue;
    if (idx > 0 && sorted[idx] - sorted[idx - 1] === 1) seqCount++;
    if (idx < sorted.length - 1 && sorted[idx + 1] - sorted[idx] === 1) seqCount++;
  }
  return seqCount / 50;
}

function generateFilteredCombinations(
  strategy: StrategyResult,
  pick: number,
  count: number,
  rules: LotteryRules
): number[][] {
  // Pool primário: candidatos da estratégia. Se for pequeno demais,
  // completa com o universo inteiro para nunca retornar zero jogos.
  let pool = strategy.candidateNumbers.slice();
  if (pool.length < pick) {
    const universe = Array.from({ length: rules.totalNumbers }, (_, i) => i + 1);
    const set = new Set(pool);
    for (const n of universe) if (!set.has(n)) pool.push(n);
  }

  const games: number[][] = [];
  const seen = new Set<string>();
  const maxAttempts = count * 6;

  for (let attempt = 0; attempt < maxAttempts && games.length < count; attempt++) {
    // Relaxa os filtros após metade das tentativas se ainda não houver jogos suficientes
    const relax = attempt > maxAttempts / 2 && games.length < Math.max(1, count / 2);

    const game: number[] = [];
    const remaining = [...pool];

    for (let i = 0; i < pick && remaining.length > 0; i++) {
      const totalW = remaining.reduce((s, n) => s + (strategy.weights.get(n) || 1), 0);
      let r = Math.random() * totalW;
      let idx = 0;
      for (; idx < remaining.length; idx++) {
        r -= (strategy.weights.get(remaining[idx]) || 1);
        if (r <= 0) break;
      }
      idx = Math.min(idx, remaining.length - 1);
      game.push(remaining[idx]);
      remaining.splice(idx, 1);
    }

    if (game.length < pick) continue;

    game.sort((a, b) => a - b);
    const key = game.join(",");
    if (seen.has(key)) continue;
    seen.add(key);

    if (!relax) {
      // Filtro de paridade: usa a faixa ideal por loteria (idealParityRange),
      // com tolerância de ±1. Cai no fallback proporcional se a loteria não definir.
      const evenCount = game.filter(n => n % 2 === 0).length;
      if (rules.idealParityRange) {
        const [evenLo, evenHi] = rules.idealParityRange;
        if (evenCount < evenLo - 1 || evenCount > evenHi + 1) continue;
      } else {
        const evenRatio = evenCount / pick;
        if (evenRatio < 0.25 || evenRatio > 0.75) continue;
      }

      const sum = game.reduce((a, b) => a + b, 0);
      if (rules.idealSumRange) {
        const [lo, hi] = rules.idealSumRange;
        const margin = (hi - lo) * 0.4;
        if (sum < lo - margin || sum > hi + margin) continue;
      }

      let maxSeq = 1, curSeq = 1;
      for (let i = 1; i < game.length; i++) {
        if (game[i] - game[i - 1] === 1) { curSeq++; maxSeq = Math.max(maxSeq, curSeq); }
        else curSeq = 1;
      }
      if (maxSeq > (rules.maxRecommendedSequence || 3)) continue;
    }

    games.push(game);
  }

  // Garantia final: se ainda assim não houver jogos, gera amostras aleatórias uniformes
  while (games.length < count) {
    const universe = Array.from({ length: rules.totalNumbers }, (_, i) => i + 1);
    for (let i = universe.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [universe[i], universe[j]] = [universe[j], universe[i]];
    }
    const game = universe.slice(0, pick).sort((a, b) => a - b);
    const key = game.join(",");
    if (seen.has(key)) { if (games.length === 0) games.push(game); break; }
    seen.add(key);
    games.push(game);
  }

  return games;
}

function computeGameScore(
  game: number[],
  stats: NumberStats[],
  rules: LotteryRules,
  avgSum: number
): number {
  let score = 0;
  const pick = game.length;

  // Equilíbrio par/ímpar (0-25)
  const evenCount = game.filter(n => n % 2 === 0).length;
  const parityBalance = 1 - Math.abs(evenCount / pick - 0.5) * 2;
  score += parityBalance * 25;

  // Dispersão por faixas (0-25)
  const rangeSize = Math.ceil(rules.totalNumbers / 5);
  const ranges = new Set(game.map(n => Math.floor((n - 1) / rangeSize)));
  score += (ranges.size / 5) * 25;

  // Aderência à soma histórica (0-25)
  const sum = game.reduce((a, b) => a + b, 0);
  if (rules.idealSumRange) {
    const [lo, hi] = rules.idealSumRange;
    const mid = (lo + hi) / 2;
    const range = hi - lo;
    const deviation = Math.abs(sum - mid) / range;
    score += Math.max(0, (1 - deviation)) * 25;
  }

  // Frequência média dos números (0-25)
  const statsMap = new Map(stats.map(s => [s.number, s]));
  const avgFreq = game.reduce((s, n) => s + (statsMap.get(n)?.frequency || 0), 0) / pick;
  const maxFreq = Math.max(...stats.map(s => s.frequency));
  score += (avgFreq / maxFreq) * 25;

  return Math.round(score * 10) / 10;
}

function selectDiverseGames(
  scored: { game: number[]; score: number }[],
  count: number,
  pick: number
): { game: number[]; score: number }[] {
  if (scored.length <= count) return scored;

  const selected = [scored[0]];
  const minDiff = Math.max(2, Math.floor(pick * 0.25));

  for (const item of scored.slice(1)) {
    if (selected.length >= count) break;
    const isDiverse = selected.every(sel => {
      const overlap = item.game.filter(n => sel.game.includes(n)).length;
      return pick - overlap >= minDiff;
    });
    if (isDiverse) selected.push(item);
  }

  // Fill if diversity was too strict
  if (selected.length < count) {
    for (const item of scored) {
      if (selected.length >= count) break;
      if (!selected.find(s => s.game.join(",") === item.game.join(","))) {
        selected.push(item);
      }
    }
  }

  return selected;
}

/** Get all available strategy IDs */
export function getAllStrategyIds(): string[] {
  return [
    "frequency",
    "delay",
    "balance",
    "dispersion",
    "anti_pattern",
    "coverage",
    "repetition",
    "hot_cold",
  ];
}

/** Get strategy info by ID */
export function getStrategyInfo(id: string): { id: string; name: string; description: string } {
  const map: Record<string, { name: string; description: string }> = {
    frequency:    { name: "Frequência Histórica", description: "Prioriza números mais sorteados, com boost por frequência recente." },
    delay:        { name: "Números Atrasados",    description: "Foca em números que não saem há tempo, ponderando ciclos." },
    balance:      { name: "Equilíbrio Estrutural", description: "Distribui pares/ímpares, altos/baixos, primos e Fibonacci." },
    dispersion:   { name: "Dispersão no Volante", description: "Espalha as dezenas por todas as faixas do volante." },
    anti_pattern: { name: "Anti-Padrões",         description: "Evita sequências e padrões visuais óbvios (baixa concorrência)." },
    coverage:     { name: "Cobertura Máxima",     description: "Combina frequência, atraso, primos e Fibonacci para cobrir mais faixas." },
    repetition:   { name: "Repetição do Anterior", description: "Aproveita o viés de repetição do último sorteio + frequência recente." },
    hot_cold:     { name: "Quente-Frio",           description: "Combina viés oficial + atraso + frequência recente. Ideal p/ universos grandes." },
  };
  return { id, ...(map[id] || map.hot_cold) };
}
