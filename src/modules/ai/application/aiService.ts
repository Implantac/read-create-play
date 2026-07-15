/**
 * AI application service (FASE 2 · Passo 3).
 *
 * Fachada fina sobre o `NativeAIOrchestrator`. Consumidores de UI devem chamar
 * `runAIRequest` em vez de instanciar o orchestrator diretamente — isso mantém
 * as pages fora do domínio (engines / geradores) e permite trocar a
 * implementação sem tocar em componentes.
 */
import { NativeAIOrchestrator } from "@/ai/core/nativeAIOrchestrator";
import type { AIRequest, AIResponse } from "@/ai/core/aiTypes";

let orchestratorSingleton: NativeAIOrchestrator | null = null;

function getOrchestrator(): NativeAIOrchestrator {
  if (!orchestratorSingleton) {
    orchestratorSingleton = new NativeAIOrchestrator();
  }
  return orchestratorSingleton;
}

export async function runAIRequest(request: AIRequest): Promise<AIResponse> {
  return getOrchestrator().process(request);
}
