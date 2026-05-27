/**
 * AI — Deterministic RNG utilities
 * - No global Math.random overwrite
 * - Seeded, deterministic per request
 */

export interface Rng {
  next(): number; // [0, 1)
}

/** xorshift32 deterministic RNG */
export function createXorshift32(seed: number): Rng {
  // force to uint32
  let s = seed >>> 0;
  return {
    next: () => {
      // xorshift32
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return ((s >>> 0) / 4294967296);
    },
  };
}

/** Stable hash => uint32 */
export function hashStringToSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}


