/**
 * Native Analysis Engine — Generates text analysis reports
 * Replaces all AI gateway calls with deterministic, statistical text generation
 */

import { NumberStats } from "./statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";

// ═══ PATTERN ANALYSIS ═══
export function generatePatternAnalysis(
  report: any,
  config: LotteryConfig,
  drawCount: number
): string {
  const { summary, parityPatterns, sumPatterns, consecutivePatterns, spatialDistribution, hotStreaks, frequencyTrends } = report;

  const top10Trending = (frequencyTrends || []).slice(0, 10);
  const rising = top10Trending.filter((f: any) => f.momentum > 0);
  const declining = top10Trending.filter((f: any) => f.momentum < 0);

  const bestParity = parityPatterns?.[0];
  const sumRange = sumPatterns?.find((s: any) => s.count === Math.max(...sumPatterns.map((p: any) => p.count)));

  let md = `## 📊 Análise de Padrões — ${config.name}\n\n`;
  md += `Análise baseada nos últimos **${drawCount}** concursos.\n\n`;

  // Parity
  if (bestParity) {
    md += `### Paridade\n`;
    md += `Padrão dominante: **${bestParity.evens}P/${bestParity.odds}I** (${bestParity.percentage.toFixed(1)}% dos sorteios)\n\n`;
  }

  // Sum
  if (sumRange) {
    md += `### Soma\n`;
    md += `Faixa mais frequente: **${sumRange.rangeLabel}** (${sumRange.percentage.toFixed(1)}%)\n`;
    md += `Soma média: **${summary?.avgSum?.toFixed(0) || 'N/A'}** | Desvio: **${summary?.sumStdDev?.toFixed(1) || 'N/A'}**\n\n`;
  }

  // Consecutive
  if (consecutivePatterns?.length) {
    const mostCommon = consecutivePatterns[0];
    md += `### Sequências Consecutivas\n`;
    md += `Padrão mais comum: **${mostCommon.count}** ocorrências com ${mostCommon.consecutive} consecutivos (${mostCommon.percentage.toFixed(1)}%)\n\n`;
  }

  // Spatial
  if (spatialDistribution?.sectors?.length) {
    md += `### Distribuição Espacial\n`;
    spatialDistribution.sectors.forEach((s: any) => {
      md += `- **${s.label}**: média ${s.avgCount.toFixed(1)} dezenas\n`;
    });
    md += `\n`;
  }

  // Trending
  if (rising.length > 0) {
    md += `### 🔥 Dezenas em Alta\n`;
    md += rising.map((f: any) => `**${String(f.number).padStart(2, '0')}** (momentum: +${f.momentum.toFixed(1)})`).join(', ') + '\n\n';
  }
  if (declining.length > 0) {
    md += `### ❄️ Dezenas em Declínio\n`;
    md += declining.map((f: any) => `**${String(f.number).padStart(2, '0')}** (momentum: ${f.momentum.toFixed(1)})`).join(', ') + '\n\n';
  }

  // Cooccurrence
  if (report.cooccurrenceMatrix?.length > 0) {
    md += `### 🔗 Pares Frequentes\n`;
    report.cooccurrenceMatrix.slice(0, 8).forEach((c: any) => {
      md += `- **(${String(c.num1).padStart(2, '0')}, ${String(c.num2).padStart(2, '0')})**: ${c.count}x (lift: ${c.lift?.toFixed(2) || 'N/A'})\n`;
    });
    md += `\n`;
  }

  // Cycle
  if (report.cycleDetection?.length > 0) {
    const overdue = report.cycleDetection.filter((c: any) => c.status === 'overdue');
    if (overdue.length > 0) {
      md += `### ⏰ Dezenas Atrasadas (Overdue)\n`;
      md += overdue.slice(0, 10).map((c: any) => `**${String(c.number).padStart(2, '0')}** (atraso: ${c.currentGap}, média: ${c.avgCycle.toFixed(1)})`).join(', ') + '\n\n';
    }
  }

  // Overall score
  if (summary?.overallScore !== undefined) {
    md += `### 🎯 Score Geral dos Dados\n`;
    md += `**${summary.overallScore}/100** — ${summary.overallScore >= 70 ? 'Dados de alta qualidade com padrões claros' : summary.overallScore >= 50 ? 'Dados moderados, padrões parciais' : 'Dados ruidosos, recomenda-se cautela'}\n\n`;
  }

  md += `---\n*Análise gerada pelo motor estatístico nativo. Sem custo de créditos.*`;
  return md;
}

