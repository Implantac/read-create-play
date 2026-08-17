import { DrawResult } from "@/data/lotteries";

export interface CyclePressure {
  number: number;
  lastSeen: number;
  windowFreq: number;
  pressure: number;
}

export function computeCyclePressure(draws: DrawResult[], totalNumbers: number, window: number = 12): CyclePressure[] {
  if (!draws || draws.length === 0) return [];
  
  const recent = draws.slice(0, window);
  const lastSeenMap = new Map<number, number>();
  const freqMap = new Map<number, number>();

  for (let n = 1; n <= totalNumbers; n++) {
    lastSeenMap.set(n, draws.length);
    freqMap.set(n, 0);
  }

  recent.forEach((d) => {
    if (d && d.numbers) {
      d.numbers.forEach((n) => freqMap.set(n, (freqMap.get(n) ?? 0) + 1));
    }
  });

  for (let n = 1; n <= totalNumbers; n++) {
    for (let i = 0; i < draws.length; i++) {
      if (draws[i]?.numbers?.includes(n)) {
        lastSeenMap.set(n, i);
        break;
      }
    }
  }

  const maxLast = Math.max(1, ...Array.from(lastSeenMap.values()));
  const results: CyclePressure[] = [];
  
  for (let n = 1; n <= totalNumbers; n++) {
    const lastSeen = lastSeenMap.get(n) ?? maxLast;
    const windowFreq = freqMap.get(n) ?? 0;
    
    // Pressure formula: 70% normalized delay + 30% absence in window
    const delayNorm = lastSeen / maxLast;
    const absenceNorm = 1 - windowFreq / window;
    const pressure = 0.7 * delayNorm + 0.3 * absenceNorm;
    
    results.push({ number: n, lastSeen, windowFreq, pressure });
  }
  
  return results;
}
