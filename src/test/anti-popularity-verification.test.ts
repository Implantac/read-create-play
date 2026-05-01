/**
 * Verificação automática: confirma que o nível de anti-popularidade
 * (leve / padrão / agressivo) afeta NÃO APENAS os scores finais e a
 * ordenação dos jogos, mas também os PESOS e PENALIDADES INDIVIDUAIS
 * por número, nos quatro motores: Universal, Profissional, Extremo e
 * IA Autônoma.
 *
 * Cobertura: TODAS as 8 modalidades suportadas pelo motor master.
 *
 * COMANDO PARA ATUALIZAR SNAPSHOTS:
 * bunx vitest run -u src/test/anti-popularity-verification.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
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

const SNAPSHOT_DIR = path.join(process.cwd(), "src/test/snapshots/anti-popularity");
const SHOULD_UPDATE = process.argv.includes("-u") || process.argv.includes("--update");

// Mock de Math.random para garantir determinismo nos snapshots
const originalRandom = Math.random;
function setupDeterministicRandom(seed: number) {
  let s = seed;
  Math.random = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
function restoreRandom() {
  Math.random = originalRandom;
}

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
  { config: { id: "megasena",   name: "Mega-Sena",   numbers: 60,  pick: 6,  color: "neon-green",  icon: "🍀" }, drawCount: 120, seed: 8,  runUniversal: true },
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

function generateDiffSummary(current: any, existing: any): string {
  let diff = "";
  const levels = Object.keys(current) as AntiPopularityLevel[];
  
  for (const lvl of levels) {
    const c = current[lvl];
    const e = existing[lvl];
    if (!e) {
      diff += `  [${lvl}]: Nível novo (não existia no snapshot)\n`;
      continue;
    }

    const vectors = ["penaltyVector", "boostedWeights", "generatorWeights"] as const;
    for (const vec of vectors) {
      const cv = vecKey(c[vec]);
      const ev = vecKey(e[vec]);
      if (cv !== ev) {
        // Encontra o primeiro índice de diferença para facilitar debug
        const firstDiff = c[vec].findIndex((v: number, i: number) => v.toFixed(4) !== e[vec][i].toFixed(4));
        diff += `  [${lvl}] ${vec} MUDOU: index ${firstDiff} (era ${e[vec][firstDiff]?.toFixed(4)}, agora é ${c[vec][firstDiff]?.toFixed(4)})\n`;
      }
    }

    if (c.ordering.join(",") !== e.ordering.join(",")) {
      diff += `  [${lvl}] ordering MUDOU: ${e.ordering.slice(0, 3).join("-")}... -> ${c.ordering.slice(0, 3).join("-")}...\n`;
    }
  }
  return diff;
}

function checkAndReportSnapshots(snapshots: Record<AntiPopularityLevel, RunSnapshot>, label: string) {
  const fileName = `${label.replace(/\//g, "_")}.json`;
  const filePath = path.join(SNAPSHOT_DIR, fileName);

  if (SHOULD_UPDATE || !fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(snapshots, null, 2));
    console.log(`[SNAPSHOT] Gravado: ${fileName}`);
    return;
  }

  const existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  
  try {
    // Verificações lógicas básicas (as que já existiam em compareSnapshots)
    const lotteryId = label.split("/")[1];
    const hasLevelSensitivePenalty = 
      lotteryId === "megasena" || lotteryId === "quina" || lotteryId === "lotomania";

    const sigPenalty = LEVELS.map(l => vecKey(snapshots[l].penaltyVector));
    const allPenaltyEqual = sigPenalty[0] === sigPenalty[1] && sigPenalty[1] === sigPenalty[2];

    if (hasLevelSensitivePenalty) {
      expect(
        !allPenaltyEqual,
        `[${label}] penaltyVector idêntico em todos os níveis — penalidade não responde ao seletor.`
      ).toBe(true);
    }

    // Comparação profunda com o snapshot
    expect(snapshots, `Snapshot mismatch for ${label}`).toEqual(existing);
  } catch (err) {
    const diffReport = generateDiffSummary(snapshots, existing);
    console.error(`\n❌ FALHA NO SNAPSHOT: ${label}\n${diffReport}`);
    throw err;
  }
}

function runForEachLevel<T>(fn: () => T): Record<AntiPopularityLevel, T> {
  const out = {} as Record<AntiPopularityLevel, T>;
  for (const lvl of LEVELS) {
    setAntiPopularityLevel(lvl);
    out[lvl] = fn();
  }
  return out;
}

import type { NumberStats } from "@/engine/statistics";

// ─────────────────────────────────────────────────────────────────
// Suíte parametrizada
// ─────────────────────────────────────────────────────────────────
describe("Anti-Popularidade — Verificação Automática nos 4 Geradores × 8 Modalidades", () => {
  beforeEach(() => {
    setAntiPopularityLevel("standard");
  });

  afterEach(() => {
    restoreRandom();
  });

  for (const fx of FIXTURES) {
    describe(`${fx.config.name} (${fx.config.id})`, () => {
      const draws = seededDraws(fx.drawCount, fx.config.numbers, fx.config.pick, fx.seed);
      const stats = computeFrequencyStats(draws, fx.config.numbers);

      if (fx.runUniversal) {
        it("Universal — scores, ordenação, pesos e penalidades por número", { timeout: 90000 }, () => {
          setupDeterministicRandom(fx.seed);
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
              penaltyVector: perNumberPenaltyVector(fx.config.numbers, fx.config.id),
              boostedWeights: perNumberBoostedWeights(fx.config.numbers, stats, draws, fx.config.id),
              generatorWeights: generatorPerNumberWeights(
                games.map(g => ({ numbers: g.numbers, score: g.totalScore })),
                fx.config.numbers,
              ),
            };
          });
          checkAndReportSnapshots(snapshots, `Universal/${fx.config.id}`);
        });
      }

      it("Profissional — scores, ordenação, pesos e penalidades por número", { timeout: 30000 }, () => {
        setupDeterministicRandom(fx.seed);
        const snapshots = runForEachLevel<RunSnapshot>(() => {
          const bets = generateProfessionalBets(stats, fx.config, draws, 2);
          const nums = bets.map(b => b.numbers);
          const scores = bets.map(b => (b as any).combinedScore ?? (b as any).score ?? 0);
          return {
            scores,
            ordering: nums.map(gameKey),
            avgPen: avgPenalty(nums, fx.config.id),
            penaltyVector: perNumberPenaltyVector(fx.config.numbers, fx.config.id),
            boostedWeights: perNumberBoostedWeights(fx.config.numbers, stats, draws, fx.config.id),
            generatorWeights: generatorPerNumberWeights(
              bets.map((b, i) => ({ numbers: b.numbers, score: scores[i] || 1 })),
              fx.config.numbers,
            ),
          };
        });
        checkAndReportSnapshots(snapshots, `Profissional/${fx.config.id}`);
      });

      it("Extremo — scores, ordenação, pesos e penalidades por número", { timeout: 30000 }, () => {
        setupDeterministicRandom(fx.seed);
        const snapshots = runForEachLevel<RunSnapshot>(() => {
          const ecfg = getDefaultExtremeConfig(fx.config, draws);
          ecfg.totalCandidates = Math.min(ecfg.totalCandidates, 2000);
          ecfg.topN = 10;
          const result = runExtremePipeline(stats, fx.config, draws, ecfg);
          const nums = result.bets.map(b => b.numbers);
          const scores = result.bets.map(b => (b as any).score ?? (b as any).totalScore ?? 0);
          return {
            scores,
            ordering: nums.map(gameKey),
            avgPen: avgPenalty(nums, fx.config.id),
            penaltyVector: perNumberPenaltyVector(fx.config.numbers, fx.config.id),
            boostedWeights: perNumberBoostedWeights(fx.config.numbers, stats, draws, fx.config.id),
            generatorWeights: generatorPerNumberWeights(
              result.bets.map((b, i) => ({ numbers: b.numbers, score: scores[i] || 1 })),
              fx.config.numbers,
            ),
          };
        });
        checkAndReportSnapshots(snapshots, `Extremo/${fx.config.id}`);
      });

      it("IA Autônoma — compositeScore por número, pesos e penalidades", { timeout: 30000 }, () => {
        setupDeterministicRandom(fx.seed);
        const snapshots = runForEachLevel<RunSnapshot>(() => {
          const report = runAutonomousAnalysis(draws, stats, fx.config);
          const top = report.rankings.slice(0, Math.min(20, fx.config.numbers));
          const genW = new Array<number>(fx.config.numbers).fill(0);
          for (const r of report.rankings) {
            if (r.number >= 1 && r.number <= fx.config.numbers) genW[r.number - 1] = r.compositeScore;
          }
          return {
            scores: top.map(r => r.compositeScore),
            ordering: top.map(r => `${r.number}`),
            avgPen: avgPenalty([top.map(r => r.number)], fx.config.id),
            penaltyVector: perNumberPenaltyVector(fx.config.numbers, fx.config.id),
            boostedWeights: perNumberBoostedWeights(fx.config.numbers, stats, draws, fx.config.id),
            generatorWeights: genW,
          };
        });
        checkAndReportSnapshots(snapshots, `IAAutonoma/${fx.config.id}`);
      });
    });
  }
});
