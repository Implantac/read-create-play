import { NumberStats, generateSmartBet } from "./statistics";
import { LotteryConfig } from "@/data/lotteries";
import { getConsensusRanking, runAllModels } from "./ml-models";

export type Strategy =
  | "smart"
  | "hot"
  | "cold"
  | "balanced"
  | "ml"
  | "fibonacci"
  | "primes"
  | "golden"
  | "pattern"
  | "lowDelay"
  | "sectors";

export interface StrategyInfo {
  id: Strategy;
  label: string;
  desc: string;
  category: "basic" | "math" | "ai";
}

export const STRATEGIES: StrategyInfo[] = [
  // Basic
  { id: "smart", label: "Inteligente", desc: "Ponderação por frequência e recência", category: "basic" },
  { id: "hot", label: "Quentes", desc: "Prioriza dezenas com alta frequência recente", category: "basic" },
  { id: "cold", label: "Frias", desc: "Dezenas atrasadas prontas para sair", category: "basic" },
  { id: "balanced", label: "Equilibrada", desc: "Mix proporcional de quentes, frias e normais", category: "basic" },
  // Math
  { id: "fibonacci", label: "Fibonacci", desc: "Dezenas baseadas na sequência de Fibonacci", category: "math" },
  { id: "primes", label: "Primos", desc: "Usa números primos com peso estatístico", category: "math" },
  { id: "golden", label: "Razão Áurea", desc: "Distribuição baseada em φ (1.618)", category: "math" },
  { id: "sectors", label: "Setores", desc: "Cobertura equilibrada por faixas numéricas", category: "math" },
  { id: "lowDelay", label: "Baixo Atraso", desc: "Números com maior atraso + padrão cíclico", category: "math" },
  { id: "pattern", label: "Padrão", desc: "Detecção de padrões par/ímpar e alto/baixo", category: "math" },
  // AI
  { id: "ml", label: "IA Ensemble", desc: "Consenso de 6 modelos de Machine Learning", category: "ai" },
];

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function getFibonacciNumbers(max: number): number[] {
  const fibs: number[] = [];
  let a = 1, b = 1;
  while (a <= max) {
    fibs.push(a);
    [a, b] = [b, a + b];
  }
  return fibs;
}

function weightedShuffle<T extends { weight: number }>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const totalWeight = result.slice(0, i + 1).reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * totalWeight;
    for (let j = 0; j <= i; j++) {
      r -= result[j].weight;
      if (r <= 0) {
        [result[i], result[j]] = [result[j], result[i]];
        break;
      }
    }
  }
  return result;
}

