/**
 * Bankroll Engine — Gestão profissional de banca para loterias.
 *
 * Fornece:
 * - Kelly Criterion fracionário adaptado ao EV negativo das loterias
 * - Alocação por modalidade baseada em ROI histórico + risco
 * - Stop-loss / stop-win e limites operacionais
 * - Projeção de banca (Monte Carlo simplificado)
 * - Session tracking (localStorage)
 */

import { LOTTERIES, type LotteryConfig } from "@/data/lotteries";
import { LOTTERY_BET_COST } from "@/engine/betting-budget";

export type RiskProfile = "conservador" | "moderado" | "agressivo";

export interface BankrollConfig {
  totalBankroll: number;
  monthlyContribution: number;
  riskProfile: RiskProfile;
  stopLossPct: number; // % da banca (ex: 20 = corta operação ao perder 20%)
  stopWinPct: number;  // % de ganho para retirar lucro
  reservePct: number;  // % que fica intocado
}

export interface LotteryROI {
  lotteryId: string;
  totalSpent: number;
  totalWon: number;
  bets: number;
  hitRate: number; // % de apostas premiadas
  roi: number;     // (won - spent) / spent
}

export interface AllocationSlice {
  lotteryId: string;
  lotteryName: string;
  weight: number;       // 0..1
  monthlyBudget: number;
  costPerGame: number;
  gamesPerDraw: number;
  drawsPerMonth: number;
  monthlyGames: number;
  rationale: string;
}

export interface BankrollPlan {
  operatingBankroll: number;    // banca ativa (após reserva)
  reserveAmount: number;        // reserva intocada
  monthlyBudget: number;        // gasto mensal recomendado
  stopLossAmount: number;       // valor absoluto do stop-loss
  stopWinAmount: number;        // valor absoluto do stop-win
  survivalMonths: number;       // meses até esgotar sem contribuição
  allocation: AllocationSlice[];
  warnings: string[];
  ev30d: number;                // valor esperado 30 dias (negativo)
  kellyMaxBetPct: number;       // % máx sugerida por concurso (Kelly frac.)
}

const DRAWS_PER_MONTH: Record<string, number> = {
  megasena: 12, lotofacil: 26, quina: 26, lotomania: 12,
  duplasena: 12, timemania: 12, diadesorte: 12, supersete: 12,
};

// EV base por real apostado (retorno esperado ~ 43-45% na maioria das loterias Caixa)
const EXPECTED_RETURN_PER_REAL: Record<string, number> = {
  megasena: 0.435, lotofacil: 0.455, quina: 0.435, lotomania: 0.44,
  duplasena: 0.435, timemania: 0.43, diadesorte: 0.44, supersete: 0.44,
};

// Volatilidade relativa (0..1) — modalidades com pick alto/N alto = mais previsíveis
const VOLATILITY: Record<string, number> = {
  lotofacil: 0.25, diadesorte: 0.4, duplasena: 0.55, quina: 0.6,
  supersete: 0.6, timemania: 0.7, lotomania: 0.5, megasena: 0.9,
};

const RISK_MULTIPLIER: Record<RiskProfile, number> = {
  conservador: 0.5,
  moderado: 0.75,
  agressivo: 1.0,
};

const RESERVE_DEFAULT: Record<RiskProfile, number> = {
  conservador: 40,
  moderado: 25,
  agressivo: 10,
};

export const DEFAULT_BANKROLL_CONFIG: BankrollConfig = {
  totalBankroll: 500,
  monthlyContribution: 200,
  riskProfile: "moderado",
  stopLossPct: 25,
  stopWinPct: 50,
  reservePct: 25,
};

/**
 * Kelly fracionário adaptado: como o EV é negativo em loterias,
 * usamos "Kelly defensivo" = % da banca que preserva sobrevivência
 * dado o drawdown esperado. Fórmula empírica derivada de simulações.
 */
export function computeDefensiveKellyPct(
  riskProfile: RiskProfile,
  avgVolatility: number,
): number {
  const base = RISK_MULTIPLIER[riskProfile] * 4; // 2%, 3%, 4% da banca por concurso
  return Math.max(0.5, base * (1 - avgVolatility * 0.4));
}

/**
 * Constrói alocação por modalidade combinando:
 *  1) ROI histórico do usuário (peso maior se positivo)
 *  2) Volatilidade (peso menor se voláteis)
 *  3) Perfil de risco
 */
