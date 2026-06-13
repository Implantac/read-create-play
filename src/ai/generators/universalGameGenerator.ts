/**
 * Native AI — Universal Game Generator
 * Generates optimized games for any lottery using statistical engines
 */

import { DrawResult } from "@/data/lotteries";
import { NumberStats } from "@/engine/stats/statistics";
import { getLotteryRules } from "../knowledge/lotteriesKnowledge";
import { getStrategy } from "../knowledge/strategiesKnowledge";
import { computePatternProfile } from "../engines/patternEngine";
import {
  computeWinnerProfile,
  computePairLift,
  alignmentScore,
  pairLiftBonus,
  type PairLiftMap,
  type WinnerProfile,
} from "../engines/winnerProfileEngine";
import type { RiskProfile, IntentFilters, ScoredGame } from "../core/aiTypes";
import { scoreGame } from "../engines/rankingEngine";
import type { Rng } from "../core/rng";
import { getEstimatedPrize, getMaxPossibleHits } from "@/utils/lottery-utils";

interface GeneratorConfig {
  lotteryId: string;
  count: number;
  riskProfile: RiskProfile;
  filters: IntentFilters;
  stats: NumberStats[];
  draws: DrawResult[];
  rng?: Rng;
}

/** Main generation function — generates, filters and ranks games */
export function generateGames(config: GeneratorConfig): ScoredGame[] {

  const rules = getLotteryRules(config.lotteryId);
  const strategy = getStrategy(config.riskProfile);
  const prevDraw = config.draws.length > 0 ? config.draws[0].numbers : undefined;

  // Sinais avançados: recência exponencial + coocorrência (afinidade)
  const recencyBoost = computeRecencyBoost(config.draws, rules.totalNumbers);
  const affinityBoost = computeAffinityBoost(config.draws, rules.totalNumbers, config.stats);

  // Perfil dos vencedores (centroide estatístico dos últimos 200 sorteios)
  // + matriz de lift de pares (coocorrências mais fortes que o acaso).
  const winnerProfile: WinnerProfile = computeWinnerProfile(config.draws, config.lotteryId, 200);
  const pairLift: PairLiftMap = computePairLift(config.draws, rules.totalNumbers, rules.pick, 200);
  const hasProfile = winnerProfile.sample >= 20;

  // POSTERIOR por número: combina frequência, recência, afinidade, cycleScore,
  // tendência e lift de pares numa única "convicção" 0..1. Usado para:
  //  (a) reforçar o pool (peso ∝ (1+posterior)²)
  //  (b) exigir um "núcleo" de números fortes em cada jogo
  const posterior = computeNumberPosterior(
    config.stats, recencyBoost, affinityBoost, pairLift, rules.totalNumbers,
  );
  // top 40% dos números viram o "core" (números de alta convicção)
  const sortedByPost = [...posterior.entries()].sort((a, b) => b[1] - a[1]);
  const coreCount = Math.max(1, Math.ceil(sortedByPost.length * 0.4));
  const coreSet = new Set(sortedByPost.slice(0, coreCount).map(([n]) => n));
  // mínimo de números do core dentro de cada jogo (≈60% do pick)
  const minCoreInGame = Math.max(2, Math.ceil(rules.pick * 0.6));

  // Build weighted pool (posterior amplifica os pesos)
  const pool = buildWeightedPool(config.stats, strategy.filters, config.filters, recencyBoost, affinityBoost, posterior);
  const rng = config.rng;

  // Pré-computações p/ rejeição rápida
  const [sumLo, sumHi] = rules.idealSumRange;
  const sumSlack = (sumHi - sumLo) * 0.25; // tolera 25% além da faixa ideal
  const [parityLo, parityHi] = rules.idealParityRange;
  const [repLo, repHi] = rules.avgRepeatFromPrevious;
  const prevSet = prevDraw ? new Set(prevDraw) : null;
  // assinaturas dos últimos sorteios (evita reproduzir resultado já saído)
  const recentSignatures = new Set(
    config.draws.slice(0, 50).map(d => [...d.numbers].sort((a, b) => a - b).join(",")),
  );

  // Generate candidates (10x requested count for filtering)
  const candidateCount = Math.max(config.count * 20, 500);

  const candidates: number[][] = [];

  for (let attempt = 0; attempt < candidateCount * 4 && candidates.length < candidateCount; attempt++) {
    const game = weightedSample(pool, rules.pick, rng);


    if (!game) continue;

    // Quick filter

    if (config.filters.customNumbers) {
      const gameSet = new Set(game);
      if (!config.filters.customNumbers.every(n => gameSet.has(n))) continue;
    }
    if (config.filters.excludeNumbers) {
      if (game.some(n => config.filters.excludeNumbers!.includes(n))) continue;
    }

    // Rejeição rápida por soma fora da faixa histórica (com slack)
    const gameSum = game.reduce((a, b) => a + b, 0);
    if (gameSum < sumLo - sumSlack || gameSum > sumHi + sumSlack) continue;

    // Rejeição rápida por paridade extrema
    const evenCount = game.filter(n => n % 2 === 0).length;
    if (evenCount < Math.max(0, parityLo - 1) || evenCount > Math.min(rules.pick, parityHi + 1)) continue;

    // Repetição vs sorteio anterior fora da faixa histórica
    if (prevSet) {
      let rep = 0;
      for (const n of game) if (prevSet.has(n)) rep++;
      if (rep < Math.max(0, repLo - 1) || rep > Math.min(rules.pick, repHi + 1)) continue;
    }

    // Rejeita combinações já sorteadas recentemente
    if (recentSignatures.has(game.join(","))) continue;

    // Rejeita concentração extrema numa única dezena (>60% em uma década)
    const decadeBuckets = Math.max(2, Math.ceil(rules.totalNumbers / 10));
    const decadeCounts = new Array(decadeBuckets).fill(0);
    for (const n of game) decadeCounts[Math.min(Math.floor((n - 1) / 10), decadeBuckets - 1)]++;
    if (Math.max(...decadeCounts) > Math.ceil(rules.pick * 0.6)) continue;

    const pattern = computePatternProfile(game, config.lotteryId, prevDraw);

    // Apply filters
    if (config.filters.balanceParity && pattern.parityBalance < 0.5) continue;
    if (config.filters.avoidSequences && pattern.sequencePenalty < 0.5) continue;
    if (pattern.sumProximity < 0.3) continue; // always filter extreme sums
    if (pattern.decadeBalance < 0.35) continue; // exige variedade de décadas

    // GATE pelo perfil dos vencedores: descarta jogos muito desalinhados
    if (hasProfile) {
      const align = alignmentScore(game, winnerProfile, config.lotteryId, prevDraw);
      if (align < 0.5) continue;
    }

    candidates.push(game);
  }

  // Score and rank all candidates
  const scored = candidates.map(g =>
    scoreGame(g, config.lotteryId, config.stats, config.draws, config.riskProfile)
  );

  // BACKTEST RE-RANK: ajusta o totalScore com performance histórica real
  // (acertos médios + frequência de hits ≥ pick*0.6 nos últimos 50 sorteios).
  const backtestWindow = config.draws.slice(0, 50);
  const expectedHits = (rules.pick * rules.pick) / rules.totalNumbers;
  const rareThreshold = Math.ceil(rules.pick * 0.6);
  for (const s of scored) {
    const set = new Set(s.numbers);
    let hits = 0, rare = 0;
    for (const d of backtestWindow) {
      const h = d.numbers.filter(n => set.has(n)).length;
      hits += h;
      if (h >= rareThreshold) rare++;
    }
    const avgHits = backtestWindow.length > 0 ? hits / backtestWindow.length : 0;
    const performance = expectedHits > 0 ? avgHits / expectedHits : 1; // 1 = neutro
    const backtestBonus = Math.max(-8, Math.min(12, (performance - 1) * 20 + rare * 2));

    // Bônus por alinhamento com perfil dos vencedores + pares com lift > 1
    let profileBonus = 0;
    if (hasProfile) {
      const align = alignmentScore(s.numbers, winnerProfile, config.lotteryId, prevDraw);
      const pairs = pairLiftBonus(s.numbers, pairLift);
      profileBonus = (align - 0.6) * 25 + pairs * 10; // ~ -15 ... +20
      // anexa explicação
      const pct = Math.round(align * 100);
      s.explanation.push(`🎯 Alinhamento com perfil vencedor: ${pct}%`);
      if (pairs > 0.15) s.explanation.push(`🔗 Contém pares com coocorrência forte (lift médio elevado)`);
    }

    s.totalScore = Math.max(0, Math.min(100, Math.round(s.totalScore + backtestBonus + profileBonus)));
  }

  // VALIDAÇÃO PÓS-GERAÇÃO: anexa um mini-backtest a cada jogo gerado.
  // Mostra acertos médios, melhor faixa atingida, quantos sorteios bateriam
  // alguma faixa premiada e "quase ganhou" (faltou 1 nº para faixa premiada).
  {
    const valWindow = config.draws.slice(0, 100);
    const maxHits = getMaxPossibleHits(config.lotteryId, rules.pick);
    const prizedTiers: number[] = [];
    for (let h = 1; h <= maxHits; h++) {
      if (getEstimatedPrize(config.lotteryId, h)) prizedTiers.push(h);
    }
    const expHits = (rules.pick * rules.pick) / rules.totalNumbers;
    for (const s of scored) {
      const set = new Set(s.numbers);
      let total = 0, best = 0, prized = 0, close = 0;
      for (const d of valWindow) {
        const h = d.numbers.filter(n => set.has(n)).length;
        total += h;
        if (h > best) best = h;
        if (prizedTiers.includes(h)) prized++;
        // close-miss: faltou 1 número para QUALQUER faixa premiada acima
        else if (prizedTiers.some(t => t - h === 1)) close++;
      }
      const avg = valWindow.length > 0 ? total / valWindow.length : 0;
      s.validation = {
        window: valWindow.length,
        avgHits: Math.round(avg * 100) / 100,
        bestHits: best,
        prizedCount: prized,
        closeMissCount: close,
        expectedHits: Math.round(expHits * 100) / 100,
      };
      if (prized > 0) s.explanation.push(`📊 Bateria faixa premiada em ${prized}/${valWindow.length} sorteios (últimos 100)`);
      if (close > 0) s.explanation.push(`🎯 Quase ganhou em ${close} sorteios (faltou 1 nº)`);
    }
  }

  // Sort by score and take top N, ensuring diversity
  scored.sort((a, b) => b.totalScore - a.totalScore);

  // HILL-CLIMBING: refina os top candidatos trocando 1 número por vez
  const topK = Math.min(scored.length, Math.max(config.count * 3, 15));
  const universe = Array.from({ length: rules.totalNumbers }, (_, i) => i + 1);
  for (let i = 0; i < topK; i++) {
    scored[i] = hillClimb(scored[i], universe, config, 8);
  }
  scored.sort((a, b) => b.totalScore - a.totalScore);

  const selected = selectDiverse(scored, config.count, rules.pick);
  return selected;
}

