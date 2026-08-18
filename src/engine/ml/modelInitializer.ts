import { ModelRegistry } from "./modelRegistry";
import { 
  runFrequencyTrendScore, 
  runMultiFactorScore, 
  runTemporalPatternScore, 
  runBayesianScore, 
  runTransitionScore, 
  runMultiDimensionalPatternScore 
} from "../ai/ml-models";

export function initializeModelRegistry() {
  ModelRegistry.register({
    id: "frequency-trend",
    name: "FrequencyTrendScore",
    type: "heuristic",
    description: "Heurística baseada em frequência, tendência e ciclos",
    version: "2.1.0",
    requiresTrainingData: false,
    predict: (stats, config) => runFrequencyTrendScore(stats, config),
    evaluate: (pred, truth) => ({ hits: 0 })
  });

  ModelRegistry.register({
    id: "multi-factor",
    name: "MultiFactorScore",
    type: "statistical",
    description: "Algoritmo multi-fatorial com desvio padrão e análise de gaps",
    version: "2.1.0",
    requiresTrainingData: false,
    predict: (stats, config) => runMultiFactorScore(stats, config),
    evaluate: (pred, truth) => ({ hits: 0 })
  });

  ModelRegistry.register({
    id: "temporal-pattern",
    name: "TemporalPatternScore",
    type: "machine-learning",
    description: "Reconhecimento de padrões não-lineares temporais",
    version: "2.1.0",
    requiresTrainingData: true,
    predict: (stats, config) => runTemporalPatternScore(stats, config),
    evaluate: (pred, truth) => ({ hits: 0 })
  });
  
  // Register others...
}
