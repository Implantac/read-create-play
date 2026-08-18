import { describe, it, expect } from 'vitest';
import { EvidenceEngine } from '../../src/engine/evidence/EvidenceEngine';
import { LOTTERIES } from '../../src/data/lotteries';

const LOTOFACIL_CONFIG = LOTTERIES.find(l => l.id === 'lotofacil')!;


describe('EvidenceEngine', () => {
  const engine = new EvidenceEngine(LOTOFACIL_CONFIG);

  it('should generate a random baseline with expected mean', () => {
    const baseline = engine.generateRandomBaseline(1000);
    // Expected hits for Lotofacil (15 numbers picked, 15 drawn from 25)
    // p = 15/25 = 0.6. Expected = 15 * 0.6 = 9.0
    expect(baseline.mean).toBeGreaterThan(8.5);
    expect(baseline.mean).toBeLessThan(9.5);
  });

  it('should detect significant lift', () => {
    const baseline = engine.generateRandomBaseline(100);
    // 11 hits in 15 picks is high (Expected 9)
    const report = engine.compareAgainstBaseline(11, 1, baseline);
    expect(report.lift).toBeGreaterThan(1.1);
  });
});
