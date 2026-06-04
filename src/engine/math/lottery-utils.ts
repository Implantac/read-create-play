/**
 * Cálculos matemáticos puros para análise de loterias
 */

export const calculateCombinations = (n: number, k: number): number => {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n / 2) k = n - k;
  
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = res * (n - i + 1) / i;
  }
  return res;
};

export const calculateProbability = (totalNumbers: number, drawnNumbers: number, betNumbers: number, matchCount: number): number => {
  const waysToPickMatch = calculateCombinations(drawnNumbers, matchCount);
  const waysToPickRest = calculateCombinations(totalNumbers - drawnNumbers, betNumbers - matchCount);
  const totalWays = calculateCombinations(totalNumbers, betNumbers);
  
  return (waysToPickMatch * waysToPickRest) / totalWays;
};

export const getFrequencyMap = (draws: number[][]): Map<number, number> => {
  const freq = new Map<number, number>();
  draws.forEach(draw => {
    draw.forEach(num => {
      freq.set(num, (freq.get(num) || 0) + 1);
    });
  });
  return freq;
};

export const sortNumbers = (numbers: number[]): number[] => {
  return [...numbers].sort((a, b) => a - b);
};
