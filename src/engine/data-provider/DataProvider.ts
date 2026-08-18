import { DrawResult } from "@/data/lotteries";

export type DataOrigin = "official" | "cache" | "import" | "mock";

export interface DataProviderSource {
  origin: DataOrigin;
  name: string;
  fetchDraws: (lotteryId: string, limit?: number) => Promise<DrawResult[]>;
  isAvailable: () => boolean;
}

export class DataProvider {
  private static sources: DataProviderSource[] = [];
  private static activeOrigin: DataOrigin = "official";

  static register(source: DataProviderSource) {
    this.sources.push(source);
  }

  static setActiveOrigin(origin: DataOrigin) {
    this.activeOrigin = origin;
  }

  static getActiveOrigin(): DataOrigin {
    return this.activeOrigin;
  }

  static async fetchDraws(lotteryId: string, limit: number = 50): Promise<{ draws: DrawResult[], origin: DataOrigin }> {
    const source = this.sources.find(s => s.origin === this.activeOrigin && s.isAvailable()) 
                || this.sources.find(s => s.origin === "official");
    
    if (!source) {
      throw new Error("Nenhum provedor de dados disponível.");
    }

    const draws = await source.fetchDraws(lotteryId, limit);
    return { draws, origin: source.origin };
  }
}