export function allocateByROI(
  monthlyBudget: number,
  riskProfile: RiskProfile,
  roiByLottery: LotteryROI[],
  selectedLotteries: string[],
): AllocationSlice[] {
  const pool = LOTTERIES.filter((l) => selectedLotteries.includes(l.id));
  if (!pool.length) return [];

  const scores = pool.map((lot) => {
    const roiData = roiByLottery.find((r) => r.lotteryId === lot.id);
    const historicalRoi = roiData?.roi ?? 0;
    const vol = VOLATILITY[lot.id] ?? 0.5;
    const evBase = EXPECTED_RETURN_PER_REAL[lot.id] ?? 0.43;

    // Score composto — quanto maior, mais peso
    let score = evBase;
    // Bônus por ROI positivo (raro, mas se ocorrer, priorize)
    if (historicalRoi > 0) score += Math.min(historicalRoi, 0.5);
    // Penalidade por volatilidade — pior quanto mais conservador
    const volPenalty = vol * (RISK_MULTIPLIER[riskProfile] === 0.5 ? 0.6 : RISK_MULTIPLIER[riskProfile] === 0.75 ? 0.4 : 0.25);
    score -= volPenalty;
    return { lot, score: Math.max(0.05, score), roiData, vol };
  });

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

  return scores.map(({ lot, score, roiData, vol }) => {
    const weight = score / totalScore;
    const budget = monthlyBudget * weight;
    const costPerGame = LOTTERY_BET_COST[lot.id] ?? 3;
    const drawsPerMonth = DRAWS_PER_MONTH[lot.id] ?? 8;
    const monthlyGames = Math.floor(budget / costPerGame);
    const gamesPerDraw = Math.max(0, Math.floor(monthlyGames / drawsPerMonth));

    const rationale = buildRationale(lot, weight, roiData, vol, riskProfile);

    return {
      lotteryId: lot.id,
      lotteryName: lot.name,
      weight,
      monthlyBudget: Number(budget.toFixed(2)),
      costPerGame,
      gamesPerDraw,
      drawsPerMonth,
      monthlyGames,
      rationale,
    };
  }).sort((a, b) => b.weight - a.weight);
}

function buildRationale(
  lot: LotteryConfig,
  weight: number,
  roiData: LotteryROI | undefined,
  vol: number,
  risk: RiskProfile,
): string {
  const bits: string[] = [];
  bits.push(`${(weight * 100).toFixed(1)}% da banca`);
  if (roiData && roiData.bets >= 5) {
    const roiPct = (roiData.roi * 100).toFixed(0);
    bits.push(`ROI histórico ${roiData.roi >= 0 ? "+" : ""}${roiPct}%`);
  }
  if (vol <= 0.3) bits.push("baixa volatilidade");
  else if (vol >= 0.7) bits.push("alta volatilidade");
  if (risk === "conservador" && vol >= 0.7) bits.push("exposição reduzida");
  return bits.join(" • ");
}

/**
 * Projeta a banca ao longo de N meses considerando EV negativo esperado.
 * Retorna curva mediana + intervalo de confiança (p10, p90) via aproximação.
 */
export function projectBankroll(
  startBankroll: number,
  monthlyBudget: number,
  monthlyContribution: number,
  allocation: AllocationSlice[],
  months: number,
): { month: number; median: number; p10: number; p90: number }[] {
  const avgEV = allocation.reduce((sum, a) => {
    const ev = EXPECTED_RETURN_PER_REAL[a.lotteryId] ?? 0.43;
    return sum + a.weight * ev;
  }, 0);
  const avgVol = allocation.reduce((sum, a) => {
    const vol = VOLATILITY[a.lotteryId] ?? 0.5;
    return sum + a.weight * vol;
  }, 0);

  // Perda esperada mensal = budget * (1 - EV)
  const expectedMonthlyLoss = monthlyBudget * (1 - avgEV);
  // Desvio padrão mensal aproximado
  const monthlyStd = monthlyBudget * avgVol * 1.5;

  const curve: { month: number; median: number; p10: number; p90: number }[] = [];
  let median = startBankroll;
  for (let m = 0; m <= months; m++) {
    const spread = monthlyStd * Math.sqrt(Math.max(1, m));
    curve.push({
      month: m,
      median: Math.max(0, median),
      p10: Math.max(0, median - spread * 1.28),
      p90: median + spread * 1.28,
    });
    median += monthlyContribution - expectedMonthlyLoss;
  }
  return curve;
}

