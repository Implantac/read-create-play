/**
 * rankGames — pontua cada jogo de um fechamento pela força estatística
 * (frequência recente + atraso + soma/pares balanceados) usando sorteios oficiais.
 */

export interface RankedGame {
  index: number;
  numbers: number[];
  score: number;       // 0-100
  hotHits: number;     // dezenas quentes contidas
  coldHits: number;    // dezenas frias contidas
  overdueHits: number; // dezenas atrasadas contidas
  balance: number;     // 0-100, distribuição par/ímpar + soma
  tier: "S" | "A" | "B" | "C" | "D";
}

export interface RankInput {
  games: number[][];
  totalNumbers: number;
  pick: number;
  /** Últimos sorteios (array de arrays de dezenas), do mais recente ao mais antigo. */
  recentDraws: number[][];
  /** Quantos sorteios considerar (default 50). */
  window?: number;
}

function tierFrom(score: number): RankedGame["tier"] {
  if (score >= 85) return "S";
  if (score >= 70) return "A";
  if (score >= 55) return "B";
  if (score >= 40) return "C";
  return "D";
}

export function rankGames(input: RankInput): RankedGame[] {
  const window = input.window ?? 50;
  const draws = input.recentDraws.slice(0, window);
  const freq = new Map<number, number>();
  const lastSeen = new Map<number, number>();

  for (let i = 0; i < input.totalNumbers; i++) freq.set(i + 1, 0);

  draws.forEach((draw, idx) => {
    for (const n of draw) {
      freq.set(n, (freq.get(n) ?? 0) + 1);
      if (!lastSeen.has(n)) lastSeen.set(n, idx);
    }
  });

  // Ranks: 1 = mais quente
  const byFreq = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  const hotSet = new Set(byFreq.slice(0, Math.round(input.totalNumbers * 0.25)));
  const coldSet = new Set(byFreq.slice(-Math.round(input.totalNumbers * 0.25)));
  const overdueSet = new Set(
    [...lastSeen.entries()]
      .sort((a, b) => (b[1] ?? window) - (a[1] ?? window))
      .slice(0, Math.round(input.totalNumbers * 0.2))
      .map(([n]) => n),
  );

  // Soma alvo balanceada
  const idealSum = (input.totalNumbers + 1) * input.pick / 2;

  const ranked = input.games.map<RankedGame>((game, idx) => {
    let hotHits = 0, coldHits = 0, overdueHits = 0;
    let sum = 0, odd = 0;
    for (const n of game) {
      sum += n;
      if (n % 2 === 1) odd++;
      if (hotSet.has(n)) hotHits++;
      if (coldSet.has(n)) coldHits++;
      if (overdueSet.has(n)) overdueHits++;
    }
    // Balanceamento: soma perto do ideal + par/ímpar ~50/50
    const sumScore = 100 - Math.min(100, Math.abs(sum - idealSum) / idealSum * 200);
    const parityScore = 100 - Math.min(100, Math.abs(odd - input.pick / 2) * (200 / input.pick));
    const balance = Math.round((sumScore + parityScore) / 2);

    const hotScore = (hotHits / input.pick) * 100;
    const coldPenalty = (coldHits / input.pick) * 40;
    const overdueBonus = (overdueHits / input.pick) * 30;

    const raw = hotScore * 0.5 + overdueBonus + balance * 0.3 - coldPenalty;
    const score = Math.max(0, Math.min(100, Math.round(raw)));

    return {
      index: idx,
      numbers: game,
      score,
      hotHits,
      coldHits,
      overdueHits,
      balance,
      tier: tierFrom(score),
    };
  });

  return ranked.sort((a, b) => b.score - a.score);
}
