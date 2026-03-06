import { NumberStats } from "./statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { evaluateBetQuality, BetQualityReport } from "./bet-quality";
import { RiskLevel } from "./genetic-algorithm";

// ═══════════════════════════════════════════════════════
// SIMULATED ANNEALING
// Otimização estocástica inspirada no recozimento metalúrgico
// ═══════════════════════════════════════════════════════

export interface AnnealingConfig {
  initialTemp: number;
  coolingRate: number;
  iterations: number;
  riskLevel: RiskLevel;
  restarts: number;
}

export interface AnnealingResult {
  best: { numbers: number[]; quality: BetQualityReport; energy: number };
  top5: { numbers: number[]; quality: BetQualityReport; energy: number }[];
  iterations: number;
  elapsedMs: number;
  temperatureHistory: { step: number; temperature: number; energy: number }[];
  acceptanceRate: number;
}

const RISK_TEMPS: Record<RiskLevel, { initial: number; cooling: number; restarts: number }> = {
  conservative: { initial: 50, cooling: 0.995, restarts: 3 },
  moderate: { initial: 100, cooling: 0.99, restarts: 5 },
  aggressive: { initial: 200, cooling: 0.985, restarts: 8 },
};

function generateInitialSolution(stats: NumberStats[], config: LotteryConfig, risk: RiskLevel): number[] {
  const sorted = [...stats].sort((a, b) => {
    if (risk === "conservative") {
      return (b.recentFreq + b.cycleScore) - (a.recentFreq + a.cycleScore);
    } else if (risk === "aggressive") {
      return (b.momentum + b.cycleScore * 2 + Math.random() * 5) - (a.momentum + a.cycleScore * 2 + Math.random() * 5);
    }
    return (b.recentFreq * 2 + b.trend * 3 + b.cycleScore * 4) - (a.recentFreq * 2 + a.trend * 3 + a.cycleScore * 4);
  });

  const pool = sorted.slice(0, Math.min(config.pick * 3, sorted.length));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, config.pick).map(s => s.number).sort((a, b) => a - b);
}

function neighbor(solution: number[], stats: NumberStats[], config: LotteryConfig, temperature: number): number[] {
  const result = [...solution];
  // Number of swaps proportional to temperature
  const swaps = Math.max(1, Math.min(3, Math.floor(temperature / 50)));
  
  for (let s = 0; s < swaps; s++) {
    const idx = Math.floor(Math.random() * result.length);
    const current = new Set(result);
    
    // Choose replacement based on stats
    const candidates = stats
      .filter(st => !current.has(st.number))
      .sort((a, b) => {
        const scoreA = a.recentFreq * 2 + a.trend * 3 + a.cycleScore * 4 + Math.random() * temperature * 0.1;
        const scoreB = b.recentFreq * 2 + b.trend * 3 + b.cycleScore * 4 + Math.random() * temperature * 0.1;
        return scoreB - scoreA;
      });

    if (candidates.length > 0) {
      // Pick from top candidates with some randomness
      const range = Math.min(candidates.length, Math.max(3, Math.floor(temperature / 10)));
      result[idx] = candidates[Math.floor(Math.random() * range)].number;
    }
  }

  return result.sort((a, b) => a - b);
}

export function runSimulatedAnnealing(
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[],
  annealingConfig: Partial<AnnealingConfig> = {}
): AnnealingResult {
  const start = performance.now();
  const risk = annealingConfig.riskLevel || "moderate";
  const preset = RISK_TEMPS[risk];

  const cfg: AnnealingConfig = {
    initialTemp: annealingConfig.initialTemp || preset.initial,
    coolingRate: annealingConfig.coolingRate || preset.cooling,
    iterations: annealingConfig.iterations || 5000,
    riskLevel: risk,
    restarts: annealingConfig.restarts || preset.restarts,
  };

  const allBests: { numbers: number[]; quality: BetQualityReport; energy: number }[] = [];
  const temperatureHistory: AnnealingResult["temperatureHistory"] = [];
  let totalAccepted = 0;
  let totalProposals = 0;
  const sampleInterval = Math.max(1, Math.floor(cfg.iterations / 50));

  for (let restart = 0; restart < cfg.restarts; restart++) {
    let current = generateInitialSolution(stats, config, risk);
    let currentQuality = evaluateBetQuality(current, stats, config, draws);
    let currentEnergy = currentQuality.overall;

    let best = current;
    let bestQuality = currentQuality;
    let bestEnergy = currentEnergy;

    let temp = cfg.initialTemp;

    for (let i = 0; i < cfg.iterations; i++) {
      const candidate = neighbor(current, stats, config, temp);
      const candidateQuality = evaluateBetQuality(candidate, stats, config, draws);
      const candidateEnergy = candidateQuality.overall;

      totalProposals++;
      const delta = candidateEnergy - currentEnergy;

      // Accept if better, or with probability e^(delta/T) if worse
      if (delta > 0 || Math.random() < Math.exp(delta / temp)) {
        current = candidate;
        currentQuality = candidateQuality;
        currentEnergy = candidateEnergy;
        totalAccepted++;

        if (currentEnergy > bestEnergy) {
          best = current;
          bestQuality = currentQuality;
          bestEnergy = currentEnergy;
        }
      }

      temp *= cfg.coolingRate;

      if (restart === 0 && (i + 1) % sampleInterval === 0) {
        temperatureHistory.push({ step: i + 1, temperature: Math.round(temp * 100) / 100, energy: bestEnergy });
      }
    }

    allBests.push({ numbers: best, quality: bestQuality, energy: bestEnergy });
  }

  // Sort all restart bests
  allBests.sort((a, b) => b.energy - a.energy);

  // Deduplicate
  const seen = new Set<string>();
  const unique = allBests.filter(b => {
    const key = b.numbers.join(",");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    best: unique[0],
    top5: unique.slice(0, 5),
    iterations: cfg.iterations * cfg.restarts,
    elapsedMs: Math.round(performance.now() - start),
    temperatureHistory,
    acceptanceRate: Math.round((totalAccepted / totalProposals) * 100),
  };
}