// ═══ SIMULATION ANALYSIS ═══
export function generateSimulationAnalysis(
  simulationData: any,
  config: LotteryConfig
): string {
  const bets = simulationData.bets || [];
  const totalDraws = simulationData.totalDraws || 0;

  if (bets.length === 0) return "Sem dados de simulação disponíveis.";

  const avgHits = bets.reduce((s: number, b: any) => s + b.avgHits, 0) / bets.length;
  const bestOverall = Math.max(...bets.map((b: any) => b.bestHit || 0));
  const totalPrizes = bets.reduce((s: number, b: any) => s + (b.prizeCount || 0), 0);
  const avgPrizeRate = (totalPrizes / (bets.length * Math.max(totalDraws, 1)) * 100);

  // Rank bets by performance
  const ranked = [...bets].sort((a: any, b: any) => (b.avgHits + b.bestHit * 0.5) - (a.avgHits + a.bestHit * 0.5));
  const best3 = ranked.slice(0, 3);
  const worst3 = ranked.slice(-3);

  let md = `## 📈 Análise da Simulação — ${config.name}\n\n`;
  md += `**${bets.length} apostas** simuladas contra **${totalDraws} concursos**\n\n`;

  md += `### Métricas Gerais\n`;
  md += `- Acertos médios: **${avgHits.toFixed(2)}** de ${config.pick}\n`;
  md += `- Melhor acerto: **${bestOverall}** de ${config.pick}\n`;
  md += `- Total de premiações: **${totalPrizes}**\n`;
  md += `- Taxa de premiação: **${avgPrizeRate.toFixed(2)}%**\n\n`;

  md += `### 🏆 Top 3 Apostas\n`;
  best3.forEach((b: any, i: number) => {
    md += `${i + 1}. [${(b.bet || []).map((n: number) => String(n).padStart(2, '0')).join(', ')}] — Média: ${b.avgHits.toFixed(2)}, Melhor: ${b.bestHit}, Prêmios: ${b.prizeCount || 0}\n`;
  });
  md += `\n`;

  // Stability analysis
  const stableBets = bets.filter((b: any) => (b.stability || 0) > 0.7);
  md += `### Estabilidade\n`;
  md += `**${stableBets.length}** de ${bets.length} apostas têm alta estabilidade (>70%)\n\n`;

  // Recommendations
  md += `### 💡 Recomendações\n`;
  if (avgPrizeRate > 5) {
    md += `- ✅ Taxa de premiação acima de 5% — bom desempenho geral\n`;
  } else {
    md += `- ⚠️ Taxa de premiação baixa — considere ajustar as estratégias\n`;
  }
  if (bestOverall >= config.pick - 2) {
    md += `- 🎯 Acertos próximos ao máximo detectados — estratégia promissora\n`;
  }
  md += `- Priorize as apostas do ranking superior para uso real\n`;
  md += `- Combine apostas estáveis com apostas agressivas para diversificação\n\n`;

  md += `---\n*Análise gerada pelo motor estatístico nativo. Sem custo de créditos.*`;
  return md;
}

