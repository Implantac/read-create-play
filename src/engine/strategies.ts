import { NumberStats, generateSmartBet } from "./statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
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
  | "sectors"
  | "trend"
  | "cycle"
  | "hybrid"
  | "markov"
  | "poisson"
  | "cluster"
  | "expert";

export interface StrategyInfo {
  id: Strategy;
  label: string;
  desc: string;
  category: "basic" | "math" | "ai";
}

export const STRATEGIES: StrategyInfo[] = [
  // Basic
  { id: "smart", label: "Inteligente", desc: "Ponderação por frequência, tendência e ciclo", category: "basic" },
  { id: "hot", label: "Quentes", desc: "Dezenas com alta frequência recente e momentum positivo", category: "basic" },
  { id: "cold", label: "Frias", desc: "Dezenas atrasadas com ciclo vencido (prontas para sair)", category: "basic" },
  { id: "balanced", label: "Equilibrada", desc: "Mix proporcional com equilíbrio par/ímpar e alto/baixo", category: "basic" },
  { id: "trend", label: "Tendência", desc: "Números com momentum ascendente nas últimas rodadas", category: "basic" },
  // Math
  { id: "fibonacci", label: "Fibonacci", desc: "Dezenas baseadas na sequência de Fibonacci + estatística", category: "math" },
  { id: "primes", label: "Primos", desc: "Números primos ponderados por tendência e ciclo", category: "math" },
  { id: "golden", label: "Razão Áurea", desc: "Distribuição otimizada por φ (1.618)", category: "math" },
  { id: "sectors", label: "Setores", desc: "Cobertura equilibrada por faixas com melhor de cada setor", category: "math" },
  { id: "lowDelay", label: "Baixo Atraso", desc: "Números com maior atraso + detecção de ciclo vencido", category: "math" },
  { id: "pattern", label: "Padrão", desc: "Padrões par/ímpar, alto/baixo e consecutividade", category: "math" },
  { id: "cycle", label: "Ciclo", desc: "Seleção baseada no desvio padrão e regularidade de gaps", category: "math" },
  // AI
  { id: "ml", label: "IA Ensemble", desc: "Consenso de 6 modelos de Machine Learning", category: "ai" },
  { id: "hybrid", label: "IA Híbrida", desc: "Combina consenso ML + análise de tendência + ciclos", category: "ai" },
  { id: "markov", label: "Cadeia de Markov", desc: "Probabilidade de transição e sequência de estados", category: "ai" },
  { id: "poisson", label: "Poisson", desc: "Distribuição estatística por taxa de ocorrência", category: "ai" },
  { id: "cluster", label: "Clusters", desc: "Agrupamento por afinidade e correlação histórica", category: "ai" },
  { id: "expert", label: "Loto-Mestre", desc: "Estratégia profissional com dezenas fixas e desdobramento", category: "ai" },
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

function ensureBalancedSelection(selected: number[], pick: number, maxNum: number): number[] {
  // Ensure parity balance: no more than 60% of one type
  const evens = selected.filter(n => n % 2 === 0).length;
  const maxSameType = Math.ceil(pick * 0.6);

  if (evens > maxSameType || (selected.length - evens) > maxSameType) {
    // Rebalance by swapping excess
    const mid = Math.ceil(maxNum / 2);
    const balanced = [...selected].sort((a, b) => {
      const scoreA = (a % 2 === 0 ? 1 : 0) + (a > mid ? 1 : 0);
      const scoreB = (b % 2 === 0 ? 1 : 0) + (b > mid ? 1 : 0);
      return scoreA - scoreB; // diversify
    });
    return balanced.slice(0, pick).sort((a, b) => a - b);
  }
  return selected;
}

export function generateByStrategy(
  strategy: Strategy,
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[] = []
): number[] {
  const pick = config.pick;

  switch (strategy) {
    case "hot": {
      const pool = [...stats]
        .filter(s => s.status === "hot" || (s.status === "normal" && s.trend > 0))
        .map(s => ({ ...s, weight: Math.max(0.1, s.recentFreq * 2 + s.trend * 0.5 + s.momentum * 0.2 + Math.random() * 3) }));
      const shuffled = weightedShuffle(pool);
      const selected = shuffled.slice(0, pick).map(s => s.number);
      while (selected.length < pick) {
        const n = Math.floor(Math.random() * config.numbers) + 1;
        if (!selected.includes(n)) selected.push(n);
      }
      return ensureBalancedSelection(selected, pick, config.numbers);
    }

    case "cold": {
      const pool = [...stats]
        .filter(s => s.status === "cold" || s.cycleScore > 1.2)
        .map(s => ({ ...s, weight: Math.max(0.1, s.cycleScore * 3 + s.lastSeen * 0.1 + Math.random() * 3) }));
      const shuffled = weightedShuffle(pool);
      const selected = shuffled.slice(0, pick).map(s => s.number);
      while (selected.length < pick) {
        const n = Math.floor(Math.random() * config.numbers) + 1;
        if (!selected.includes(n)) selected.push(n);
      }
      return ensureBalancedSelection(selected, pick, config.numbers);
    }

    case "balanced": {
      const hot = stats.filter(s => s.status === "hot");
      const cold = stats.filter(s => s.status === "cold" && s.cycleScore > 1);
      const normal = stats.filter(s => s.status === "normal");
      const hotPick = Math.floor(pick * 0.35);
      const coldPick = Math.floor(pick * 0.25);
      const normalPick = pick - hotPick - coldPick;
      const sortByScore = (arr: NumberStats[]) =>
        [...arr].sort((a, b) => (b.trend + b.cycleScore * 2 + Math.random() * 3) - (a.trend + a.cycleScore * 2 + Math.random() * 3));
      const selected = [
        ...sortByScore(hot).slice(0, hotPick),
        ...sortByScore(cold).slice(0, coldPick),
        ...sortByScore(normal).slice(0, normalPick),
      ].map(s => s.number);
      while (selected.length < pick) {
        const n = Math.floor(Math.random() * config.numbers) + 1;
        if (!selected.includes(n)) selected.push(n);
      }
      return ensureBalancedSelection(selected, pick, config.numbers);
    }

    case "trend": {
      const weighted = stats.map(s => ({
        ...s,
        weight: Math.max(0.1,
          (s.trend > 0 ? s.trend * 3 : 0.5) +
          (s.momentum > 0 ? s.momentum * 2 : 0) +
          s.recentFreq * 1.5
        ),
      }));
      const shuffled = weightedShuffle(weighted);
      const selected = shuffled.slice(0, pick).map(s => s.number);
      return ensureBalancedSelection(selected, pick, config.numbers);
    }

    case "fibonacci": {
      const fibs = getFibonacciNumbers(config.numbers);
      const weighted = stats.map(s => ({
        ...s,
        weight: (fibs.includes(s.number) ? 5 : 1) + s.recentFreq * 0.3 + s.trend * 0.4 + (s.cycleScore > 1 ? 2 : 0),
      }));
      const shuffled = weightedShuffle(weighted);
      return shuffled.slice(0, pick).map(s => s.number).sort((a, b) => a - b);
    }

    case "primes": {
      const primes = Array.from({ length: config.numbers }, (_, i) => i + 1).filter(isPrime);
      const weighted = stats.map(s => ({
        ...s,
        weight: (primes.includes(s.number) ? 4 : 1) +
          (s.status === "hot" ? 2 : 0) +
          s.trend * 0.5 +
          (s.cycleScore > 1.2 ? 3 : 0),
      }));
      const shuffled = weightedShuffle(weighted);
      return shuffled.slice(0, pick).map(s => s.number).sort((a, b) => a - b);
    }

    case "golden": {
      const PHI = 1.618033988749895;
      const goldenPositions = Array.from({ length: pick * 3 }, (_, i) => {
        const pos = Math.round(((i * PHI) % 1) * config.numbers) + 1;
        return Math.min(pos, config.numbers);
      });
      const weighted = stats.map(s => ({
        ...s,
        weight: (goldenPositions.includes(s.number) ? 4 : 1) +
          s.recentFreq * 0.3 + s.trend * 0.3 + (s.cycleScore > 1 ? 2 : 0),
      }));
      const shuffled = weightedShuffle(weighted);
      return shuffled.slice(0, pick).map(s => s.number).sort((a, b) => a - b);
    }

    case "sectors": {
      const sectorCount = Math.min(pick, 5);
      const sectorSize = Math.ceil(config.numbers / sectorCount);
      const selected: number[] = [];

      for (let sec = 0; sec < sectorCount; sec++) {
        const start = sec * sectorSize + 1;
        const end = Math.min((sec + 1) * sectorSize, config.numbers);
        const sectorStats = stats.filter(s => s.number >= start && s.number <= end);
        const perSector = Math.ceil(pick / sectorCount);

        const sorted = [...sectorStats].sort((a, b) => {
          const scoreA = a.recentFreq * 2 + a.trend * 1.5 + (a.cycleScore > 1 ? 5 : 0) + Math.random() * 2;
          const scoreB = b.recentFreq * 2 + b.trend * 1.5 + (b.cycleScore > 1 ? 5 : 0) + Math.random() * 2;
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
      const sorted = [...stats].sort((a, b) => {
        const cycleA = a.cycleScore + (a.stdDev < a.avgGap ? 1 : 0);
        const cycleB = b.cycleScore + (b.stdDev < b.avgGap ? 1 : 0);
        return cycleB - cycleA;
      });
      const pool = sorted.slice(0, pick * 2);
      const weighted = pool.map(s => ({
        ...s,
        weight: s.cycleScore * 3 + (s.trend > 0 ? s.trend : 0) + Math.random() * 2,
      }));
      const shuffled = weightedShuffle(weighted);
      return shuffled.slice(0, pick).map(s => s.number).sort((a, b) => a - b);
    }

    case "pattern": {
      const mid = Math.ceil(config.numbers / 2);
      const evens = stats.filter(s => s.number % 2 === 0)
        .map(s => ({ ...s, weight: Math.max(0.1, s.recentFreq + s.trend + Math.random() * 3) }));
      const odds = stats.filter(s => s.number % 2 !== 0)
        .map(s => ({ ...s, weight: Math.max(0.1, s.recentFreq + s.trend + Math.random() * 3) }));

      const evenPick = Math.ceil(pick / 2);
      const oddPick = pick - evenPick;
      const lowPick = Math.ceil(pick / 2);

      const shuffledEvens = weightedShuffle(evens);
      const shuffledOdds = weightedShuffle(odds);

      const candidates = new Set<number>();
      shuffledEvens.slice(0, evenPick * 2).forEach(s => candidates.add(s.number));
      shuffledOdds.slice(0, oddPick * 2).forEach(s => candidates.add(s.number));

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

    case "cycle": {
      const weighted = stats.map(s => ({
        ...s,
        weight: Math.max(0.1,
          (s.stdDev < s.avgGap * 0.5 ? 5 : s.stdDev < s.avgGap ? 3 : 1) +
          (s.cycleScore > 1.5 ? s.cycleScore * 4 : s.cycleScore * 2) +
          (s.trend > 0 ? s.trend : 0)
        ),
      }));
      const shuffled = weightedShuffle(weighted);
      return shuffled.slice(0, pick).map(s => s.number).sort((a, b) => a - b);
    }

    case "ml": {
      const models = runAllModels(stats, config);
      const consensus = getConsensusRanking(models);
      const topPool = consensus.slice(0, Math.min(pick * 2, consensus.length));
      const shuffled = [...topPool].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, pick).map(p => p.number).sort((a, b) => a - b);
    }

    case "hybrid": {
      const models = runAllModels(stats, config);
      const consensus = getConsensusRanking(models);
      const consensusMap = new Map(consensus.map(c => [c.number, c.score]));

      const weighted = stats.map(s => ({
        ...s,
        weight: Math.max(0.1,
          (consensusMap.get(s.number) || 0) * 0.4 +
          (s.trend > 0 ? s.trend * 3 : 0) +
          s.cycleScore * 5 +
          (s.momentum > 0 ? s.momentum * 1.5 : 0) +
          (s.stdDev < s.avgGap * 0.5 ? 4 : 0) +
          s.recentFreq * 1.2
        ),
      }));
      const shuffled = weightedShuffle(weighted);
      const selected = shuffled.slice(0, pick).map(s => s.number);
      return ensureBalancedSelection(selected, pick, config.numbers);
    }

    case "markov": {
      // Logic: compute transition probabilities between numbers
      const transitions = new Map<number, Map<number, number>>();
      draws.slice(0, 50).forEach(draw => {
        for (let i = 0; i < draw.numbers.length; i++) {
          for (let j = i + 1; j < draw.numbers.length; j++) {
            const n1 = draw.numbers[i];
            const n2 = draw.numbers[j];
            if (!transitions.has(n1)) transitions.set(n1, new Map());
            const targets = transitions.get(n1)!;
            targets.set(n2, (targets.get(n2) || 0) + 1);
          }
        }
      });

      const weighted = stats.map(s => {
        let transitionScore = 0;
        const targets = transitions.get(s.number);
        if (targets) {
          transitionScore = Array.from(targets.values()).reduce((a, b) => a + b, 0) / 10;
        }
        return {
          ...s,
          weight: Math.max(0.1, s.recentFreq * 1.5 + transitionScore + (s.trend > 0 ? s.trend * 2 : 1) + Math.random() * 5),
        };
      });
      const shuffled = weightedShuffle(weighted);
      return shuffled.slice(0, pick).map(s => s.number).sort((a, b) => a - b);
    }

    case "poisson": {
      // Logic: based on Lambda (expected frequency)
      const lambda = pick / config.numbers;
      const weighted = stats.map(s => {
        // Probability of occurring based on recent gap vs average gap
        const p = Math.exp(-lambda) * (lambda ** (s.avgGap / (s.lastSeen + 1)));
        return {
          ...s,
          weight: Math.max(0.1, p * 20 + s.cycleScore * 2 + Math.random() * 4),
        };
      });
      const shuffled = weightedShuffle(weighted);
      return shuffled.slice(0, pick).map(s => s.number).sort((a, b) => a - b);
    }

    case "cluster": {
      // Logic: groups of numbers that appeared together recently
      const weighted = stats.map(s => {
        const clusterScore = s.momentum * 2 + s.recentFreq * 1.5;
        return {
          ...s,
          weight: Math.max(0.1, clusterScore + (s.status === "hot" ? 3 : 0) + Math.random() * 6),
        };
      });
      const shuffled = weightedShuffle(weighted);
      return shuffled.slice(0, pick).map(s => s.number).sort((a, b) => a - b);
    }

    case "expert": {
      // Expert strategy: use top 3 consensus as "fixed" numbers, then fill with high-cycle-score variants
      const models = runAllModels(stats, config);
      const consensus = getConsensusRanking(models);
      const fixedCount = Math.min(3, Math.floor(pick * 0.4));
      const fixed = consensus.slice(0, fixedCount).map(c => c.number);
      
      const remainingStats = stats.filter(s => !fixed.includes(s.number));
      const weighted = remainingStats.map(s => ({
        ...s,
        weight: Math.max(0.1, s.cycleScore * 6 + s.trend * 4 + s.recentFreq * 2 + Math.random() * 5),
      }));
      
      const shuffled = weightedShuffle(weighted);
      const selected = [...fixed, ...shuffled.slice(0, pick - fixed.length).map(s => s.number)];
      return selected.sort((a, b) => a - b);
    }

    default:
      return generateSmartBet(stats, pick);
  }
}
