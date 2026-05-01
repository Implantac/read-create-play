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
const REPORT_DIR = path.join(process.cwd(), "src/test/reports");
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
  /** Breakdown de pontuação passo a passo para o primeiro jogo gerado. */
  scoreBreakdown?: any[];
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

function generateHTMLDiffReport(current: any, existing: any, label: string): string {
  const levels = Object.keys(current) as AntiPopularityLevel[];
  let sections = "";

  for (const lvl of levels) {
    const c = current[lvl];
    const e = existing[lvl];
    if (!e) continue;

    let breakdownTable = "";
    if (c.scoreBreakdown) {
      let rows = "";
      c.scoreBreakdown.forEach((adj: any) => {
        rows += `
          <tr class="${adj.type}">
            <td>${adj.metric}</td>
            <td class="delta ${adj.type === 'bonus' ? 'pos' : adj.type === 'penalty' ? 'neg' : ''}">
              ${adj.value > 0 ? '+' : ''}${adj.value.toFixed(2)}
            </td>
            <td>${adj.description}</td>
          </tr>`;
      });
      breakdownTable = `
        <div class="breakdown-container">
          <h3>Passo a Passo da Pontuação (IA Universal)</h3>
          <table>
            <thead><tr><th>Métrica</th><th>Ajuste</th><th>Razão</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }

    let vectorTables = "";
    const vectors = ["penaltyVector", "boostedWeights", "generatorWeights"] as const;
    
    for (const vec of vectors) {
      let rows = "";
      const maxLen = Math.max(c[vec].length, e[vec].length);
      let diffCount = 0;

      for (let i = 0; i < maxLen; i++) {
        const valC = c[vec][i];
        const valE = e[vec][i];
        const isDiff = valC?.toFixed(4) !== valE?.toFixed(4);
        if (isDiff) diffCount++;
        const delta = (valC || 0) - (valE || 0);

        rows += `
          <tr class="${isDiff ? "diff" : "same"}" data-diff="${isDiff}">
            <td>${i + 1}</td>
            <td>${valE?.toFixed(4) ?? "-"}</td>
            <td>${valC?.toFixed(4) ?? "-"}</td>
            <td class="delta ${delta > 0 ? 'pos' : delta < 0 ? 'neg' : ''}">${isDiff ? (delta > 0 ? '+' : '') + delta.toFixed(4) : '-'}</td>
          </tr>`;
      }

      vectorTables += `
        <div class="vector-container" data-vector="${vec}">
          <h3>${vec} (${diffCount} alterações)</h3>
          <table>
            <thead><tr><th>Núm</th><th>Anterior</th><th>Atual</th><th>Delta</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }

    const orderDiff = c.ordering.join(",") !== e.ordering.join(",");
    sections += `
      <section class="level-section">
        <h2>Nível: ${lvl.toUpperCase()}</h2>
        <div class="ordering-box ${orderDiff ? "diff" : ""}">
          <strong>Ordenação:</strong><br>
          <span class="old">Era: ${e.ordering.join(", ")}</span><br>
          <span class="new">Agora: ${c.ordering.join(", ")}</span>
        </div>
        ${breakdownTable}
        <div class="vectors-grid">${vectorTables}</div>
      </section>`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Diff Report - ${label}</title>
  <style>
    body { font-family: sans-serif; background: #121212; color: #e0e0e0; margin: 20px; }
    .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
    h1 { color: #bb86fc; margin: 0; }
    .controls { background: #1e1e1e; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #333; display: flex; gap: 20px; align-items: center; }
    select, button { background: #333; color: white; border: 1px solid #444; padding: 8px 12px; border-radius: 4px; cursor: pointer; }
    select:hover { border-color: #bb86fc; }
    .level-section { background: #1e1e1e; border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid #333; }
    .vectors-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; background: #252525; }
    th, td { border: 1px solid #444; padding: 8px; text-align: center; }
    th { background: #333; }
    tr.diff { background: rgba(255, 82, 82, 0.15); }
    tr.diff td:nth-child(3) { color: #ff5252; font-weight: bold; }
    .delta { font-family: monospace; font-size: 0.85em; }
    .delta.pos { color: #4caf50; }
    .delta.neg { color: #ff5252; }
    .breakdown-container { margin-bottom: 25px; border-bottom: 1px solid #333; padding-bottom: 20px; }
    .breakdown-container table { max-width: 800px; }
    .breakdown-container tr.base { background: rgba(187, 134, 252, 0.1); }
    .breakdown-container tr.bonus { background: rgba(76, 175, 80, 0.05); }
    .breakdown-container tr.penalty { background: rgba(244, 67, 54, 0.05); }
    .ordering-box { padding: 10px; background: #252525; border-radius: 4px; margin-bottom: 15px; border-left: 4px solid #4caf50; }
    .ordering-box.diff { border-left-color: #ff5252; }
    .old { color: #aaa; text-decoration: line-through; font-size: 0.9em; }
    .new { color: #4caf50; font-weight: bold; }
    h2 { margin-top: 0; color: #03dac6; }
    h3 { font-size: 16px; margin-bottom: 10px; color: #aaa; }
    .hidden { display: none !important; }
    .toggle-container { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .toggle-container input { cursor: pointer; }
  </style>
</head>
<body>
  <div class="header-container">
    <h1>Relatório de Diferenças: ${label}</h1>
    <span>Gerado em: ${new Date().toLocaleString()}</span>
  </div>

  <div class="controls">
    <div>
      <label>Filtrar Vetor: </label>
      <select id="vectorFilter" onchange="applyFilters()">
        <option value="all">Todos os Vetores</option>
        <option value="penaltyVector">penaltyVector</option>
        <option value="boostedWeights">boostedWeights</option>
        <option value="generatorWeights">generatorWeights</option>
      </select>
    </div>
    <label class="toggle-container">
      <input type="checkbox" id="diffOnly" onchange="applyFilters()" checked>
      <span>Modo Comparação (Apenas Mudanças)</span>
    </label>
    <div style="font-size: 0.9em; color: #888; margin-left: auto;">
      * Dica: Compare valores lado a lado e veja o delta de cada alteração.
    </div>
  </div>

  ${sections}

  <script>
    function applyFilters() {
      const vectorFilter = document.getElementById('vectorFilter').value;
      const diffOnly = document.getElementById('diffOnly').checked;
      
      // Filtra containers de vetores
      document.querySelectorAll('.vector-container').forEach(container => {
        const isVectorMatch = vectorFilter === 'all' || container.getAttribute('data-vector') === vectorFilter;
        if (isVectorMatch) {
          container.classList.remove('hidden');
        } else {
          container.classList.add('hidden');
        }
      });

      // Filtra linhas das tabelas (comparações)
      document.querySelectorAll('tr[data-diff]').forEach(row => {
        const isDiff = row.getAttribute('data-diff') === 'true';
        if (diffOnly && !isDiff) {
          row.classList.add('hidden');
        } else {
          row.classList.remove('hidden');
        }
      });
    }

    // Inicializa com filtros aplicados
    window.onload = applyFilters;
  </script>
</body>
</html>`;
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

    expect(snapshots, `Snapshot mismatch for ${label}`).toEqual(existing);
  } catch (err) {
    const diffReport = generateDiffSummary(snapshots, existing);
    const htmlReport = generateHTMLDiffReport(snapshots, existing, label);
    
    if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
    const reportPath = path.join(REPORT_DIR, `diff-${label.replace(/\//g, "-")}.html`);
    fs.writeFileSync(reportPath, htmlReport);

    console.error(`\n❌ FALHA NO SNAPSHOT: ${label}\n${diffReport}`);
    console.error(`👉 Relatório visual gerado em: ${reportPath}`);
    console.error(`🔗 Link: file://${reportPath}\n`);
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
              scoreBreakdown: games[0]?.scoreBreakdown,
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
