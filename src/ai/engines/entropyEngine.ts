/**
 * Native AI — Entropy & Dispersion Engine
 * Advanced information-theoretic metrics for bet quality assessment.
 * PURE OVERLAY — no existing logic modified.
 */

// ═══════════════════════════════════════════════════════
// 1. SHANNON ENTROPY FOR BET EVALUATION
// ═══════════════════════════════════════════════════════

/** Compute Shannon entropy of a number distribution within zones */
export function computeZoneEntropy(
  numbers: number[],
  totalNumbers: number,
  zoneCount: number = 5
): number {
  const zoneSize = Math.ceil(totalNumbers / zoneCount);
  const zoneCounts = new Array(zoneCount).fill(0);

  for (const n of numbers) {
    const z = Math.min(zoneCount - 1, Math.floor((n - 1) / zoneSize));
    zoneCounts[z]++;
  }

  let entropy = 0;
  for (const c of zoneCounts) {
    if (c > 0) {
      const p = c / numbers.length;
      entropy -= p * Math.log2(p);
    }
  }

  const maxEntropy = Math.log2(Math.min(zoneCount, numbers.length));
  return maxEntropy > 0 ? entropy / maxEntropy : 0; // normalized 0-1
}

// ═══════════════════════════════════════════════════════
// 2. GAP ENTROPY — How evenly spaced are the numbers?
// ═══════════════════════════════════════════════════════

/** Compute entropy of gaps between sorted numbers */
export function computeGapEntropy(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  if (sorted.length < 2) return 0;

  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(sorted[i] - sorted[i - 1]);
  }

  const totalGap = gaps.reduce((a, b) => a + b, 0);
  if (totalGap === 0) return 0;

  let entropy = 0;
  for (const g of gaps) {
    const p = g / totalGap;
    if (p > 0) entropy -= p * Math.log2(p);
  }

  const maxEntropy = Math.log2(gaps.length);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

// ═══════════════════════════════════════════════════════
// 3. DISPERSION INDEX (Coefficient of Variation)
// ═══════════════════════════════════════════════════════

/** Measure how dispersed numbers are across the range */
export function computeDispersionIndex(
  numbers: number[],
  totalNumbers: number
): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const n = sorted.length;
  if (n < 2) return 0;

  // Ideal spacing: numbers evenly distributed across range
  const idealGap = totalNumbers / (n + 1);
  const idealPositions = Array.from({ length: n }, (_, i) => (i + 1) * idealGap);

  // Sum of squared deviations from ideal positions
  let deviation = 0;
  for (let i = 0; i < n; i++) {
    deviation += ((sorted[i] - idealPositions[i]) / totalNumbers) ** 2;
  }

  // Convert to 0-1 score where 1 = perfect distribution
  const rmsd = Math.sqrt(deviation / n);
  return Math.max(0, Math.min(1, 1 - rmsd * 4));
}

// ═══════════════════════════════════════════════════════
// 4. QUADRANT BALANCE — 2D grid balance metric
// ═══════════════════════════════════════════════════════

/** Measure balance across 4 quadrants of the number grid */
export function computeQuadrantBalance(
  numbers: number[],
  totalNumbers: number
): { balance: number; quadrants: number[] } {
  const mid = Math.ceil(totalNumbers / 2);
  const q1 = numbers.filter(n => n <= Math.ceil(mid / 2)).length;
  const q2 = numbers.filter(n => n > Math.ceil(mid / 2) && n <= mid).length;
  const q3 = numbers.filter(n => n > mid && n <= mid + Math.ceil(mid / 2)).length;
  const q4 = numbers.filter(n => n > mid + Math.ceil(mid / 2)).length;

  const quadrants = [q1, q2, q3, q4];
  const ideal = numbers.length / 4;
  const variance = quadrants.reduce((s, q) => s + (q - ideal) ** 2, 0) / 4;
  const maxVariance = (numbers.length * 0.75) ** 2; // worst case

  const balance = Math.max(0, Math.min(1, 1 - variance / Math.max(1, maxVariance)));
  return { balance, quadrants };
}

// ═══════════════════════════════════════════════════════
// 5. COMPOSITE ENTROPY SCORE
// ═══════════════════════════════════════════════════════

export interface EntropyReport {
  zoneEntropy: number;      // 0-1
  gapEntropy: number;       // 0-1
  dispersionIndex: number;  // 0-1
  quadrantBalance: number;  // 0-1
  compositeScore: number;   // 0-100
}

/** Full entropy analysis of a bet */
export function computeEntropyReport(
  numbers: number[],
  totalNumbers: number
): EntropyReport {
  const zoneEntropy = computeZoneEntropy(numbers, totalNumbers);
  const gapEntropy = computeGapEntropy(numbers);
  const dispersionIndex = computeDispersionIndex(numbers, totalNumbers);
  const { balance: quadrantBalance } = computeQuadrantBalance(numbers, totalNumbers);

  // Weighted composite
  const compositeScore = Math.round(
    zoneEntropy * 30 +
    gapEntropy * 25 +
    dispersionIndex * 25 +
    quadrantBalance * 20
  );

  return { zoneEntropy, gapEntropy, dispersionIndex, quadrantBalance, compositeScore };
}

// ═══════════════════════════════════════════════════════
// 6. PORTFOLIO ENTROPY — Measure diversity across games
// ═══════════════════════════════════════════════════════

/** Compute how diverse a set of games is using entropy */
export function computePortfolioEntropy(
  games: number[][],
  totalNumbers: number
): number {
  if (games.length < 2) return 1;

  const freq = new Map<number, number>();
  let totalPicks = 0;

  for (const g of games) {
    for (const n of g) {
      freq.set(n, (freq.get(n) || 0) + 1);
      totalPicks++;
    }
  }

  if (totalPicks === 0) return 0;

  let entropy = 0;
  freq.forEach((count) => {
    const p = count / totalPicks;
    if (p > 0) entropy -= p * Math.log2(p);
  }

  const maxEntropy = Math.log2(Math.min(freq.size, totalNumbers));
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}