/** Hill-climbing: tenta substituir cada número por outro do universo se melhorar o score. */
function hillClimb(
  game: ScoredGame,
  universe: number[],
  config: GeneratorConfig,
  maxIterations: number
): ScoredGame {
  let best = game;
  for (let iter = 0; iter < maxIterations; iter++) {
    let improved = false;
    for (let i = 0; i < best.numbers.length; i++) {
      for (const candidate of universe) {
        if (best.numbers.includes(candidate)) continue;
        if (config.filters.excludeNumbers?.includes(candidate)) continue;
        const next = [...best.numbers];
        next[i] = candidate;
        const scored = scoreGame(next, config.lotteryId, config.stats, config.draws, config.riskProfile);
        if (scored.totalScore > best.totalScore + 1) {
          best = scored;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
    if (!improved) break;
  }
  return best;
}

/** Build weighted number pool based on strategy and stats */
function buildWeightedPool(
  stats: NumberStats[],
  strategyFilters: { hotBias: number; coldBias: number },
  intentFilters: IntentFilters,
  recencyBoost: Map<number, number>,
  affinityBoost: Map<number, number>,
  posterior?: Map<number, number>,
): { number: number; weight: number }[] {
  return stats.map(s => {
    let weight = 1;

    // Frequency weighting
    if (s.status === "hot") weight += strategyFilters.hotBias * 3;
    else if (s.status === "cold") weight += strategyFilters.coldBias * 3;

    // Trend boost
    if (s.trend > 0) weight += s.trend * 0.3;

    // Cycle due boost
    if (s.cycleScore > 1) weight += (s.cycleScore - 1) * 1.5;

    // Momentum
    if (s.momentum > 0) weight += s.momentum * 0.002;

    // Recência exponencial: sorteios recentes têm peso maior
    weight += (recencyBoost.get(s.number) ?? 0) * 2.5;

    // Afinidade: coocorrência com números atualmente "quentes"
    weight += (affinityBoost.get(s.number) ?? 0) * 1.8;

    // POSTERIOR (convicção combinada): amplifica não-linearmente
    if (posterior) {
      const p = posterior.get(s.number) ?? 0;
      weight *= (1 + p) * (1 + p);
    }

    // Intent-specific
    if (intentFilters.prioritizeHot && s.status === "hot") weight *= 1.5;
    if (intentFilters.prioritizeCold && s.status === "cold") weight *= 1.5;

    // Exclude
    if (intentFilters.excludeNumbers?.includes(s.number)) weight = 0;

    return { number: s.number, weight: Math.max(0.01, weight) };
  });
}

/**
 * Posterior por número: combina sinais já existentes (freq z-score, recência,
 * afinidade, cycleScore, tendência) + média de pair-lift do número com os
 * "quentes" do momento. Normalizado para 0..1.
 */
function computeNumberPosterior(
  stats: NumberStats[],
  recency: Map<number, number>,
  affinity: Map<number, number>,
  pairLift: PairLiftMap,
  totalNumbers: number,
): Map<number, number> {
  const freqs = stats.map(s => s.frequency);
  const mean = freqs.reduce((a, b) => a + b, 0) / Math.max(1, freqs.length);
  const std = Math.sqrt(
    freqs.reduce((s, f) => s + (f - mean) ** 2, 0) / Math.max(1, freqs.length),
  ) || 1;
  const hot = stats.filter(s => s.status === "hot").map(s => s.number);

  const raw = new Map<number, number>();
  for (const s of stats) {
    const fz = (s.frequency - mean) / std;           // -∞..+∞
    const rec = recency.get(s.number) ?? 0;          // 0..1
    const aff = affinity.get(s.number) ?? 0;         // 0..1
    const cyc = Math.max(0, (s.cycleScore || 1) - 1); // due bonus
    const trd = Math.max(0, s.trend || 0);            // upward trend
    // média de pair-lift contra os quentes (excluindo self)
    let pairAvg = 0, pairN = 0;
    const row = pairLift.get(s.number);
    if (row) {
      for (const h of hot) {
        if (h === s.number) continue;
        const a = Math.min(s.number, h), b = Math.max(s.number, h);
        const lv = pairLift.get(a)?.get(b);
        if (lv !== undefined) { pairAvg += lv; pairN++; }
      }
      if (pairN > 0) pairAvg /= pairN;
    }
    const pairBonus = Math.max(0, pairAvg - 1); // só lift acima de 1

    const score =
      0.30 * Math.tanh(fz * 0.6) +   // -0.3..+0.3 saturado
      0.25 * rec +
      0.15 * aff +
      0.15 * cyc +
      0.10 * Math.min(1, trd) +
      0.15 * Math.min(1, pairBonus);
    raw.set(s.number, score);
  }
  // normaliza para 0..1
  let lo = Infinity, hi = -Infinity;
  for (const v of raw.values()) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const span = hi - lo || 1;
  const out = new Map<number, number>();
  for (let n = 1; n <= totalNumbers; n++) {
    const v = raw.get(n) ?? lo;
    out.set(n, (v - lo) / span);
  }
  return out;
}

/** Pesa cada número por aparições recentes com decaimento exponencial (meia-vida ~ 20 sorteios) */
function computeRecencyBoost(draws: DrawResult[], totalNumbers: number): Map<number, number> {
  const map = new Map<number, number>();
  const window = Math.min(draws.length, 80);
  const halfLife = 20;
  const decay = Math.log(2) / halfLife;
  let normMax = 0;
  for (let n = 1; n <= totalNumbers; n++) map.set(n, 0);
  for (let i = 0; i < window; i++) {
    const w = Math.exp(-decay * i);
    for (const num of draws[i]?.numbers ?? []) {
      const prev = map.get(num) ?? 0;
      const next = prev + w;
      map.set(num, next);
      if (next > normMax) normMax = next;
    }
  }
  if (normMax > 0) {
    for (const [k, v] of map) map.set(k, v / normMax);
  }
  return map;
}

/** Boost por coocorrência: números que historicamente caem junto com os "quentes" atuais */
function computeAffinityBoost(
  draws: DrawResult[],
  totalNumbers: number,
  stats: NumberStats[]
): Map<number, number> {
  const map = new Map<number, number>();
  for (let n = 1; n <= totalNumbers; n++) map.set(n, 0);
  const hotSet = new Set(stats.filter(s => s.status === "hot").map(s => s.number));
  if (hotSet.size === 0 || draws.length === 0) return map;
  const window = Math.min(draws.length, 100);
  let normMax = 0;
  for (let i = 0; i < window; i++) {
    const nums = draws[i]?.numbers ?? [];
    let hotsInDraw = 0;
    for (const n of nums) if (hotSet.has(n)) hotsInDraw++;
    if (hotsInDraw === 0) continue;
    const w = hotsInDraw / nums.length;
    for (const n of nums) {
      if (hotSet.has(n)) continue;
      const next = (map.get(n) ?? 0) + w;
      map.set(n, next);
      if (next > normMax) normMax = next;
    }
  }
  if (normMax > 0) {
    for (const [k, v] of map) map.set(k, v / normMax);
  }
  return map;
}

/** Weighted random sampling without replacement */
function weightedSample(
  pool: { number: number; weight: number }[],
  pick: number,
  rng?: Rng
): number[] | null {

  const available = pool.filter(p => p.weight > 0);

  // Fallback: se os filtros deixaram poucos candidatos,
  // tenta um amostrador uniforme (resiliente) em vez de retornar null.
  if (available.length < pick) {
    const fallback = pool
      .filter(p => p.weight > 0)
      .map(p => p.number);
    if (fallback.length < pick) return null;

    // Fisher–Yates shuffle com uniformidade
    const arr = [...fallback];
    const rnd = rng ?? { next: () => Math.random() };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr.slice(0, pick).sort((a, b) => a - b);
  }

  const selected: number[] = [];
  const remaining = [...available];

  const rnd = rng ?? { next: () => Math.random() };
  for (let i = 0; i < pick; i++) {
    const totalWeight = remaining.reduce((s, p) => s + p.weight, 0);
    let r = rnd.next() * totalWeight;


    let idx = 0;
    for (; idx < remaining.length; idx++) {
      r -= remaining[idx].weight;
      if (r <= 0) break;
    }
    idx = Math.min(idx, remaining.length - 1);
    selected.push(remaining[idx].number);
    remaining.splice(idx, 1);
  }

  return selected.sort((a, b) => a - b);
}

/** Select diverse set of games — avoid too-similar combinations */
function selectDiverse(scored: ScoredGame[], count: number, pick: number): ScoredGame[] {
  if (scored.length <= count) return scored;

  const selected: ScoredGame[] = [scored[0]];
  const minDiff = Math.max(2, Math.floor(pick * 0.3));

  for (const game of scored.slice(1)) {
    if (selected.length >= count) break;

    // Check diversity from all selected
    const isDiverse = selected.every(sel => {
      const setA = new Set(sel.numbers);
      const overlap = game.numbers.filter(n => setA.has(n)).length;
      return pick - overlap >= minDiff;
    });

    if (isDiverse) selected.push(game);
  }

  // Fill remaining if diversity was too strict
  if (selected.length < count) {
    for (const game of scored) {
      if (selected.length >= count) break;
      if (!selected.includes(game)) selected.push(game);
    }
  }

  return selected;
}
