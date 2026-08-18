# Plan: Evidence Engine & Statistical Audit (Mathematical Truth)

Implement a rigorous quantitative audit to correct statistical flaws in the Evidence layer, ensuring metrics like P-Value and Z-Score represent real predictive advantage vs. random chance, not fabricated thresholds.

## Core Corrections

### 1. Statistical Engine (`EvidenceEngine.ts`)
- **Remove Bernoulli Assumption**: Replace the independent Bernoulli hit rate test (incorrect for sampling without replacement) with a **Hypergeometric Distribution** baseline or **Permutation/Bootstrap** testing.
- **True P-Value**: Calculate p-values based on the actual distribution of hits in random games against official draws.
- **Paired Testing**: Implement a paired comparison where every strategy is tested against the **same** set of historical draws as a random baseline to eliminate draw-specific variance.
- **Monte Carlo Reform**: Update `runMonteCarloSim` to simulate actual lottery games (N numbers from M total) against historical draws, rather than generating random binary hits.

### 2. Evidence Grading System
- **Evidence Grade (E0-E4)**: Replace the binary "Signal Validated" with a professional scale:
    - **E0 (None)**: No advantage detected.
    - **E1 (Exploratory)**: Interesting result, inconclusive.
    - **E2 (Moderate)**: Consistent in partial tests.
    - **E3 (Strong)**: Consistent out-of-sample.
    - **E4 (Robust)**: Replicated across periods/seeds/baselines.

### 3. Frontend Audit
- **Remove Fabricated Metrics**: Delete hardcoded p-value/z-score logic in `EvidenceDistributionPanel.tsx` that uses Lift thresholds.
- **Real Metrics Only**: Display only metrics computed by the engine (`pValue`, `zScore`, `confidenceInterval`).
- **Audit Warning**: Update text to state that distribution above reference does not guarantee predictive advantage.

### 4. Backtest Integrity
- **Multiple Testing Control**: Implement **Benjamini-Hochberg (FDR)** or **Bonferroni** correction to account for "Data Snooping" across multiple strategies/modalities.
- **Holdout Set**: Enforce a strict separation between Discovery (70%), Validation (15%), and Holdout (15%) data to prevent overfitting.

## Technical Details

- **File**: `src/engine/stats/evidence-engine.ts`
    - Implement `calculateHypergeometricPValue` or use a Simulation-based P-Value (observed hits vs. 10k random trials).
    - Update `EvidenceReport` to include `evidenceGrade`.
- **File**: `src/components/lab/evidence/EvidenceDistributionPanel.tsx`
    - Remove `topStrategy.metrics.lift > 1.05 ? "0.042" : "0.315"` logic.
    - Bind to real `topStrategy.metrics.pValue`.
- **File**: `src/engine/strategy-evolution/engine.ts`
    - Integrate `EvidenceEngine` into the evolution loop for real-time validation.
