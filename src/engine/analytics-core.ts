import { NumberStats, PairStats } from "./statistics";
import { DrawResult, LotteryConfig } from "@/data/lotteries";

/**
 * Analytics Core - Centralized intelligence engine for Titan Loterias.
 * Unifies statistical calculations, trend detection, and performance metrics.
 */

export interface AnalyticsSnapshot {
  hotNumbers: number;
  coldNumbers: number;
  avgDelay: number;
  maxDelay: number;
  avgFreq: number;
  mostFrequent: NumberStats | null;
  leastFrequent: NumberStats | null;
  volatilityIndex: number; // Measure of how much numbers change positions in frequency rankings
  saturationScore: number; // Likelihood of the current "hot" set being replaced
}

export function calculateAnalyticsSnapshot(stats: NumberStats[], draws: DrawResult[]): AnalyticsSnapshot {
  if (stats.length === 0) {
    return {
      hotNumbers: 0,
      coldNumbers: 0,
      avgDelay: 0,
      maxDelay: 0,
      avgFreq: 0,
      mostFrequent: null,
      leastFrequent: null,
      volatilityIndex: 0,
      saturationScore: 0,
    };
  }

  const hotNumbers = stats.filter(s => s.status === "hot").length;
  const coldNumbers = stats.filter(s => s.status === "cold").length;
  const avgDelay = Math.round(stats.reduce((a, s) => a + s.lastSeen, 0) / stats.length);
  const avgFreq = Math.round(stats.reduce((a, s) => a + s.frequency, 0) / stats.length);
  const maxDelay = Math.max(...stats.map(s => s.lastSeen));
  const mostFrequent = stats.reduce((a, s) => s.frequency > a.frequency ? s : a, stats[0]);
  const leastFrequent = stats.reduce((a, s) => s.frequency < a.frequency ? s : a, stats[0]);

  // Volatility: standard deviation of frequencies normalized by total draws
  const freqVar = stats.reduce((s, st) => s + Math.pow(st.frequency - avgFreq, 2), 0) / stats.length;
  const volatilityIndex = draws.length > 0 ? (Math.sqrt(freqVar) / draws.length) * 100 : 0;

  // Saturation: ratio of high-momentum cold numbers vs low-momentum hot numbers
  const risingCold = stats.filter(s => s.status === "cold" && s.trend > 0).length;
  const fallingHot = stats.filter(s => s.status === "hot" && s.trend < 0).length;
  const saturationScore = stats.length > 0 ? ((risingCold + fallingHot) / stats.length) * 100 : 0;

  return {
    hotNumbers,
    coldNumbers,
    avgDelay,
    maxDelay,
    avgFreq,
    mostFrequent,
    leastFrequent,
    volatilityIndex,
    saturationScore,
  };
}

export function getComplianceNotice() {
  return "Loterias são eventos aleatórios e as análises possuem caráter estatístico.";
}
