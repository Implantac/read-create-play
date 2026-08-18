import { DataProviderSource, DataOrigin } from "./DataProvider";
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
    // Basic mock generator for testing UI/Backtests without network
    const mockDraws: DrawResult[] = [];
    const now = new Date();
    for (let i = 0; i < limit; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i * 3);
      mockDraws.push({
        concurso: 2000 - i,
        date: date.toISOString(),
        numbers: Array.from({ length: 15 }, (_, j) => (j + i) % 25 + 1).sort((a,b) => a-b)
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
