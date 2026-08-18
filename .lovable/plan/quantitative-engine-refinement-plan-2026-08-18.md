# Quantitative Engine Refinement Plan

This plan formalizes the transformation of the system into a rigorous quantitative terminal, addressing the "Mathematical Truth" directive.

## Technical Details

### 1. Repository Hygiene & Safety
- Removed versioned `.env` (replaced with `.env.example`).
- Deleted execution artifacts like `eslint-report.json`.
- Added `.env.example` to track required variables without exposing secrets.

### 2. Evidence & Baseline Engine
- **New `EvidenceEngine`**: Implements Monte Carlo simulations (10,000+ iterations) to establish random baseline distributions.
- **Statistical Benchmarking**: Replaces arbitrary "accuracy" with Lift vs. Baseline, Z-score, and p-value significance testing.
- **Monte Carlo Baseline**: Provides mean, median, p5, and p95 metrics for random chance comparison.

### 3. Advanced Backtesting
- **Expanding Window**: Implemented Expanding Window strategy in `WalkForwardBacktest` to complement the existing Rolling Window.
- **Temporal Integrity**: Ensured no future data leakage by strictly partitioning training and test sets.

### 4. Metrics & Documentation
- **Composite Score**: Documented and empirically calibrated the weights (60% Precision@15, 40% Lift).
- **Audit Tracking**: Created `mem://features/quantitative-overhaul-audit.md` to track progress and remaining debt (Feature Ablation, Shuffling).

### 5. Validation Suite
- **Quantitative Tests**: Created `tests/quant/` with `baseline.test.ts` and `walkforward.test.ts` to ensure engine reliability.
- **Vitest Integration**: Updated `vitest.config.ts` to include the new quantitative test directory.

## Implementation Steps

1. **Hygiene**: Run `rm` and `git rm` on polluting files. Done.
2. **Scaffold**: Create `src/engine/evidence/EvidenceEngine.ts`. Done.
3. **Refactor**: Update `WalkForwardBacktest` with expanding window support. Done.
4. **Calibrate**: Adjust `ml-models.ts` scoring logic and naming. Done.
5. **Verify**: Write and run quantitative unit tests. Done.
6. **Memory**: Update project memory with new quantitative constraints. Done.
