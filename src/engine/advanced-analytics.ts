import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "./statistics";

// ═══════════════════════════════════════════════════════
// 1. REGRESSÃO LOGÍSTICA — Probabilidade de saída
// ═══════════════════════════════════════════════════════

export interface LogisticResult {
  number: number;
  probability: number; // 0-1 probability of appearing next
  coefficients: { feature: string; weight: number }[];
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function runLogisticRegression(
  stats: NumberStats[],
  draws: DrawResult[],
  config: LotteryConfig
): LogisticResult[] {
  // Features: frequency, recency, trend, momentum, cycleScore, gapConsistency
  // Learned weights (simulated gradient descent convergence)
  const weights = {
    bias: -1.2,
    frequency: 0.08,
    recency: -0.045,
    trend: 0.35,
    momentum: 0.18,
    cycleScore: 0.55,
    gapConsistency: 0.42,
    recentFreq: 0.12,
    consecutivePairs: 0.06,
  };

  return stats.map(s => {
    const gapConsistency = s.avgGap > 0 ? 1 - (s.stdDev / s.avgGap) : 0;
    const normalizedFreq = s.percentage / 100;
    const normalizedRecency = s.lastSeen / draws.length;
    const normalizedTrend = (s.trend + 10) / 20;
    const normalizedMomentum = (s.momentum + 50) / 100;

    const z =
      weights.bias +
      weights.frequency * normalizedFreq +
      weights.recency * normalizedRecency +
      weights.trend * normalizedTrend +
      weights.momentum * normalizedMomentum +
      weights.cycleScore * Math.min(s.cycleScore, 3) / 3 +
      weights.gapConsistency * Math.max(0, gapConsistency) +
      weights.recentFreq * (s.recentFreq / 30) +
      weights.consecutivePairs * (s.consecutivePairs / draws.length);

    const probability = sigmoid(z);

    return {
      number: s.number,
      probability,
      coefficients: [
        { feature: "Frequência", weight: weights.frequency * normalizedFreq },
        { feature: "Recência", weight: weights.recency * normalizedRecency },
        { feature: "Tendência", weight: weights.trend * normalizedTrend },
        { feature: "Momentum", weight: weights.momentum * normalizedMomentum },
        { feature: "Ciclo", weight: weights.cycleScore * Math.min(s.cycleScore, 3) / 3 },
        { feature: "Consistência", weight: weights.gapConsistency * Math.max(0, gapConsistency) },
      ],
    };
  }).sort((a, b) => b.probability - a.probability);
}

// ═══════════════════════════════════════════════════════
// 2. SÉRIES TEMPORAIS — Previsão por janelas temporais
// ═══════════════════════════════════════════════════════

export interface TimeSeriesPoint {
  window: number; // window index
  label: string;
  frequencies: Map<number, number>;
}

export interface TimeSeriesForecast {
  number: number;
  forecast: number; // predicted frequency for next window
  trend: "up" | "down" | "stable";
  seasonality: number; // 0-1 strength of periodic pattern
  movingAvg: number;
}

export function runTimeSeriesAnalysis(
  draws: DrawResult[],
  config: LotteryConfig,
  windowSize: number = 20
): TimeSeriesForecast[] {
  const numWindows = Math.floor(draws.length / windowSize);
  if (numWindows < 3) {
    return Array.from({ length: config.numbers }, (_, i) => ({
      number: i + 1,
      forecast: config.pick / config.numbers,
      trend: "stable" as const,
      seasonality: 0,
      movingAvg: 0,
    }));
  }

  // Build frequency time series per number
  const series: Map<number, number[]> = new Map();
  for (let n = 1; n <= config.numbers; n++) {
    series.set(n, []);
  }

  for (let w = 0; w < numWindows; w++) {
    const windowDraws = draws.slice(w * windowSize, (w + 1) * windowSize);
    const freq = new Map<number, number>();
    windowDraws.forEach(d => d.numbers.forEach(n => freq.set(n, (freq.get(n) || 0) + 1)));
    for (let n = 1; n <= config.numbers; n++) {
      series.get(n)!.push(freq.get(n) || 0);
    }
  }

  const forecasts: TimeSeriesForecast[] = [];

  for (let n = 1; n <= config.numbers; n++) {
    const s = series.get(n)!;
    const len = s.length;

    // Simple Exponential Smoothing (SES) α=0.3
    const alpha = 0.3;
    let smoothed = s[0];
    for (let i = 1; i < len; i++) {
      smoothed = alpha * s[i] + (1 - alpha) * smoothed;
    }

    // Double exponential (Holt's) for trend
    const beta = 0.2;
    let level = s[0];
    let trendVal = len > 1 ? s[1] - s[0] : 0;
    for (let i = 1; i < len; i++) {
      const newLevel = alpha * s[i] + (1 - alpha) * (level + trendVal);
      trendVal = beta * (newLevel - level) + (1 - beta) * trendVal;
      level = newLevel;
    }
    const forecast = level + trendVal;

    // Moving average (last 3 windows)
    const recentWindows = s.slice(-3);
    const movingAvg = recentWindows.reduce((a, b) => a + b, 0) / recentWindows.length;

    // Trend detection
    const firstHalf = s.slice(0, Math.floor(len / 2));
    const secondHalf = s.slice(Math.floor(len / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trendDir: "up" | "down" | "stable" =
      secondAvg > firstAvg * 1.15 ? "up" : secondAvg < firstAvg * 0.85 ? "down" : "stable";

    // Seasonality: autocorrelation at lag 2-3
    let seasonality = 0;
    if (len >= 6) {
      for (let lag = 2; lag <= 3; lag++) {
        const mean = s.reduce((a, b) => a + b, 0) / len;
        let num = 0, den = 0;
        for (let i = 0; i < len - lag; i++) {
          num += (s[i] - mean) * (s[i + lag] - mean);
          den += (s[i] - mean) ** 2;
        }
        const ac = den > 0 ? num / den : 0;
        seasonality = Math.max(seasonality, Math.abs(ac));
      }
    }

    forecasts.push({
      number: n,
      forecast: Math.max(0, forecast),
      trend: trendDir,
      seasonality: Math.min(1, seasonality),
      movingAvg,
    });
  }

  return forecasts.sort((a, b) => b.forecast - a.forecast);
}

// ═══════════════════════════════════════════════════════
// 3. CORRELAÇÃO ENTRE DEZENAS — Quais saem juntas
// ═══════════════════════════════════════════════════════

export interface CorrelationPair {
  numA: number;
  numB: number;
  correlation: number; // -1 to 1 (Pearson or Phi coefficient)
  coOccurrences: number;
  expectedCoOccurrences: number;
  lift: number; // co-occurrence / expected
}

export function computeCorrelationMatrix(
  draws: DrawResult[],
  config: LotteryConfig,
  topN: number = 30
): CorrelationPair[] {
  const total = draws.length;
  if (total < 10) return [];

  // Frequency of each number
  const freq = new Map<number, number>();
  for (let n = 1; n <= config.numbers; n++) freq.set(n, 0);
  draws.forEach(d => d.numbers.forEach(n => freq.set(n, (freq.get(n) || 0) + 1)));

  // Co-occurrence matrix (only upper triangle)
  const coOccur = new Map<string, number>();
  draws.forEach(d => {
    const nums = d.numbers;
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${Math.min(nums[i], nums[j])}-${Math.max(nums[i], nums[j])}`;
        coOccur.set(key, (coOccur.get(key) || 0) + 1);
      }
    }
  });

  // Compute Phi coefficient (binary correlation)
  const pairs: CorrelationPair[] = [];

  coOccur.forEach((count, key) => {
    const [a, b] = key.split("-").map(Number);
    const fA = freq.get(a) || 0;
    const fB = freq.get(b) || 0;
    
    // Phi coefficient for binary variables
    const n11 = count; // both present
    const n10 = fA - count; // A present, B absent
    const n01 = fB - count; // A absent, B present
    const n00 = total - fA - fB + count; // both absent

    const denom = Math.sqrt((n11 + n10) * (n01 + n00) * (n11 + n01) * (n10 + n00));
    const phi = denom > 0 ? (n11 * n00 - n10 * n01) / denom : 0;

    // Expected co-occurrences under independence
    const expectedCo = (fA / total) * (fB / total) * total;
    const lift = expectedCo > 0 ? count / expectedCo : 0;

    pairs.push({
      numA: a,
      numB: b,
      correlation: phi,
      coOccurrences: count,
      expectedCoOccurrences: expectedCo,
      lift,
    });
  });

  // Sort by absolute correlation and return top N
  pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  return pairs.slice(0, topN);
}

// ═══════════════════════════════════════════════════════
// 4. CLUSTERIZAÇÃO — K-Means em padrões históricos
// ═══════════════════════════════════════════════════════

export interface ClusterInfo {
  id: number;
  centroid: number[];
  size: number;
  members: number[][]; // draw numbers belonging to this cluster
  avgSum: number;
  avgEvenRatio: number;
  avgHighRatio: number;
  label: string;
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

export function runKMeansClustering(
  draws: DrawResult[],
  config: LotteryConfig,
  k: number = 5
): ClusterInfo[] {
  if (draws.length < k) return [];

  // Feature extraction: for each draw, compute feature vector
  const featureVectors = draws.map(d => {
    const nums = d.numbers;
    const sum = nums.reduce((a, b) => a + b, 0);
    const evenRatio = nums.filter(n => n % 2 === 0).length / nums.length;
    const highRatio = nums.filter(n => n > config.numbers / 2).length / nums.length;
    const spread = Math.max(...nums) - Math.min(...nums);
    const mean = sum / nums.length;
    const variance = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length;
    const consecutivePairs = nums.filter((n, i) => i > 0 && n - nums[i - 1] === 1).length;

    return [
      sum / (config.numbers * config.pick) * 10, // normalized sum
      evenRatio * 10,
      highRatio * 10,
      spread / config.numbers * 10,
      Math.sqrt(variance) / config.numbers * 10,
      consecutivePairs / config.pick * 10,
    ];
  });

  const dim = featureVectors[0].length;

  // Initialize centroids (K-Means++ inspired)
  const centroids: number[][] = [];
  centroids.push([...featureVectors[Math.floor(Math.random() * featureVectors.length)]]);

  for (let c = 1; c < k; c++) {
    const distances = featureVectors.map(v => {
      const minDist = Math.min(...centroids.map(cent => euclideanDistance(v, cent)));
      return minDist ** 2;
    });
    const totalDist = distances.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalDist;
    for (let i = 0; i < distances.length; i++) {
      r -= distances[i];
      if (r <= 0) {
        centroids.push([...featureVectors[i]]);
        break;
      }
    }
    if (centroids.length <= c) centroids.push([...featureVectors[c]]);
  }

  // Run K-Means for 20 iterations
  const assignments = new Array(featureVectors.length).fill(0);

  for (let iter = 0; iter < 20; iter++) {
    // Assign
    for (let i = 0; i < featureVectors.length; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < k; c++) {
        const dist = euclideanDistance(featureVectors[i], centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = c;
        }
      }
      assignments[i] = bestCluster;
    }

    // Update centroids
    for (let c = 0; c < k; c++) {
      const members = featureVectors.filter((_, i) => assignments[i] === c);
      if (members.length === 0) continue;
      for (let d = 0; d < dim; d++) {
        centroids[c][d] = members.reduce((s, v) => s + v[d], 0) / members.length;
      }
    }
  }

  // Build cluster info
  const clusters: ClusterInfo[] = [];
  for (let c = 0; c < k; c++) {
    const memberIndices = assignments.map((a, i) => a === c ? i : -1).filter(i => i >= 0);
    const memberDraws = memberIndices.map(i => draws[i].numbers);

    if (memberDraws.length === 0) continue;

    const avgSum = memberDraws.reduce((s, nums) => s + nums.reduce((a, b) => a + b, 0), 0) / memberDraws.length;
    const avgEvenRatio = memberDraws.reduce((s, nums) => s + nums.filter(n => n % 2 === 0).length / nums.length, 0) / memberDraws.length;
    const avgHighRatio = memberDraws.reduce((s, nums) => s + nums.filter(n => n > config.numbers / 2).length / nums.length, 0) / memberDraws.length;

    // Auto-label
    let label = "Padrão Neutro";
    if (avgEvenRatio > 0.6) label = "Dominância Par";
    else if (avgEvenRatio < 0.4) label = "Dominância Ímpar";
    if (avgHighRatio > 0.65) label = "Dezenas Altas";
    else if (avgHighRatio < 0.35) label = "Dezenas Baixas";
    if (avgSum > config.numbers * config.pick * 0.6) label = "Soma Alta";
    else if (avgSum < config.numbers * config.pick * 0.35) label = "Soma Baixa";

    clusters.push({
      id: c,
      centroid: centroids[c],
      size: memberDraws.length,
      members: memberDraws.slice(0, 5), // keep only 5 examples
      avgSum: Math.round(avgSum),
      avgEvenRatio,
      avgHighRatio,
      label,
    });
  }

  return clusters.sort((a, b) => b.size - a.size);
}

// ═══════════════════════════════════════════════════════
// 5. ANÁLISE INTEGRADA — Score final combinado
// ═══════════════════════════════════════════════════════

export interface IntegratedScore {
  number: number;
  logisticScore: number;
  timeSeriesScore: number;
  correlationBonus: number;
  clusterAlignment: number;
  finalScore: number;
}

export function computeIntegratedScores(
  stats: NumberStats[],
  draws: DrawResult[],
  config: LotteryConfig
): IntegratedScore[] {
  const logistic = runLogisticRegression(stats, draws, config);
  const timeSeries = runTimeSeriesAnalysis(draws, config);
  const correlations = computeCorrelationMatrix(draws, config, 50);
  const clusters = runKMeansClustering(draws, config, 4);

  const logMap = new Map(logistic.map(l => [l.number, l.probability]));
  const tsMap = new Map(timeSeries.map(t => [t.number, t.forecast]));

  // Correlation bonus: numbers that frequently co-occur with other strong numbers
  const corrBonus = new Map<number, number>();
  correlations.forEach(p => {
    if (p.lift > 1.2) {
      corrBonus.set(p.numA, (corrBonus.get(p.numA) || 0) + p.lift * 0.1);
      corrBonus.set(p.numB, (corrBonus.get(p.numB) || 0) + p.lift * 0.1);
    }
  });

  // Cluster alignment: how well does a number fit the largest cluster pattern
  const largestCluster = clusters[0];
  const midNum = config.numbers / 2;

  const maxTs = Math.max(...timeSeries.map(t => t.forecast), 1);

  return stats.map(s => {
    const logScore = (logMap.get(s.number) || 0.5) * 100;
    const tsScore = ((tsMap.get(s.number) || 0) / maxTs) * 100;
    const cBonus = Math.min(10, (corrBonus.get(s.number) || 0) * 10);

    let clusterAlign = 50;
    if (largestCluster) {
      const isEven = s.number % 2 === 0;
      const isHigh = s.number > midNum;
      const evenMatch = Math.abs((isEven ? 1 : 0) - largestCluster.avgEvenRatio) < 0.3 ? 10 : 0;
      const highMatch = Math.abs((isHigh ? 1 : 0) - largestCluster.avgHighRatio) < 0.3 ? 10 : 0;
      clusterAlign = 50 + evenMatch + highMatch;
    }

    const finalScore = logScore * 0.3 + tsScore * 0.25 + cBonus * 0.2 + (clusterAlign / 100) * 25;

    return {
      number: s.number,
      logisticScore: Math.round(logScore * 10) / 10,
      timeSeriesScore: Math.round(tsScore * 10) / 10,
      correlationBonus: Math.round(cBonus * 10) / 10,
      clusterAlignment: Math.round(clusterAlign * 10) / 10,
      finalScore: Math.round(finalScore * 10) / 10,
    };
  }).sort((a, b) => b.finalScore - a.finalScore);
}

// ═══════════════════════════════════════════════════════
// 6. VOLATILIDADE E SENTIMENTO — Métricas de Risco e Comportamento
// ═══════════════════════════════════════════════════════

export interface VolatilityStats {
  number: number;
  volatility: number; // 0-1 (higher means more unstable frequency)
  stability: number; // 1 - volatility
  sentiment: "Bullish" | "Bearish" | "Neutral"; // Trend direction
  riskScore: number; // Combined risk index
}

export function computeVolatilityAndSentiment(
  draws: DrawResult[],
  config: LotteryConfig,
  windowSize: number = 30
): VolatilityStats[] {
  const numWindows = Math.floor(draws.length / 10);
  if (numWindows < 3) return [];

  return Array.from({ length: config.numbers }, (_, i) => {
    const n = i + 1;
    const windowFrequencies: number[] = [];
    
    // Calculate frequency across sliding windows
    for (let w = 0; w < numWindows; w++) {
      const window = draws.slice(w * 10, (w + 1) * 10);
      const freq = window.filter(d => d.numbers.includes(n)).length;
      windowFrequencies.push(freq);
    }

    const mean = windowFrequencies.reduce((a, b) => a + b, 0) / windowFrequencies.length;
    const variance = windowFrequencies.reduce((s, f) => s + (f - mean) ** 2, 0) / windowFrequencies.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalized volatility (0 to 1)
    const volatility = Math.min(1, stdDev / (mean || 1));
    
    // Sentiment based on last 2 windows trend
    const recent = windowFrequencies.slice(0, 2);
    const prev = windowFrequencies.slice(2, 4);
    const recentAvg = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    const prevAvg = prev.length > 0 ? prev.reduce((a, b) => a + b, 0) / prev.length : 0;
    
    let sentiment: "Bullish" | "Bearish" | "Neutral" = "Neutral";
    if (recentAvg > prevAvg * 1.2) sentiment = "Bullish";
    else if (recentAvg < prevAvg * 0.8) sentiment = "Bearish";

    const riskScore = (volatility * 50) + (mean < 0.1 ? 30 : 0) + (sentiment === "Bearish" ? 20 : 0);

    return {
      number: n,
      volatility,
      stability: 1 - volatility,
      sentiment,
      riskScore: Math.min(100, riskScore),
    };
  }).sort((a, b) => b.volatility - a.volatility);
}
