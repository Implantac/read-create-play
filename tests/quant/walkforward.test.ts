import { describe, it, expect } from 'vitest';
import { WalkForwardBacktest } from '../../src/engine/evidence/backtest';
import { LOTOFACIL_CONFIG } from '../../src/data/lotteries';

describe('WalkForwardBacktest', () => {
  const mockDraws = Array.from({ length: 200 }, (_, i) => ({
    concurso: i + 1,
    date: new Date(2020, 0, i + 1).toISOString(),
    numbers: Array.from({ length: 15 }, (_, j) => ((i + j) % 25) + 1),
    winners: 0,
    prize: 0
  }));

  it('should run rolling window backtest', () => {
    const backtest = new WalkForwardBacktest(mockDraws, LOTOFACIL_CONFIG);
    const result = backtest.run(
      (data) => data[0].numbers, // Dummy model
      { windowSize: 50, testSize: 20, mode: 'rolling' }
    );
    expect(backtest).toBeDefined();
    expect(result.folds).toBe(20);
    expect(result.mode).toBe('rolling');
  });

  it('should run expanding window backtest', () => {
    const backtest = new WalkForwardBacktest(mockDraws, LOTOFACIL_CONFIG);
    const result = backtest.run(
      (data) => data[0].numbers,
      { windowSize: 50, testSize: 20, mode: 'expanding' }
    );
    expect(result.mode).toBe('expanding');
    expect(result.folds).toBe(20);
  });
});
