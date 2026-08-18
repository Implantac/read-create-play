import { DrawResult, LotteryConfig } from "@/data/lotteries";

export class MegaSenaEngine {
  static validateIntegrity(game: number[]): boolean {
    if (game.length !== 6) return false;
    const sum = game.reduce((a, b) => a + b, 0);
    if (sum < 50 || sum > 320) return false;
    return true;
  }
}

export class QuinaEngine {
  static validateIntegrity(game: number[]): boolean {
    if (game.length !== 5) return false;
    const sum = game.reduce((a, b) => a + b, 0);
    if (sum < 40 || sum > 380) return false;
    return true;
  }
}

export class LotomaniaEngine {
  static validateIntegrity(game: number[]): boolean {
    if (game.length !== 50) return false;
    return true;
  }
  
  static getMirror(game: number[]): number[] {
    const gameSet = new Set(game);
    const mirror: number[] = [];
    for (let i = 0; i < 100; i++) {
      if (!gameSet.has(i)) mirror.push(i);
    }
    return mirror;
  }
}

export class DuplaSenaEngine {
  // Dupla Sena tem dois sorteios independentes
}

export class SuperSeteEngine {
  // 7 colunas (0-9)
  static validateIntegrity(game: number[]): boolean {
    return game.length === 7;
  }
}