export function buildBankrollPlan(
  config: BankrollConfig,
  roiByLottery: LotteryROI[],
  selectedLotteries: string[],
): BankrollPlan {
  const reserveAmount = (config.totalBankroll * config.reservePct) / 100;
  const operatingBankroll = config.totalBankroll - reserveAmount;

  // Budget mensal: usa Kelly defensivo aplicado à banca operacional
  const avgVol = selectedLotteries.length
    ? selectedLotteries.reduce((s, id) => s + (VOLATILITY[id] ?? 0.5), 0) / selectedLotteries.length
    : 0.5;
  const kellyPct = computeDefensiveKellyPct(config.riskProfile, avgVol);

  // Budget mensal ≈ (kellyPct/100) × banca operacional × concursos médios/mês
  const avgDraws = 15; // ~15 concursos/mês em média
  const suggestedMonthly = (operatingBankroll * kellyPct * avgDraws) / 100;
  // Nunca ultrapassa 60% da banca operacional por mês
  const monthlyBudget = Math.min(suggestedMonthly, operatingBankroll * 0.6);

  const allocation = allocateByROI(monthlyBudget, config.riskProfile, roiByLottery, selectedLotteries);

  const avgEV = allocation.length
    ? allocation.reduce((s, a) => s + a.weight * (EXPECTED_RETURN_PER_REAL[a.lotteryId] ?? 0.43), 0)
    : 0.43;
  const ev30d = -monthlyBudget * (1 - avgEV); // valor esperado (negativo)

  const survivalMonths = monthlyBudget > 0
    ? operatingBankroll / (monthlyBudget * (1 - avgEV) - config.monthlyContribution)
    : Infinity;

  const warnings: string[] = [];
  if (config.totalBankroll < 100) warnings.push("Banca muito baixa (< R$ 100). Recomenda-se acumular mais antes de operar.");
  if (config.stopLossPct > 40) warnings.push("Stop-loss > 40% expõe a banca a rebaixamentos severos.");
  if (config.reservePct < 15) warnings.push("Reserva < 15%. Sem colchão para retomar após drawdown.");
  if (allocation.length === 0) warnings.push("Selecione ao menos uma modalidade para operar.");
  if (allocation.length > 5) warnings.push("Diversificar em mais de 5 modalidades dilui a leitura estatística.");
  if (monthlyBudget < 30 && allocation.length > 0) warnings.push("Budget mensal < R$ 30 — cobertura estatística irrelevante.");
  if (survivalMonths < 6 && Number.isFinite(survivalMonths)) {
    warnings.push(`Sobrevivência estimada de ${survivalMonths.toFixed(1)} meses sem novo aporte.`);
  }

  return {
    operatingBankroll: Number(operatingBankroll.toFixed(2)),
    reserveAmount: Number(reserveAmount.toFixed(2)),
    monthlyBudget: Number(monthlyBudget.toFixed(2)),
    stopLossAmount: Number(((config.totalBankroll * config.stopLossPct) / 100).toFixed(2)),
    stopWinAmount: Number(((config.totalBankroll * config.stopWinPct) / 100).toFixed(2)),
    survivalMonths: Number.isFinite(survivalMonths) ? Number(survivalMonths.toFixed(1)) : Infinity,
    allocation,
    warnings,
    ev30d: Number(ev30d.toFixed(2)),
    kellyMaxBetPct: Number(kellyPct.toFixed(2)),
  };
}

export function suggestReserveByRisk(risk: RiskProfile): number {
  return RESERVE_DEFAULT[risk];
}

// ==================== Session Tracking (localStorage) ====================

const STORAGE_KEY = "titan:bankroll:v1";

export interface BankrollSession {
  id: string;
  date: string;
  lotteryId: string;
  spent: number;
  won: number;
  note?: string;
}

export interface BankrollState {
  config: BankrollConfig;
  selectedLotteries: string[];
  sessions: BankrollSession[];
}

export function loadBankrollState(): BankrollState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* noop */
  }
  return {
    config: DEFAULT_BANKROLL_CONFIG,
    selectedLotteries: ["lotofacil", "megasena"],
    sessions: [],
  };
}

export function saveBankrollState(state: BankrollState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

export function computeSessionStats(sessions: BankrollSession[]) {
  const totalSpent = sessions.reduce((s, x) => s + x.spent, 0);
  const totalWon = sessions.reduce((s, x) => s + x.won, 0);
  const net = totalWon - totalSpent;
  const roi = totalSpent > 0 ? net / totalSpent : 0;
  const wins = sessions.filter((s) => s.won > 0).length;
  const hitRate = sessions.length > 0 ? wins / sessions.length : 0;
  return { totalSpent, totalWon, net, roi, hitRate, count: sessions.length };
}