export function generateByStrategy(
  strategy: Strategy,
  stats: NumberStats[],
  config: LotteryConfig
): number[] {
  const pick = config.pick;

  switch (strategy) {
    case "hot": {
      const pool = [...stats]
        .filter(s => s.status === "hot" || s.status === "normal")
        .sort((a, b) => b.recentFreq - a.recentFreq || b.frequency - a.frequency);
      const selected = pool.slice(0, pick).map(s => s.number);
      while (selected.length < pick) {
        const n = Math.floor(Math.random() * config.numbers) + 1;
        if (!selected.includes(n)) selected.push(n);
      }
      return selected.sort((a, b) => a - b);
    }

    case "cold": {
      const pool = [...stats]
        .filter(s => s.status === "cold" || s.status === "normal")
        .sort((a, b) => b.lastSeen - a.lastSeen);
      const selected = pool.slice(0, pick).map(s => s.number);
      while (selected.length < pick) {
        const n = Math.floor(Math.random() * config.numbers) + 1;
        if (!selected.includes(n)) selected.push(n);
      }
      return selected.sort((a, b) => a - b);
    }

    case "balanced": {
      const hot = stats.filter(s => s.status === "hot");
      const cold = stats.filter(s => s.status === "cold");
      const normal = stats.filter(s => s.status === "normal");
      const hotPick = Math.floor(pick * 0.4);
      const coldPick = Math.floor(pick * 0.3);
      const normalPick = pick - hotPick - coldPick;
      const shuffle = (arr: NumberStats[]) => [...arr].sort(() => Math.random() - 0.5);
      const selected = [
        ...shuffle(hot).slice(0, hotPick),
        ...shuffle(cold).slice(0, coldPick),
        ...shuffle(normal).slice(0, normalPick),
      ].map(s => s.number);
      while (selected.length < pick) {
        const n = Math.floor(Math.random() * config.numbers) + 1;
        if (!selected.includes(n)) selected.push(n);
      }
      return selected.sort((a, b) => a - b);
    }

    case "fibonacci": {
      const fibs = getFibonacciNumbers(config.numbers);
      // Weight fibonacci numbers higher, but also include statistically strong non-fib numbers
      const weighted = stats.map(s => ({
        ...s,
        weight: fibs.includes(s.number) ? 5 + s.recentFreq : 1 + s.recentFreq * 0.3,
      }));
      const shuffled = weightedShuffle(weighted);
      const selected = shuffled.slice(0, pick).map(s => s.number);
      return selected.sort((a, b) => a - b);
    }

    case "primes": {
      const primes = Array.from({ length: config.numbers }, (_, i) => i + 1).filter(isPrime);
      const weighted = stats.map(s => ({
        ...s,
        weight: primes.includes(s.number)
          ? 4 + (s.status === "hot" ? 3 : 1)
          : 1 + (s.status === "hot" ? 1.5 : 0.5),
      }));
      const shuffled = weightedShuffle(weighted);
      const selected = shuffled.slice(0, pick).map(s => s.number);
      return selected.sort((a, b) => a - b);
    }

    case "golden": {
      const PHI = 1.618033988749895;
      // Generate golden-ratio-distributed positions across the range
      const goldenPositions = Array.from({ length: pick * 3 }, (_, i) => {
        const pos = Math.round(((i * PHI) % 1) * config.numbers) + 1;
        return Math.min(pos, config.numbers);
      });
      const weighted = stats.map(s => ({
        ...s,
        weight: goldenPositions.includes(s.number)
          ? 4 + s.recentFreq * 0.5
          : 1 + s.recentFreq * 0.2,
      }));
      const shuffled = weightedShuffle(weighted);
      const selected = shuffled.slice(0, pick).map(s => s.number);
      return selected.sort((a, b) => a - b);
    }

    case "sectors": {
      // Divide numbers into equal sectors and pick proportionally
      const sectorCount = Math.min(pick, 5);
      const sectorSize = Math.ceil(config.numbers / sectorCount);
      const selected: number[] = [];

      for (let sec = 0; sec < sectorCount; sec++) {
        const start = sec * sectorSize + 1;
        const end = Math.min((sec + 1) * sectorSize, config.numbers);
        const sectorStats = stats.filter(s => s.number >= start && s.number <= end);
        const perSector = Math.ceil(pick / sectorCount);

        const sorted = [...sectorStats].sort((a, b) => {
          const scoreA = a.recentFreq * 2 + (a.status === "hot" ? 3 : 0) + Math.random() * 2;
          const scoreB = b.recentFreq * 2 + (b.status === "hot" ? 3 : 0) + Math.random() * 2;
          return scoreB - scoreA;
        });

        sorted.slice(0, perSector).forEach(s => {
          if (selected.length < pick && !selected.includes(s.number)) {
            selected.push(s.number);
          }
        });
      }

      while (selected.length < pick) {
        const n = Math.floor(Math.random() * config.numbers) + 1;
        if (!selected.includes(n)) selected.push(n);
      }
      return selected.sort((a, b) => a - b);
    }

    case "lowDelay": {
      // Pick numbers with the highest delays (overdue), weighted by cycle patterns
      const sorted = [...stats].sort((a, b) => {
        const cycleA = a.frequency > 0 ? a.lastSeen / (stats.length / a.frequency) : 0;
        const cycleB = b.frequency > 0 ? b.lastSeen / (stats.length / b.frequency) : 0;
        return cycleB - cycleA;
      });
      const pool = sorted.slice(0, pick * 2);
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, pick).map(s => s.number);
      return selected.sort((a, b) => a - b);
    }

    case "pattern": {
      // Enforce balanced parity (even/odd) and range (high/low) patterns
      const mid = Math.ceil(config.numbers / 2);
      const evens = stats.filter(s => s.number % 2 === 0).sort((a, b) => b.recentFreq - a.recentFreq);
      const odds = stats.filter(s => s.number % 2 !== 0).sort((a, b) => b.recentFreq - a.recentFreq);
      const lows = stats.filter(s => s.number <= mid).sort((a, b) => b.recentFreq - a.recentFreq);
      const highs = stats.filter(s => s.number > mid).sort((a, b) => b.recentFreq - a.recentFreq);

      const evenPick = Math.ceil(pick / 2);
      const oddPick = pick - evenPick;
      const lowPick = Math.ceil(pick / 2);

      const candidates = new Set<number>();

      // Add from even/odd pools
      evens.slice(0, evenPick * 2).forEach(s => candidates.add(s.number));
      odds.slice(0, oddPick * 2).forEach(s => candidates.add(s.number));

      // Filter to ensure low/high balance
      const selected: number[] = [];
      let lowCount = 0;
      const candidateArr = [...candidates].sort(() => Math.random() - 0.5);

      for (const n of candidateArr) {
        if (selected.length >= pick) break;
        const isLow = n <= mid;
        if (isLow && lowCount >= lowPick) continue;
        if (!isLow && selected.length - lowCount >= pick - lowPick) continue;
        selected.push(n);
        if (isLow) lowCount++;
      }

      while (selected.length < pick) {
        const n = Math.floor(Math.random() * config.numbers) + 1;
        if (!selected.includes(n)) selected.push(n);
      }
      return selected.sort((a, b) => a - b);
    }

    case "ml": {
      const models = runAllModels(stats, config);
      const consensus = getConsensusRanking(models);
      const topPool = consensus.slice(0, Math.min(pick * 2, consensus.length));
      const shuffled = [...topPool].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, pick).map(p => p.number).sort((a, b) => a - b);
    }

    default:
      return generateSmartBet(stats, pick);
  }
}
