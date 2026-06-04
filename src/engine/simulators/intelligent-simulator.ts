import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { getMinPrizeHits } from "./lib/simulation-utils";

export interface SimulationBet {
  id: number;
  numbers: number[];
}

export interface BetResult {
  concurso: number;
  date: string;
  hits: number;
  matchedNumbers: number[];
}

export interface TimelinePoint {
  concurso: number;
  hits: number;
}

export interface BetSimulationResult {
  bet: SimulationBet;
  results: BetResult[];
  bestHit: number;
  avgHits: number;
  hitDistribution: Record<number, number>;
  prizeCount: number;
  stability: number;
  timeline: TimelinePoint[];
}

export interface SimulationOutput {
  bets: BetSimulationResult[];
  totalDraws: number;
  ranking: number[];
}

function toBitset(numbers: number[]): Uint32Array {
  const bs = new Uint32Array(4);
  for (const n of numbers) {
    bs[n >>> 5] |= 1 << (n & 31);
  }
  return bs;
}

function popcount32(x: number): number {
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

function intersectionCount(a: Uint32Array, b: Uint32Array): number {
  return popcount32(a[0] & b[0]) + popcount32(a[1] & b[1]) +
         popcount32(a[2] & b[2]) + popcount32(a[3] & b[3]);
}

export function runSimulation(
  bets: SimulationBet[],
  draws: DrawResult[],
  drawCount: number,
  lotteryId: string
): SimulationOutput {
  const selectedDraws = draws.slice(0, Math.min(drawCount, draws.length));
  const minPrize = getMinPrizeHits(lotteryId);

  const drawBitsets = selectedDraws.map(d => toBitset(d.numbers));

  const betResults: BetSimulationResult[] = bets.map(bet => {
    const betBs = toBitset(bet.numbers);
    const results: BetResult[] = [];
    const hitDist: Record<number, number> = {};
    let totalHits = 0;
    let bestHit = 0;
    let prizeCount = 0;
    const hitsArr: number[] = [];
    const timeline: TimelinePoint[] = [];

    for (let i = 0; i < selectedDraws.length; i++) {
      const hits = intersectionCount(betBs, drawBitsets[i]);
      totalHits += hits;
      hitsArr.push(hits);
      if (hits > bestHit) bestHit = hits;
      hitDist[hits] = (hitDist[hits] || 0) + 1;
      if (hits >= minPrize) prizeCount++;

      // Store timeline data (sample max 200 points for perf)
      if (selectedDraws.length <= 200 || i % Math.ceil(selectedDraws.length / 200) === 0) {
        timeline.push({ concurso: selectedDraws[i].concurso, hits });
      }

      if (hits >= Math.max(minPrize - 2, 1)) {
        const matched = bet.numbers.filter(n => selectedDraws[i].numbers.includes(n));
        results.push({
          concurso: selectedDraws[i].concurso,
          date: selectedDraws[i].date,
          hits,
          matchedNumbers: matched,
        });
      }
    }

    const avg = totalHits / selectedDraws.length;
    const variance = hitsArr.reduce((s, h) => s + (h - avg) ** 2, 0) / hitsArr.length;

    return {
      bet,
      results: results.sort((a, b) => b.hits - a.hits),
      bestHit,
      avgHits: Math.round(avg * 100) / 100,
      hitDistribution: hitDist,
      prizeCount,
      stability: Math.round(Math.sqrt(variance) * 100) / 100,
      timeline: timeline.reverse(), // chronological order
    };
  });

  const scored = betResults.map((r, i) => ({
    idx: i,
    score: r.avgHits * 3 + r.bestHit * 2 + r.prizeCount * 5 - r.stability,
  }));
  scored.sort((a, b) => b.score - a.score);

  return {
    bets: betResults,
    totalDraws: selectedDraws.length,
    ranking: scored.map(s => s.idx),
  };
}

export function parseBetsFromText(text: string, config: LotteryConfig): SimulationBet[] {
  const lines = text.trim().split("\n").filter(l => l.trim());
  const bets: SimulationBet[] = [];

  for (const line of lines) {
    const nums = line.match(/\d+/g)?.map(Number).filter(n => n >= 1 && n <= config.numbers) || [];
    const unique = [...new Set(nums)];
    if (unique.length === config.pick) {
      bets.push({ id: bets.length + 1, numbers: unique.sort((a, b) => a - b) });
    }
  }
  return bets;
}

export function generateRandomBets(count: number, config: LotteryConfig): SimulationBet[] {
  const bets: SimulationBet[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  const maxAttempts = count * 10;

  while (bets.length < count && attempts < maxAttempts) {
    attempts++;
    const nums: number[] = [];
    while (nums.length < config.pick) {
      const n = Math.floor(Math.random() * config.numbers) + 1;
      if (!nums.includes(n)) nums.push(n);
    }
    const sorted = nums.sort((a, b) => a - b);
    const key = sorted.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    bets.push({ id: bets.length + 1, numbers: sorted });
  }
  return bets;
}
