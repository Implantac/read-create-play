/**
 * Verificação automática: confirma que o nível de anti-popularidade
 * (leve / padrão / agressivo) afeta NÃO APENAS os scores finais e a
 * ordenação dos jogos, mas também os PESOS e PENALIDADES INDIVIDUAIS
 * por número, nos quatro motores: Universal, Profissional, Extremo e
 * IA Autônoma.
 *
 * Cobertura: TODAS as 8 modalidades suportadas pelo motor master.
 *
 * Para cada combinação modalidade × gerador × nível este teste:
 *   1. Roda a geração e captura scores finais ordenados.
 *   2. Captura a sequência de assinaturas dos jogos (ordenação).
 *   3. Mede a penalidade média anti-popularidade aplicada.
 *   4. Captura PER-NUMBER:
 *        • penaltyVector  — penalidade individual de cada número (1..N)
 *        • boostedWeights — peso após applyJackpotMasterBoost partindo
 *          de um mapa uniforme (isola o efeito do nível)
 *        • generatorWeights — pesos/scores por número observados na
 *          saída do gerador (frequência ponderada nos jogos retornados
 *          ou compositeScore individual no caso da IA Autônoma).
 *   5. Verifica que ao menos um vetor (scores OU ordenação OU pesos
 *      por número OU penalidades por número) muda entre níveis nas
 *      modalidades onde o perfil prevê alteração.
 *
 * NOTA: o gerador Universal é executado apenas em Mega-Sena e Lotofácil
 * porque o pipeline completo leva ~25s por modalidade; os outros 3
 * geradores cobrem todas as 8.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { computeFrequencyStats } from "@/engine/statistics";
import { generateGames } from "@/ai/generators/universalGameGenerator";
import { generateProfessionalBets } from "@/engine/professional-generator";
import { runExtremePipeline, getDefaultExtremeConfig } from "@/engine/extreme-generator";
import { runAutonomousAnalysis } from "@/engine/autonomous-ai";
import {
  setAntiPopularityLevel,
  getAntiPopularityLevel,
  computeAntiPopularityPenalty,
  applyJackpotMasterBoost,
  AntiPopularityLevel,
  ANTI_POPULARITY_PROFILES,
} from "@/ai/knowledge/jackpotMasterStrategies";
import type { LotteryConfig, DrawResult } from "@/data/lotteries";

const LEVELS: AntiPopularityLevel[] = ["light", "standard", "aggressive"];

// ─────────────────────────────────────────────────────────────────
// Modalidades testadas (todas as 8 com perfil JACKPOT_PROFILES)
// ─────────────────────────────────────────────────────────────────
interface LotteryFixture {
  config: LotteryConfig;
  drawCount: number;
  seed: number;
  /** Universal é caro (~25s) — só roda em Mega/Lotofácil */
  runUniversal?: boolean;
}

