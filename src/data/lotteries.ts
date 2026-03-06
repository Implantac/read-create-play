export interface LotteryConfig {
  id: string;
  name: string;
  numbers: number;
  pick: number;
  color: string;
  icon: string;
}

export const LOTTERIES: LotteryConfig[] = [
  { id: "megasena", name: "Mega Sena", numbers: 60, pick: 6, color: "neon-green", icon: "🍀" },
  { id: "lotofacil", name: "Lotofácil", numbers: 25, pick: 15, color: "neon-blue", icon: "🎯" },
  { id: "quina", name: "Quina", numbers: 80, pick: 5, color: "neon-purple", icon: "⭐" },
  { id: "lotomania", name: "Lotomania", numbers: 100, pick: 50, color: "neon-amber", icon: "🔥" },
  { id: "duplasena", name: "Dupla Sena", numbers: 50, pick: 6, color: "neon-red", icon: "🎲" },
  { id: "timemania", name: "Timemania", numbers: 80, pick: 10, color: "neon-green", icon: "⚽" },
  { id: "diadesorte", name: "Dia de Sorte", numbers: 31, pick: 7, color: "neon-blue", icon: "☀️" },
  { id: "supersete", name: "Super Sete", numbers: 10, pick: 7, color: "neon-amber", icon: "7️⃣" },
];

// Generate mock historical results
function generateMockResults(config: LotteryConfig, count: number): number[][] {
  const results: number[][] = [];
  for (let i = 0; i < count; i++) {
    const draw: number[] = [];
    while (draw.length < config.pick) {
      const n = Math.floor(Math.random() * config.numbers) + 1;
      if (!draw.includes(n)) draw.push(n);
    }
    results.push(draw.sort((a, b) => a - b));
  }
  return results;
}

export interface DrawResult {
  concurso: number;
  date: string;
  numbers: number[];
}

export function getMockDraws(lotteryId: string): DrawResult[] {
  const config = LOTTERIES.find(l => l.id === lotteryId)!;
  const count = 200;
  const results = generateMockResults(config, count);
  const now = new Date();
  return results.map((numbers, i) => ({
    concurso: 3000 - i,
    date: new Date(now.getTime() - i * 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    numbers,
  }));
}
