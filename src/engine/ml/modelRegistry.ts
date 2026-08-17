export type ModelType = "heuristic" | "statistical" | "machine-learning" | "ensemble";

export interface ModelDefinition {
  id: string;
  name: string;
  type: ModelType;
  description: string;
  version: string;
  requiresTrainingData: boolean;
  predict: (stats: any, config: any) => any;
  evaluate?: (results: any) => any;
  train?: (data: any) => any;
}

export class ModelRegistry {
  private static instance: ModelRegistry;
  private models: Map<string, ModelDefinition> = new Map();

  private constructor() {}

  public static getInstance(): ModelRegistry {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }

  public register(model: ModelDefinition) {
    this.models.set(model.id, model);
  }

  public getModel(id: string): ModelDefinition | undefined {
    return this.models.get(id);
  }

  public getAllModels(): ModelDefinition[] {
    return Array.from(this.models.values());
  }
}