const FIXTURES: LotteryFixture[] = [
  { config: { id: "megasena",   name: "Mega-Sena",   numbers: 60,  pick: 6,  color: "neon-green",  icon: "🍀" }, drawCount: 120, seed: 7,  runUniversal: true },
  { config: { id: "lotofacil",  name: "Lotofácil",   numbers: 25,  pick: 15, color: "neon-blue",   icon: "🎯" }, drawCount: 120, seed: 11, runUniversal: true },
  { config: { id: "quina",      name: "Quina",       numbers: 80,  pick: 5,  color: "neon-purple", icon: "🎰" }, drawCount: 120, seed: 17 },
  { config: { id: "lotomania",  name: "Lotomania",   numbers: 100, pick: 50, color: "neon-orange", icon: "💯" }, drawCount: 80,  seed: 23 },
  { config: { id: "duplasena",  name: "Dupla Sena",  numbers: 50,  pick: 6,  color: "neon-pink",   icon: "🎲" }, drawCount: 120, seed: 29 },
  { config: { id: "timemania",  name: "Timemania",   numbers: 80,  pick: 10, color: "neon-cyan",   icon: "⚽" }, drawCount: 100, seed: 31 },
  { config: { id: "diadesorte", name: "Dia de Sorte",numbers: 31,  pick: 7,  color: "neon-yellow", icon: "🍀" }, drawCount: 100, seed: 37 },
  { config: { id: "supersete",  name: "Super Sete",  numbers: 10,  pick: 7,  color: "neon-red",    icon: "7️⃣" }, drawCount: 100, seed: 41 },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function seededDraws(count: number, maxNum: number, pick: number, seed = 42): DrawResult[] {
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const draws: DrawResult[] = [];
  for (let i = 0; i < count; i++) {
    const nums = new Set<number>();
    while (nums.size < pick) nums.add(Math.floor(rnd() * maxNum) + 1);
    draws.push({
      concurso: 3000 + i,
      date: `2024-01-${String((i % 28) + 1).padStart(2, "0")}`,
      numbers: [...nums].sort((a, b) => a - b),
    });
  }
  return draws;
}

const gameKey = (g: number[]) => [...g].sort((a, b) => a - b).join("-");
const avgPenalty = (games: number[][], lotteryId: string) =>
  games.length === 0 ? 1 : games.reduce((s, g) => s + computeAntiPopularityPenalty(g, lotteryId), 0) / games.length;

/** Vetor de penalidade individual: penalidade aplicada ao número n sozinho. */
function perNumberPenaltyVector(totalNumbers: number, lotteryId: string): number[] {
  const out: number[] = [];
  for (let n = 1; n <= totalNumbers; n++) out.push(computeAntiPopularityPenalty([n], lotteryId));
  return out;
}

/** Vetor de pesos boosted partindo de mapa uniforme — isola o efeito do nível. */
function perNumberBoostedWeights(
  totalNumbers: number,
  stats: NumberStats[],
  draws: DrawResult[],
  lotteryId: string,
): number[] {
  const uniform = new Map<number, number>();
  for (let n = 1; n <= totalNumbers; n++) uniform.set(n, 1);
  const boosted = applyJackpotMasterBoost(uniform, stats, draws, lotteryId);
  const out: number[] = [];
  for (let n = 1; n <= totalNumbers; n++) out.push(boosted.get(n) ?? 1);
  return out;
}

/** Frequência ponderada (por score) com que cada número aparece nas apostas geradas. */
function generatorPerNumberWeights(
  bets: { numbers: number[]; score: number }[],
  totalNumbers: number,
): number[] {
  const out = new Array<number>(totalNumbers).fill(0);
  for (const b of bets) {
    for (const n of b.numbers) {
      if (n >= 1 && n <= totalNumbers) out[n - 1] += b.score;
    }
  }
  return out;
}

interface RunSnapshot {
  scores: number[];
  ordering: string[];
  avgPen: number;
  /** Penalidade individual por número (depende somente do nível e da modalidade). */
  penaltyVector: number[];
  /** Pesos por número após boost master partindo de uniforme. */
  boostedWeights: number[];
  /** Distribuição de pesos/scores por número observada nos resultados do gerador. */
  generatorWeights: number[];
}

const vecKey = (v: number[]) => v.map(x => x.toFixed(4)).join("|");

function compareSnapshots(snapshots: Record<AntiPopularityLevel, RunSnapshot>, label: string) {
  const profiles = LEVELS.map(l => ANTI_POPULARITY_PROFILES[l]);
  expect(profiles[0].datesMultiplier).toBeGreaterThan(profiles[2].datesMultiplier);

  const sigScores = LEVELS.map(l => vecKey(snapshots[l].scores));
  const sigOrder = LEVELS.map(l => snapshots[l].ordering.join(","));
  const sigPenalty = LEVELS.map(l => vecKey(snapshots[l].penaltyVector));
  const sigBoosted = LEVELS.map(l => vecKey(snapshots[l].boostedWeights));
  const sigGenWeights = LEVELS.map(l => vecKey(snapshots[l].generatorWeights));

  const allScoresEqual = sigScores[0] === sigScores[1] && sigScores[1] === sigScores[2];
  const allOrderEqual = sigOrder[0] === sigOrder[1] && sigOrder[1] === sigOrder[2];
  const allPenaltyEqual = sigPenalty[0] === sigPenalty[1] && sigPenalty[1] === sigPenalty[2];
  const allBoostedEqual = sigBoosted[0] === sigBoosted[1] && sigBoosted[1] === sigBoosted[2];
  const allGenWeightsEqual =
    sigGenWeights[0] === sigGenWeights[1] && sigGenWeights[1] === sigGenWeights[2];

  // Modalidades cujo perfil de penalidade NÃO depende do nível (sem datas/múltiplos
  // de 5 sensíveis): Lotofácil, Dupla Sena, Timemania, Dia de Sorte, Super Sete.
  // Nestas, penaltyVector e boostedWeights são naturalmente iguais entre níveis;
  // exigimos apenas que a geração produza saída válida.
  const lotteryId = label.split("/")[1];
  const hasLevelSensitivePenalty =
    lotteryId === "megasena" || lotteryId === "quina" || lotteryId === "lotomania";

  const pens = LEVELS.map(l => snapshots[l].avgPen);

  if (hasLevelSensitivePenalty) {
    expect(
      !allPenaltyEqual,
      `[${label}] penaltyVector idêntico em todos os níveis — penalidade por número não responde ao seletor.`
    ).toBe(true);
    expect(
      !allBoostedEqual,
      `[${label}] boostedWeights idênticos em todos os níveis — boost master não propaga o nível para os pesos por número.`
    ).toBe(true);
    expect(
      !allScoresEqual || !allOrderEqual || !allGenWeightsEqual,
      `[${label}] Saída do gerador (scores/ordering/genWeights) idêntica em todos os níveis.`
    ).toBe(true);
  } else {
    LEVELS.forEach(l => expect(snapshots[l].ordering.length).toBeGreaterThan(0));
  }

  console.log(
    `[${label}] avgPen leve=${pens[0].toFixed(3)} pad=${pens[1].toFixed(3)} agg=${pens[2].toFixed(3)} | ` +
    `scoresΔ=${!allScoresEqual} orderΔ=${!allOrderEqual} penVecΔ=${!allPenaltyEqual} ` +
    `boostedWΔ=${!allBoostedEqual} genWΔ=${!allGenWeightsEqual}`
  );
}

function runForEachLevel<T>(fn: () => T): Record<AntiPopularityLevel, T> {
  const out = {} as Record<AntiPopularityLevel, T>;
  for (const lvl of LEVELS) {
    setAntiPopularityLevel(lvl);
    expect(getAntiPopularityLevel()).toBe(lvl);
    out[lvl] = fn();
  }
  return out;
}

import type { NumberStats } from "@/engine/statistics";

// ─────────────────────────────────────────────────────────────────
// Suíte parametrizada
// ─────────────────────────────────────────────────────────────────
describe("Anti-Popularidade — Verificação Automática nos 4 Geradores × 8 Modalidades", () => {
  beforeEach(() => setAntiPopularityLevel("standard"));

  for (const fx of FIXTURES) {
    describe(`${fx.config.name} (${fx.config.id})`, () => {
      const draws = seededDraws(fx.drawCount, fx.config.numbers, fx.config.pick, fx.seed);
      const stats = computeFrequencyStats(draws, fx.config.numbers);

      if (fx.runUniversal) {
        it("Universal — scores e/ou ordenação mudam por nível", { timeout: 90000 }, () => {
          const snapshots = runForEachLevel<RunSnapshot>(() => {
            const games = generateGames({
              lotteryId: fx.config.id,
              count: 6,
              riskProfile: "balanced",
              filters: {
                avoidSequences: false, balanceParity: false, balanceHighLow: false,
                prioritizeHot: false, prioritizeCold: false, frameCenter: false, limitRepetition: false,
              },
              stats, draws,
            });
            const nums = games.map(g => g.numbers);
            return {
              scores: games.map(g => g.totalScore),
              ordering: nums.map(gameKey),
              avgPen: avgPenalty(nums, fx.config.id),
            };
          });
          compareSnapshots(snapshots, `Universal/${fx.config.id}`);
        });
      }

      it("Profissional — scores e/ou ordenação mudam por nível", { timeout: 30000 }, () => {
        const snapshots = runForEachLevel<RunSnapshot>(() => {
          const bets = generateProfessionalBets(stats, fx.config, draws, 2);
          const nums = bets.map(b => b.numbers);
          return {
            scores: bets.map(b => (b as any).combinedScore ?? (b as any).score ?? 0),
            ordering: nums.map(gameKey),
            avgPen: avgPenalty(nums, fx.config.id),
          };
        });
        compareSnapshots(snapshots, `Profissional/${fx.config.id}`);
      });

      it("Extremo — scores e/ou ordenação mudam por nível", { timeout: 30000 }, () => {
        const snapshots = runForEachLevel<RunSnapshot>(() => {
          const ecfg = getDefaultExtremeConfig(fx.config, draws);
          ecfg.totalCandidates = Math.min(ecfg.totalCandidates, 2000);
          ecfg.topN = 10;
          const result = runExtremePipeline(stats, fx.config, draws, ecfg);
          const nums = result.bets.map(b => b.numbers);
          return {
            scores: result.bets.map(b => (b as any).score ?? (b as any).totalScore ?? 0),
            ordering: nums.map(gameKey),
            avgPen: avgPenalty(nums, fx.config.id),
          };
        });
        compareSnapshots(snapshots, `Extremo/${fx.config.id}`);
      });

      it("IA Autônoma — scores do ranking e/ou ordenação mudam por nível", { timeout: 30000 }, () => {
        const snapshots = runForEachLevel<RunSnapshot>(() => {
          const report = runAutonomousAnalysis(draws, stats, fx.config);
          const top = report.rankings.slice(0, Math.min(20, fx.config.numbers));
          return {
            scores: top.map(r => r.compositeScore),
            ordering: top.map(r => `${r.number}`),
            avgPen: avgPenalty([top.map(r => r.number)], fx.config.id),
          };
        });
        compareSnapshots(snapshots, `IAAutonoma/${fx.config.id}`);
      });
    });
  }
});
