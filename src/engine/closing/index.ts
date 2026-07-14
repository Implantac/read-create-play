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
export { schonheimBound, binomial, combinations } from "./core/combinatorics";
export { computeScore } from "./scoring/ScoreEngine";
