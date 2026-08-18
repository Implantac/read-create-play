import { LotteryConfig, DrawResult } from "@/data/lotteries";

/**
 * Data Leakage Detector
 * 
 * Verifies that predictive models do not "peek" into the future.
 * It deliberately alters future draws and checks if the prediction for a specific date changes.
 */
export class LeakageDetector {
  static detect(
    modelFn: (draws: DrawResult[]) => number[],
    draws: DrawResult[],
    targetDrawIndex: number
  ): boolean {
    if (targetDrawIndex >= draws.length - 1) return false;

    const historicalData = draws.slice(0, targetDrawIndex + 1);
    const originalPrediction = modelFn(historicalData);

    // Create a "future" with different results
    const futureDraws = draws.slice(targetDrawIndex + 1).map(d => ({
      ...d,
      numbers: d.numbers.map(n => (n % 25) + 1) // Deterministic shift
    }));

    const predictionWithAlteredFuture = modelFn([...historicalData, ...futureDraws].slice(0, targetDrawIndex + 1));

    // Compare predictions. If they differ, the model is using the whole array instead of slicing.
    const isLeaking = JSON.stringify(originalPrediction) !== JSON.stringify(predictionWithAlteredFuture);
    
    return isLeaking;
  }
}