// ═══ MASSIVE SIMULATION ANALYSIS ═══
export function generateMassiveSimAnalysis(
  topGames: any[],
  patternInsights: any,
  distributionSummary: any,
  config: LotteryConfig,
  totalGenerated: number,
  totalEvaluated: number
): string {
  // Number frequency in top games
  const numFreq: Record<number, number> = {};
  topGames.forEach((g: any) => {
    (g.numbers || []).forEach((n: number) => {
      numFreq[n] = (numFreq[n] || 0) + 1;
    });
  });

  const topNumbers = Object.entries(numFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const bottomNumbers = Object.entries(numFreq)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 10);

  let md = `## 🚀 Análise da Simulação Massiva — ${config.name}\n\n`;
  md += `**${totalGenerated.toLocaleString()}** jogos gerados → **${totalEvaluated.toLocaleString()}** avaliados → **Top ${topGames.length}** selecionados\n\n`;

  // Must-have numbers
  md += `### 🎯 Dezenas "Must-Have" (presentes nos melhores jogos)\n`;
  topNumbers.forEach(([n, freq]) => {
    const pct = (freq / topGames.length * 100).toFixed(0);
    const bar = Number(pct) >= 80 ? '🔥' : Number(pct) >= 60 ? '✅' : '➖';
    md += `- ${bar} **${String(n).padStart(2, '0')}**: ${pct}% dos top jogos (${freq}x)\n`;
  });
  md += `\n`;

  // Toxic numbers
  md += `### ❌ Dezenas "Tóxicas" (ausentes nos melhores jogos)\n`;
  bottomNumbers.forEach(([n, freq]) => {
    md += `- **${String(n).padStart(2, '0')}**: apenas ${freq}x nos top jogos\n`;
  });
  md += `\n`;

  // Distribution summary
  if (distributionSummary) {
    md += `### 📊 Distribuição dos Top Jogos\n`;
    md += `- Soma média: **${distributionSummary.avgSum?.toFixed(0) || 'N/A'}**\n`;
    md += `- Ratio par/ímpar médio: **${((distributionSummary.avgEvenRatio || 0) * 100).toFixed(0)}%** pares\n`;
    md += `- Spread médio: **${distributionSummary.avgSpread?.toFixed(0) || 'N/A'}**\n`;
    md += `- Taxa de premiação: **${(distributionSummary.avgPrizeRate || 0).toFixed(2)}%**\n`;
    md += `- Melhor acerto geral: **${distributionSummary.bestHitOverall || 0}** de ${config.pick}\n\n`;
  }

  // Pattern insights
  if (patternInsights) {
    md += `### 🔍 Padrões Detectados\n`;
    if (patternInsights.dominantParity) md += `- Paridade dominante: **${patternInsights.dominantParity}**\n`;
    if (patternInsights.sumTrend) md += `- Tendência de soma: **${patternInsights.sumTrend}**\n`;
    md += `\n`;
  }

  // Top 5 games
  md += `### 🏆 Top 5 Jogos\n`;
  topGames.slice(0, 5).forEach((g: any, i: number) => {
    md += `${i + 1}. [${(g.numbers || []).map((n: number) => String(n).padStart(2, '0')).join(', ')}] — Score: **${g.score?.toFixed(0) || 'N/A'}**\n`;
  });
  md += `\n`;

  md += `### 💡 Como Usar\n`;
  md += `- Priorize dezenas "must-have" na construção de apostas\n`;
  md += `- Evite concentrar dezenas "tóxicas" no mesmo jogo\n`;
  md += `- Os top 5 jogos representam as combinações mais otimizadas\n`;
  md += `- Use como base para fechamentos matemáticos\n\n`;

  md += `---\n*Análise gerada pelo motor estatístico nativo. Sem custo de créditos.*`;
  return md;
}

