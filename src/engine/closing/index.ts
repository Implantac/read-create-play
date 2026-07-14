/**
 * Motor Universal de Fechamentos — API pública.
 */

export * from "./core/types";
export {
  generateClosing,
  compareStrategies,
  calculateGuarantee,
  compareClosings,
  calculateCoverageForGames,
  lotteryParamsFrom,
} from "./core/ClosingEngine";
export { validateClosing } from "./validation/ValidationEngine";
export { calculateCoverage } from "./core/CoverageCalculator";
export { runMonteCarlo, type MonteCarloResult, type MonteCarloOptions } from "./simulation/MonteCarloEngine";
export { runHistoricalBacktest, type BacktestResult, type BacktestOptions, type HistoricalDraw, type DrawOutcome } from "./simulation/HistoricalBacktest";
export { schonheimBound, binomial, combinations } from "./core/combinatorics";
export { computeScore } from "./scoring/ScoreEngine";
export {
  applyConstraints,
  CONSTRAINT_REGISTRY,
  CONSTRAINT_LIST,
  CONSTRAINT_PRESETS,
} from "./constraints";
export type {
  ConstraintDefinition,
  ActiveConstraint,
  ConstraintContext,
  ConstraintFilterResult,
} from "./constraints";

