export type ModelType = "heuristic" | "statistical" | "machine-learning" | "ensemble";

export interface ModelDefinition {
  id: string;
  name: string;
  type: ModelType;
  description: string;
  version: string;
  requiresTrainingData: boolean;
  
  // Funções core
  predict: (data: any, config: any) => any;
  evaluate: (predictions: any, groundTruth: any) => any;
  train?: (trainingData: any) => Promise<void>;
}

export class ModelRegistry {
  private static models: Map<string, ModelDefinition> = new Map();

  static register(model: ModelDefinition) {
    this.models.set(model.id, model);
  }

  static getModel(id: string): ModelDefinition | undefined {
    return this.models.get(id);
  }

  static getAllModels(): ModelDefinition[] {
    return Array.from(this.models.values());
  }

  static getModelsByType(type: ModelType): ModelDefinition[] {
    return this.getAllModels().filter(m => m.type === type);
  }
}