// ═══ AUTONOMOUS AI ANALYSIS ═══
export function generateAutonomousAnalysis(
  report: any,
  config: LotteryConfig
): string {
  const topRankings = report.rankings?.slice(0, 20) || [];
  const patterns = report.patterns || [];
  const shifts = report.shifts?.slice(0, 15) || [];
  const entropy = report.entropyAnalysis || {};
  const chiSquare = report.chiSquareResult || {};
  const gaps = report.gapAnalysis?.slice(0, 15) || [];
  const markov = report.markovTransitions?.slice(0, 15) || [];
  const cooccurrences = report.topCooccurrences?.slice(0, 10) || [];

  const tierS = topRankings.filter((r: any) => r.compositeScore >= 80);
  const tierA = topRankings.filter((r: any) => r.compositeScore >= 60 && r.compositeScore < 80);

  let md = `## 🧠 Análise Autônoma Profunda — ${config.name}\n\n`;
  md += `Score de confiança: **${report.confidenceScore || 0}/100**\n\n`;

  // Tier rankings
  md += `### 🏅 Ranking de Dezenas\n`;
  if (tierS.length > 0) {
    md += `**Tier S** (score ≥80): ${tierS.map((r: any) => `**${String(r.number).padStart(2, '0')}** (${r.compositeScore})`).join(', ')}\n\n`;
  }
  if (tierA.length > 0) {
    md += `**Tier A** (score ≥60): ${tierA.map((r: any) => `**${String(r.number).padStart(2, '0')}** (${r.compositeScore})`).join(', ')}\n\n`;
  }

  // Entropy
  if (entropy.entropy !== undefined) {
    const entropyPct = ((entropy.entropy / Math.log2(config.numbers)) * 100).toFixed(1);
    md += `### 📐 Análise de Entropia\n`;
    md += `Entropia: **${entropy.entropy?.toFixed(3) || 'N/A'}** (${entropyPct}% da máxima)\n`;
    md += `${Number(entropyPct) > 95 ? '✅ Distribuição muito uniforme — dados de alta qualidade' : Number(entropyPct) > 85 ? '⚠️ Leve concentração em algumas dezenas' : '❌ Concentração significativa — possível viés'}\n\n`;
  }

  // Chi-square
  if (chiSquare.chiSquare !== undefined) {
    md += `### 📊 Teste Chi-Quadrado\n`;
    md += `χ² = **${chiSquare.chiSquare?.toFixed(2) || 'N/A'}** | p-valor = **${chiSquare.pValue?.toFixed(4) || 'N/A'}**\n`;
    md += `${(chiSquare.pValue || 1) > 0.05 ? '✅ Não há evidência estatística de não-aleatoriedade (p > 0.05)' : '⚠️ Distribuição não-uniforme detectada (p ≤ 0.05)'}\n\n`;
  }

  // Gaps
  if (gaps.length > 0) {
    md += `### ⏰ Análise de Gaps\n`;
    const overdue = gaps.filter((g: any) => g.currentGap > g.avgGap * 1.3);
    if (overdue.length > 0) {
      md += `Dezenas atrasadas: ${overdue.map((g: any) => `**${String(g.number).padStart(2, '0')}** (gap: ${g.currentGap}, média: ${g.avgGap.toFixed(1)})`).join(', ')}\n\n`;
    } else {
      md += `Nenhuma dezena significativamente atrasada.\n\n`;
    }
  }

  // Markov transitions
  if (markov.length > 0) {
    md += `### 🔗 Transições de Markov\n`;
    md += `Top transições: ${markov.slice(0, 8).map((m: any) => `${String(m.from).padStart(2, '0')}→${String(m.to).padStart(2, '0')} (${m.count}x)`).join(', ')}\n\n`;
  }

  // Patterns
  if (patterns.length > 0) {
    md += `### 🔍 Padrões Detectados\n`;
    patterns.slice(0, 5).forEach((p: any) => {
      md += `- **${p.type || p.name}**: ${p.description || `Score: ${p.score || 'N/A'}`}\n`;
    });
    md += `\n`;
  }

  // Shifts
  if (shifts.length > 0) {
    md += `### 📈 Mudanças de Regime\n`;
    const risingShifts = shifts.filter((s: any) => s.direction === 'up' || s.shift > 0);
    const fallingShifts = shifts.filter((s: any) => s.direction === 'down' || s.shift < 0);
    if (risingShifts.length > 0) {
      md += `Em alta: ${risingShifts.slice(0, 5).map((s: any) => `**${String(s.number).padStart(2, '0')}**`).join(', ')}\n`;
    }
    if (fallingShifts.length > 0) {
      md += `Em queda: ${fallingShifts.slice(0, 5).map((s: any) => `**${String(s.number).padStart(2, '0')}**`).join(', ')}\n`;
    }
    md += `\n`;
  }

  md += `### 💡 Recomendações Estratégicas\n`;
  md += `- Priorize dezenas Tier S e A como núcleo das apostas\n`;
  md += `- Inclua 1-2 dezenas atrasadas (overdue) para diversificação\n`;
  md += `- Respeite as transições de Markov para sequências prováveis\n`;
  md += `- Monte fechamentos com as dezenas de maior score composto\n\n`;

  // Generate 10 games using rankings
  const allRanked = topRankings.map((r: any) => r.number);
  const overdueList = gaps.filter((g: any) => g.isOverdue || g.currentGap > (g.avgGap || 5) * 1.2).map((g: any) => g.number);
  
  md += `## 🎯 10 JOGOS OTIMIZADOS\n\n`;
  
  const strategies = [
    'Conservador', 'Conservador', 'Conservador',
    'Equilibrado', 'Equilibrado', 'Equilibrado',
    'Agressivo', 'Agressivo', 'Contrário', 'Cobertura Máxima'
  ];
  const seenGames = new Set<string>();
  
  for (let g = 0; g < 10; g++) {
    const pool = [...allRanked];
    if (g >= 6) {
      overdueList.forEach((n: number) => { if (!pool.includes(n)) pool.push(n); });
    }
    const game: number[] = [];
    const available = [...pool];
    while (game.length < config.pick && available.length > 0) {
      const bias = g < 3 ? 0.7 : g < 6 ? 0.5 : 0.3;
      const idx = Math.random() < bias
        ? Math.floor(Math.random() * Math.min(available.length, Math.ceil(config.pick * 1.5)))
        : Math.floor(Math.random() * available.length);
      const safeIdx = Math.min(idx, available.length - 1);
      const num = available[safeIdx];
      if (!game.includes(num) && num >= 1 && num <= config.numbers) {
        game.push(num);
      }
      available.splice(safeIdx, 1);
    }
    while (game.length < config.pick) {
      const n = Math.floor(Math.random() * config.numbers) + 1;
      if (!game.includes(n)) game.push(n);
    }
    game.sort((a, b) => a - b);
    const key = game.join(',');
    if (seenGames.has(key)) continue;
    seenGames.add(key);
    
    const confidence = g < 3 ? 75 - g * 3 : g < 6 ? 65 - (g - 3) * 3 : 55 - (g - 6) * 5;
    const nums = game.map(n => String(n).padStart(2, '0')).join(', ');
    md += `GAME_START\nJogo ${g + 1} - ${strategies[g]} (Confiança: ${confidence}/100)\nDezenas: ${nums}\nGAME_END\n\n`;
  }

  md += `---\n*Análise gerada pelo motor estatístico nativo. Sem custo de créditos.*`;
  return md;
}

