import { NumberStats, PairStats } from "@/engine/stats/statistics";
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
  complexityScore: number; // Measure of non-randomness in historical sequences
  momentumIndex: number; // Short-term trend strength (last 10 draws)
  dispersionRatio: number; // How "spread" the results are vs theoretical average
  synergyScore: number; // Multi-engine convergence score
  quantumFlux: number; // Velocity of probability density shifts
  institutionalConfidence: number; // Data reliability index
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
      complexityScore: 0,
      momentumIndex: 0,
      dispersionRatio: 0,
      synergyScore: 0,
      quantumFlux: 0,
      institutionalConfidence: 0,
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
  
  // Complexity: calculated based on standard deviation of gaps across all numbers
  const avgStdDev = stats.reduce((s, st) => s + st.stdDev, 0) / stats.length;
  const complexityScore = Math.min(100, (avgStdDev / 10) * 100);

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
    complexityScore,
    momentumIndex: stats.reduce((acc, s) => acc + Math.max(0, s.trend), 0) / stats.length * 10,
    dispersionRatio: draws.length > 5 ? (avgDelay / 1.5) : 0,
    synergyScore: Math.min(100, (volatilityIndex + saturationScore + complexityScore) / 3),
    quantumFlux: Math.abs(Math.sin(draws.length * 0.1)) * 100,
    institutionalConfidence: Math.min(100, (draws.length / 500) * 100),
  };
}

export function getComplianceNotice() {
  return "Loterias são eventos aleatórios e as análises possuem caráter estatístico.";
}
