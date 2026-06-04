import { NumberStats } from "@/engine/stats/statistics";
import { DrawResult, LotteryConfig } from "@/data/lotteries";

// ═══════════════════════════════════════════════════════
// Avaliador de Qualidade de Apostas
// Pontua apostas em múltiplas dimensões
// ═══════════════════════════════════════════════════════

export interface BetQualityReport {
  overall: number; // 0-100
  dimensions: QualityDimension[];
  warnings: string[];
  strengths: string[];
  grade: "S" | "A" | "B" | "C" | "D" | "F";
}

export interface QualityDimension {
  name: string;
  score: number; // 0-100
  detail: string;
}

export function evaluateBetQuality(
  bet: number[],
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[]
): BetQualityReport {
  const dimensions: QualityDimension[] = [];
  const warnings: string[] = [];
  const strengths: string[] = [];

  // 1. Parity Balance (par/ímpar)
  const evens = bet.filter(n => n % 2 === 0).length;
  const evenRatio = evens / bet.length;
  const parityScore = 100 - Math.abs(evenRatio - 0.5) * 200;
  dimensions.push({
    name: "Equilíbrio Par/Ímpar",
    score: Math.max(0, Math.round(parityScore)),
    detail: `${evens} pares, ${bet.length - evens} ímpares`,
  });
  if (evenRatio > 0.7 || evenRatio < 0.3) warnings.push("Desequilíbrio forte par/ímpar");
  if (Math.abs(evenRatio - 0.5) < 0.15) strengths.push("Excelente equilíbrio par/ímpar");

  // 2. High/Low Balance
  const mid = config.numbers / 2;
  const highs = bet.filter(n => n > mid).length;
  const highRatio = highs / bet.length;
  const highLowScore = 100 - Math.abs(highRatio - 0.5) * 200;
  dimensions.push({
    name: "Equilíbrio Alto/Baixo",
    score: Math.max(0, Math.round(highLowScore)),
    detail: `${highs} altos, ${bet.length - highs} baixos`,
  });
  if (highRatio > 0.75 || highRatio < 0.25) warnings.push("Concentração em faixa alta ou baixa");

  // 3. Spread Coverage (cobertura do intervalo)
  const sorted = [...bet].sort((a, b) => a - b);
  const spread = sorted[sorted.length - 1] - sorted[0];
  const idealSpread = config.numbers * 0.75;
  const spreadScore = Math.min(100, (spread / idealSpread) * 100);
  dimensions.push({
    name: "Cobertura de Faixa",
    score: Math.round(spreadScore),
    detail: `Espalhamento: ${sorted[0]} a ${sorted[sorted.length - 1]} (${spread} unidades)`,
  });
  if (spread < config.numbers * 0.4) warnings.push("Números muito concentrados");
  if (spread > config.numbers * 0.7) strengths.push("Boa cobertura do intervalo");

  // 4. Sector Distribution
  const sectorCount = Math.min(5, Math.ceil(config.numbers / 10));
  const sectorSize = Math.ceil(config.numbers / sectorCount);
  const sectors = new Array(sectorCount).fill(0);
  bet.forEach(n => {
    const s = Math.min(sectorCount - 1, Math.floor((n - 1) / sectorSize));
    sectors[s]++;
  });
  const idealPerSector = bet.length / sectorCount;
  const sectorVariance = sectors.reduce((s, c) => s + (c - idealPerSector) ** 2, 0) / sectorCount;
  const sectorScore = Math.max(0, 100 - sectorVariance * 30);
  dimensions.push({
    name: "Distribuição por Setores",
    score: Math.round(sectorScore),
    detail: `Setores: [${sectors.join(", ")}]`,
  });
  if (sectors.some(s => s === 0)) warnings.push("Setor sem representação");

  // 5. Consecutive Numbers
  let consecutivePairs = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === 1) consecutivePairs++;
  }
  const idealConsecutive = Math.max(0, Math.min(2, Math.floor(bet.length / 5)));
  const consecScore = consecutivePairs <= idealConsecutive + 1
    ? Math.max(0, 100 - Math.abs(consecutivePairs - idealConsecutive) * 20)
    : Math.max(0, 100 - (consecutivePairs - idealConsecutive) * 30);
  dimensions.push({
    name: "Sequências Consecutivas",
    score: Math.round(consecScore),
    detail: `${consecutivePairs} par(es) consecutivo(s)`,
  });
  if (consecutivePairs > 3) warnings.push("Muitas sequências consecutivas");

  // 6. Sum Analysis
  const sum = bet.reduce((a, b) => a + b, 0);
  const avgSum = draws.length > 0
    ? draws.reduce((s, d) => s + d.numbers.reduce((a, b) => a + b, 0), 0) / draws.length
    : (config.numbers * (config.numbers + 1) / 2) * (config.pick / config.numbers);
  const sumStdDev = draws.length > 0
    ? Math.sqrt(draws.reduce((s, d) => {
        const dSum = d.numbers.reduce((a, b) => a + b, 0);
        return s + (dSum - avgSum) ** 2;
      }, 0) / draws.length)
    : avgSum * 0.15;
  const sumZScore = Math.abs(sum - avgSum) / (sumStdDev || 1);
  const sumScore = Math.max(0, 100 - sumZScore * 25);
  dimensions.push({
    name: "Soma dos Números",
    score: Math.round(sumScore),
    detail: `Soma: ${sum} (média: ${Math.round(avgSum)}, desvio: ±${Math.round(sumStdDev)})`,
  });
  if (sumZScore > 2) warnings.push("Soma muito distante da média histórica");
  if (sumZScore < 0.5) strengths.push("Soma dentro da faixa ideal");

  // 7. Hot/Cold Mix
  const betStats = bet.map(n => stats.find(s => s.number === n)!).filter(Boolean);
  const hotCount = betStats.filter(s => s.status === "hot").length;
  const coldCount = betStats.filter(s => s.status === "cold").length;
  const hotColdRatio = hotCount / bet.length;
  const mixScore = 100 - Math.abs(hotColdRatio - 0.4) * 150;
  dimensions.push({
    name: "Mix Quente/Frio",
    score: Math.max(0, Math.round(mixScore)),
    detail: `${hotCount} quentes, ${coldCount} frios, ${bet.length - hotCount - coldCount} neutros`,
  });
  if (hotCount === 0) warnings.push("Nenhum número quente na aposta");
  if (coldCount === 0 && bet.length > 5) strengths.push("Todos números com boa frequência");

  // 8. Trend Alignment
  const avgTrend = betStats.reduce((s, st) => s + st.trend, 0) / betStats.length;
  const trendScore = Math.min(100, Math.max(0, 50 + avgTrend * 10));
  dimensions.push({
    name: "Alinhamento de Tendência",
    score: Math.round(trendScore),
    detail: `Tendência média: ${avgTrend > 0 ? "+" : ""}${avgTrend.toFixed(2)}`,
  });
  if (avgTrend > 1) strengths.push("Números com tendência ascendente");

  // 9. Historical Uniqueness (not a repeat of recent draws)
  let maxOverlap = 0;
  const recentDraws = draws.slice(0, 50);
  for (const d of recentDraws) {
    const overlap = bet.filter(n => d.numbers.includes(n)).length;
    if (overlap > maxOverlap) maxOverlap = overlap;
  }
  const uniqueScore = Math.max(0, 100 - (maxOverlap / bet.length) * 80);
  dimensions.push({
    name: "Originalidade",
    score: Math.round(uniqueScore),
    detail: `Sobreposição máx. com resultado recente: ${maxOverlap}/${bet.length}`,
  });
  if (maxOverlap === bet.length) warnings.push("Aposta idêntica a resultado recente!");

  // 10. Neural Confidence / Momentum Interaction
  const avgMomentum = betStats.reduce((s, st) => s + (st.momentum || 0), 0) / (betStats.length || 1);
  const alphaScore = Math.min(100, Math.max(0, 50 + avgMomentum * 5));
  dimensions.push({
    name: "Confiança Alpha Momentum",
    score: Math.round(alphaScore),
    detail: `Aceleração técnica: ${avgMomentum.toFixed(2)}`,
  });
  if (avgMomentum > 2) strengths.push("Aceleração técnica premium detectada");

  // Overall score (weighted average)
  const weights = [12, 12, 10, 10, 8, 15, 12, 11, 6, 4]; // must sum to 100
  const overall = Math.round(
    dimensions.reduce((s, d, i) => s + (d.score * (weights[i] || 0) / 100), 0)
  );

  const grade: BetQualityReport["grade"] =
    overall >= 90 ? "S" :
    overall >= 75 ? "A" :
    overall >= 60 ? "B" :
    overall >= 45 ? "C" :
    overall >= 30 ? "D" : "F";

  return { overall, dimensions, warnings, strengths, grade };
}
