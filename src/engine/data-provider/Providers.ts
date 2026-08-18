import { DataProviderSource } from "./DataProvider";
import { LotteryService } from "@/services/lottery/lottery.service";
import { DrawResult } from "@/data/lotteries";

export const OfficialProvider: DataProviderSource = {
  origin: "official",
  name: "Provedor Oficial (Caixa/Cloud)",
  isAvailable: () => true,
  fetchDraws: async (lotteryId, limit) => {
    const result = await LotteryService.fetchDraws(lotteryId, limit);
    return result.draws;
  }
};

export const LocalCacheProvider: DataProviderSource = {
  origin: "cache",
  name: "Cache Local (IndexedDB)",
  isAvailable: () => typeof window !== "undefined" && !!window.localStorage,
  fetchDraws: async (lotteryId, limit) => {
    const cached = localStorage.getItem(`draws_cache_${lotteryId}`);
    if (cached) {
      const allDraws = JSON.parse(cached) as DrawResult[];
      return allDraws.slice(0, limit);
    }
    return [];
  }
};

export const MockProvider: DataProviderSource = {
  origin: "mock",
  name: "Dados Simulados (Monte Carlo)",
  isAvailable: () => true,
  fetchDraws: async (lotteryId, limit = 50) => {
    const mockDraws: DrawResult[] = [];
    const now = new Date();
    // Deterministic mock generation based on index to keep results stable
    // Use a fixed seed-like pattern for Monte Carlo sanity
    for (let i = 0; i < (limit || 50); i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Simulação estatística uniforme para baseline (Regra 7)
      const numbers: number[] = [];
      const universeSize = lotteryId === "lotofacil" ? 25 : lotteryId === "megasena" ? 60 : 80;
      const pickSize = lotteryId === "lotofacil" ? 15 : lotteryId === "megasena" ? 6 : 5;
      
      while (numbers.length < pickSize) {
        const n = ((i * 7 + numbers.length * 13) % universeSize) + 1;
        if (!numbers.includes(n)) numbers.push(n);
      }
      
      mockDraws.push({
        concurso: 3000 - i,
        date: date.toISOString(),
        numbers: numbers.sort((a,b) => a-b)
      });
    }
    return mockDraws;
  }
};

export const ImportProvider: DataProviderSource = {
  origin: "import",
  name: "Importação Manual (CSV/JSON)",
  isAvailable: () => true,
  fetchDraws: async (lotteryId) => {
    const imported = sessionStorage.getItem(`imported_draws_${lotteryId}`);
    return imported ? JSON.parse(imported) : [];
  }
};
