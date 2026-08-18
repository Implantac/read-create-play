export class ModelRegistry {
    static models = new Map();
    static register(model) {
        this.models.set(model.id, model);
    }
    static getModel(id) {
        return this.models.get(id);
    }
    static getAllModels() {
        return Array.from(this.models.values());
    }
    static getModelsByType(type) {
        return this.getAllModels().filter(m => m.type === type);
    }
}