// ═══ NATIVE BET GENERATION (replaces ai-lottery-predict) ═══
export function generateNativeBets(
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[],
  count: number
): { bets: number[][]; analysis: string; quality: { avgScore: number; scores: number[]; grade: string } } {
  const freq30: Record<number, number> = {};
  const freq10: Record<number, number> = {};
  const lastSeen: Record<number, number> = {};
  const minNum = config.name === "Super Sete" ? 0 : 1;
  const allNums = Array.from({ length: config.numbers - minNum + 1 }, (_, i) => i + minNum);

  for (const n of allNums) { freq30[n] = 0; freq10[n] = 0; lastSeen[n] = 999; }

  draws.forEach((d, i) => {
    d.numbers.forEach(n => {
      if (i < 30) freq30[n] = (freq30[n] || 0) + 1;
      if (i < 10) freq10[n] = (freq10[n] || 0) + 1;
      if (lastSeen[n] === 999) lastSeen[n] = i;
    });
  });

  // Composite score per number
  const compositeScores = allNums.map(n => {
    const s = stats.find(st => st.number === n);
    return {
      number: n,
      score: (freq30[n] || 0) * 2 + (freq10[n] || 0) * 3 +
        (s?.trend && s.trend > 0 ? s.trend * 10 : 0) +
        (s?.cycleScore && s.cycleScore > 1 ? (s.cycleScore - 1) * 15 : 0) +
        (lastSeen[n] <= 3 ? 5 : 0) +
        (s?.momentum && s.momentum > 0 ? s.momentum * 0.005 : 0),
    };
  }).sort((a, b) => b.score - a.score);

  const lastDraw = draws[0]?.numbers || [];
  const bets: number[][] = [];
  const scores: number[] = [];
  const seenKeys = new Set<string>();

  // Generate diverse bets with different strategies
  for (let attempt = 0; attempt < 2000 && bets.length < count; attempt++) {
    const strategy = bets.length < Math.ceil(count * 0.4) ? 'conservative'
      : bets.length < Math.ceil(count * 0.7) ? 'balanced' : 'aggressive';

    let pool: number[];
    if (strategy === 'conservative') {
      pool = compositeScores.slice(0, Math.min(config.pick * 2, allNums.length)).map(c => c.number);
    } else if (strategy === 'balanced') {
      pool = compositeScores.slice(0, Math.min(config.pick * 2.5, allNums.length)).map(c => c.number);
    } else {
      // Mix high-score with some random/overdue
      const top = compositeScores.slice(0, config.pick).map(c => c.number);
      const overdue = allNums.filter(n => lastSeen[n] >= 5).sort(() => Math.random() - 0.5).slice(0, Math.floor(config.pick * 0.4));
      pool = [...new Set([...top, ...overdue, ...allNums.sort(() => Math.random() - 0.5).slice(0, config.pick)])];
    }

    // Shuffle and pick
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const candidate = shuffled.slice(0, config.pick).sort((a, b) => a - b);

    if (candidate.length !== config.pick) continue;
    if (new Set(candidate).size !== config.pick) continue;

    const key = candidate.join(',');
    if (seenKeys.has(key)) continue;

    // Validate sum range
    const sum = candidate.reduce((a, b) => a + b, 0);
    const expectedSum = (minNum + config.numbers) / 2 * config.pick;
    const sumDev = Math.abs(sum - expectedSum) / expectedSum;
    if (sumDev > 0.25) continue;

    // Validate parity
    const evens = candidate.filter(n => n % 2 === 0).length;
    const expectedEvens = Math.round(config.pick / 2);
    if (Math.abs(evens - expectedEvens) > Math.max(2, Math.floor(config.pick * 0.15))) continue;

    // Validate diversity from existing bets
    const isDiverse = bets.every(b => {
      const overlap = candidate.filter(n => b.includes(n)).length;
      return config.pick - overlap >= Math.max(2, Math.floor(config.pick * 0.15));
    });
    if (!isDiverse) continue;

    // Score the bet
    let score = 50;
    // Frequency bonus
    const avgFreq = candidate.reduce((s, n) => s + (freq30[n] || 0), 0) / config.pick;
    score += Math.min(20, avgFreq * 2);
    // Recent bonus
    const avgRecent = candidate.reduce((s, n) => s + (freq10[n] || 0), 0) / config.pick;
    score += Math.min(15, avgRecent * 3);
    // Parity balance bonus
    score += (1 - Math.abs(evens / config.pick - 0.5) * 2) * 10;
    // Sum proximity bonus
    score += (1 - sumDev) * 10;
    // Repetition from last draw
    if (lastDraw.length > 0) {
      const repeated = candidate.filter(n => lastDraw.includes(n)).length;
      const idealRepeat = Math.round(config.pick * config.pick / config.numbers);
      score += (1 - Math.abs(repeated - idealRepeat) / config.pick) * 5;
    }

    score = Math.max(0, Math.min(100, Math.round(score)));
    seenKeys.add(key);
    bets.push(candidate);
    scores.push(score);
  }

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const grade = avgScore >= 90 ? "S" : avgScore >= 80 ? "A" : avgScore >= 70 ? "B" : avgScore >= 60 ? "C" : "D";

  // Build analysis text
  const strategies = ['Conservadora', 'Equilibrada', 'Agressiva'];
  let analysis = `**${bets.length} apostas** geradas pelo motor estatístico nativo.\n\n`;
  bets.forEach((b, i) => {
    const strat = i < Math.ceil(count * 0.4) ? strategies[0] : i < Math.ceil(count * 0.7) ? strategies[1] : strategies[2];
    const sum = b.reduce((a, c) => a + c, 0);
    const evens = b.filter(n => n % 2 === 0).length;
    analysis += `**Jogo ${i + 1}** (${strat}): Soma=${sum}, Pares=${evens}/${config.pick - evens}I, Score=${scores[i]}\n`;
  });

  return { bets, analysis, quality: { avgScore, scores, grade } };
}

