/**
 * smartAlerts — escaneia fechamentos salvos e sinaliza os que têm alta chance
 * baseada em padrões recentes: soma alinhada, dezenas atrasadas presentes,
 * repetição próxima do típico, e "aquecimento" das dezenas-base.
 */

export interface SmartAlertInput {
  lotteryId: string;
  totalNumbers: number;
  pick: number;
  baseNumbers: number[];
  games: number[][];
  recentDraws: Array<{ concurso: number; numbers: number[]; date?: string }>;
}

export type AlertSeverity = "low" | "medium" | "high";

export interface SmartAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  score: number; // 0-100
}

export interface SmartAlertResult {
  alerts: SmartAlert[];
  overallScore: number;
  verdict: "cold" | "warm" | "hot" | "on-fire";
}

function verdictFrom(score: number): SmartAlertResult["verdict"] {
  if (score >= 80) return "on-fire";
  if (score >= 60) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

export function analyzeSmartAlerts(input: SmartAlertInput): SmartAlertResult {
  const { baseNumbers, recentDraws, totalNumbers, pick } = input;
  const window = Math.min(30, recentDraws.length);
  const draws = recentDraws.slice(0, window);

  const freq = new Map<number, number>();
  const lastSeen = new Map<number, number>();
  for (let i = 1; i <= totalNumbers; i++) freq.set(i, 0);
  draws.forEach((d, idx) => {
    for (const n of d.numbers) {
      freq.set(n, (freq.get(n) ?? 0) + 1);
      if (!lastSeen.has(n)) lastSeen.set(n, idx);
    }
  });

  const byFreq = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  const hotSet = new Set(byFreq.slice(0, Math.round(totalNumbers * 0.30)));
  const overdueSet = new Set(
    [...lastSeen.entries()]
      .sort((a, b) => (b[1] ?? window) - (a[1] ?? window))
      .slice(0, Math.round(totalNumbers * 0.25))
      .map(([n]) => n),
  );

  const alerts: SmartAlert[] = [];

  // 1) Aquecimento da base
  const hotInBase = baseNumbers.filter(n => hotSet.has(n)).length;
  const hotShare = baseNumbers.length > 0 ? hotInBase / baseNumbers.length : 0;
  if (hotShare >= 0.5) {
    alerts.push({
      id: "hot-base",
      severity: hotShare >= 0.65 ? "high" : "medium",
      title: `Base fortemente aquecida (${Math.round(hotShare * 100)}% dezenas quentes)`,
      detail: `${hotInBase}/${baseNumbers.length} dezenas da base estão entre as mais sorteadas nos últimos ${window} concursos.`,
      score: Math.round(hotShare * 100),
    });
  }

  // 2) Presença de dezenas atrasadas
  const overdueInBase = baseNumbers.filter(n => overdueSet.has(n)).length;
  if (overdueInBase >= 3) {
    alerts.push({
      id: "overdue-present",
      severity: overdueInBase >= 5 ? "high" : "medium",
      title: `${overdueInBase} dezenas atrasadas na base`,
      detail: `Dezenas com maior atraso: ${baseNumbers.filter(n => overdueSet.has(n)).join(", ")}.`,
      score: Math.min(100, overdueInBase * 15),
    });
  }

  // 3) Soma alinhada
  const idealSum = ((totalNumbers + 1) * pick) / 2;
  const gameSums = input.games.map(g => g.reduce((a, b) => a + b, 0));
  const avgSum = gameSums.reduce((a, b) => a + b, 0) / Math.max(1, gameSums.length);
  const sumDeviation = Math.abs(avgSum - idealSum) / idealSum;
  if (sumDeviation < 0.10) {
    alerts.push({
      id: "sum-aligned",
      severity: sumDeviation < 0.05 ? "high" : "medium",
      title: "Soma dos jogos alinhada com o padrão histórico",
      detail: `Soma média ${avgSum.toFixed(0)} vs ideal ${Math.round(idealSum)} (desvio ${(sumDeviation * 100).toFixed(1)}%).`,
      score: Math.round(100 - sumDeviation * 500),
    });
  }

  // 4) Repetição típica do último sorteio
  const last = recentDraws[0]?.numbers ?? [];
  if (last.length > 0) {
    const repeatCounts = input.games.map(g => g.filter(n => last.includes(n)).length);
    const avgRepeat = repeatCounts.reduce((a, b) => a + b, 0) / Math.max(1, repeatCounts.length);
    const typical = Math.round(pick * 0.5);
    if (Math.abs(avgRepeat - typical) <= 1.5) {
      alerts.push({
        id: "repeat-typical",
        severity: "medium",
        title: "Repetição do último concurso próxima do típico",
        detail: `Média de ${avgRepeat.toFixed(1)} dezenas repetidas do concurso #${recentDraws[0].concurso} (padrão histórico ~${typical}).`,
        score: 70,
      });
    }
  }

  // 5) Cobertura ampla
  const uniqueNumbers = new Set(input.games.flat()).size;
  const coverageShare = uniqueNumbers / totalNumbers;
  if (coverageShare >= 0.7) {
    alerts.push({
      id: "broad-coverage",
      severity: "low",
      title: `Cobertura ampla (${Math.round(coverageShare * 100)}% do universo)`,
      detail: `${uniqueNumbers}/${totalNumbers} dezenas aparecem em pelo menos um jogo.`,
      score: Math.round(coverageShare * 100),
    });
  }

  const overallScore = alerts.length > 0
    ? Math.round(alerts.reduce((a, b) => a + b.score * (b.severity === "high" ? 1.2 : b.severity === "medium" ? 1 : 0.6), 0) /
      alerts.reduce((a, b) => a + (b.severity === "high" ? 1.2 : b.severity === "medium" ? 1 : 0.6), 0))
    : 0;

  return {
    alerts: alerts.sort((a, b) => b.score - a.score),
    overallScore,
    verdict: verdictFrom(overallScore),
  };
}