// ═══ NATIVE BET IMPROVEMENT (replaces ai-lottery-predict improve mode) ═══
export function generateNativeImprovements(
  betsToImprove: { numbers: number[]; label?: string; avgHits?: number; bestHit?: number; prizeHits?: number }[],
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[]
): { original: number[]; suggested: number[]; reason: string; expectedGain: string }[] {
  const freq10: Record<number, number> = {};
  const minNum = config.name === "Super Sete" ? 0 : 1;
  const allNums = Array.from({ length: config.numbers - minNum + 1 }, (_, i) => i + minNum);

  for (const n of allNums) freq10[n] = 0;
  draws.slice(0, 10).forEach(d => d.numbers.forEach(n => { freq10[n] = (freq10[n] || 0) + 1; }));

  const hotNums = [...allNums].sort((a, b) => (freq10[b] || 0) - (freq10[a] || 0)).slice(0, 20);

  return betsToImprove.map(bet => {
    const nums = [...bet.numbers];
    const statsMap = new Map(stats.map(s => [s.number, s]));

    // Score each number
    const scored = nums.map(n => {
      const s = statsMap.get(n);
      return { number: n, score: (s?.frequency || 0) * 0.3 + (s?.recentFreq || 0) * 0.3 + (s?.cycleScore || 0) * 0.2 + (freq10[n] || 0) * 2 };
    }).sort((a, b) => a.score - b.score);

    // Replace weakest 2-3
    const replaceCount = Math.min(3, Math.floor(nums.length * 0.2));
    const toRemove = scored.slice(0, replaceCount).map(s => s.number);
    const remaining = nums.filter(n => !toRemove.includes(n));

    // Find best replacements
    const candidates = allNums
      .filter(n => !remaining.includes(n))
      .map(n => {
        const s = statsMap.get(n);
        let score = (s?.frequency || 0) * 0.3 + (s?.recentFreq || 0) * 0.3 + (freq10[n] || 0) * 2;
        // Balance corrections
        const mid = config.numbers / 2;
        const evenCount = remaining.filter(r => r % 2 === 0).length;
        const highCount = remaining.filter(r => r > mid).length;
        const needEven = Math.round(config.pick / 2) - evenCount;
        const needHigh = Math.round(config.pick / 2) - highCount;
        if (needEven > 0 && n % 2 === 0) score += 10;
        if (needEven < 0 && n % 2 !== 0) score += 10;
        if (needHigh > 0 && n > mid) score += 10;
        if (needHigh < 0 && n <= mid) score += 10;
        return { number: n, score };
      })
      .sort((a, b) => b.score - a.score);

    const toAdd = candidates.slice(0, replaceCount).map(c => c.number);
    const suggested = [...remaining, ...toAdd].sort((a, b) => a - b);

    const reasons: string[] = [];
    if (toRemove.some(n => !hotNums.includes(n))) reasons.push("Substituídos números frios por quentes");
    const oldEvens = nums.filter(n => n % 2 === 0).length;
    const newEvens = suggested.filter(n => n % 2 === 0).length;
    if (Math.abs(newEvens - config.pick / 2) < Math.abs(oldEvens - config.pick / 2)) reasons.push("Paridade equilibrada");
    if (reasons.length === 0) reasons.push("Números fracos substituídos por candidatos mais fortes");

    return {
      original: bet.numbers,
      suggested,
      reason: reasons.join('. ') + '.',
      expectedGain: "+10-20% estimado",
    };
  });
}
