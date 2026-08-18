import { DrawResult, LotteryConfig } from "@/data/lotteries";

/**
 * Motor Quantitativo Especializado para Mega-Sena.
 */
export class MegaSenaEngine {
  static validateIntegrity(game: number[]): boolean {
    if (game.length < 6 || game.length > 15) return false;
    const sum = game.reduce((a, b) => a + b, 0);
    // Mega-Sena range 1-60. 6 numbers.
    // Min sum: 1+2+3+4+5+6 = 21. Max: 55+56+57+58+59+60 = 345.
    if (sum < 21 || sum > 345) return false;
    return true;
  }

  static analyze(game: number[]) {
    const evens = game.filter(n => n % 2 === 0).length;
    const sum = game.reduce((a, b) => a + b, 0);
    const lowCount = game.filter(n => n <= 30).length;
    const highCount = game.length - lowCount;

    // Quadrantes (Mega-Sena: 60 números, 6x10 grid)
    const quadrants = [0, 0, 0, 0];
    game.forEach(n => {
      const row = Math.floor((n - 1) / 10);
      const col = (n - 1) % 10;
      if (row < 3 && col < 5) quadrants[0]++;
      else if (row < 3 && col >= 5) quadrants[1]++;
      else if (row >= 3 && col < 5) quadrants[2]++;
      else if (row >= 3 && col >= 5) quadrants[3]++;
    });

    return {
      parity: `${game.length - evens}I:${evens}P`,
      sum,
      highLow: `${lowCount}B:${highCount}A`,
      quadrants
    };
  }
}

/**
 * Motor Quantitativo Especializado para Quina.
 */
export class QuinaEngine {
  static validateIntegrity(game: number[]): boolean {
    if (game.length < 5 || game.length > 15) return false;
    const sum = game.reduce((a, b) => a + b, 0);
    // Quina 1-80. Min: 1+2+3+4+5 = 15. Max: 76+77+78+79+80 = 390.
    if (sum < 15 || sum > 390) return false;
    return true;
  }

  static analyze(game: number[]) {
    const evens = game.filter(n => n % 2 === 0).length;
    const sum = game.reduce((a, b) => a + b, 0);
    
    // Quadrantes (Quina: 80 números, 8x10 grid)
    const quadrants = [0, 0, 0, 0];
    game.forEach(n => {
      const row = Math.floor((n - 1) / 10);
      const col = (n - 1) % 10;
      if (row < 4 && col < 5) quadrants[0]++;
      else if (row < 4 && col >= 5) quadrants[1]++;
      else if (row >= 4 && col < 5) quadrants[2]++;
      else if (row >= 4 && col >= 5) quadrants[3]++;
    });

    return {
      parity: `${game.length - evens}I:${evens}P`,
      sum,
      quadrants
    };
  }
}

/**
 * Motor Quantitativo Especializado para Lotomania.
 */
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

  static analyze(game: number[]) {
    const evens = game.filter(n => n % 2 === 0).length;
    const sum = game.reduce((a, b) => a + b, 0);
    return { parity: `${50 - evens}I:${evens}P`, sum };
  }
}

/**
 * Motor Quantitativo Especializado para Dupla Sena.
 */
export class DuplaSenaEngine {
  static validateIntegrity(game: number[]): boolean {
    return game.length >= 6 && game.length <= 15;
  }

  static compareSorteios(game: number[], s1: number[], s2: number[]) {
    const hits1 = game.filter(n => s1.includes(n)).length;
    const hits2 = game.filter(n => s2.includes(n)).length;
    return { hits1, hits2, combined: hits1 + hits2 };
  }
}

/**
 * Motor Quantitativo Especializado para Timemania.
 */
export class TimemaniaEngine {
  static validateIntegrity(game: number[]): boolean {
    return game.length === 10;
  }

  static analyzeWithTeam(game: number[], teamId: number, draw: number[], winningTeamId: number) {
    const hits = game.filter(n => draw.includes(n)).length;
    const teamHit = teamId === winningTeamId;
    return { hits, teamHit };
  }
}

/**
 * Motor Quantitativo Especializado para Dia de Sorte.
 */
export class DiaDeSorteEngine {
  static validateIntegrity(game: number[]): boolean {
    return game.length >= 7 && game.length <= 15;
  }
}

/**
 * Motor Quantitativo Especializado para Super Sete.
 */
export class SuperSeteEngine {
  static validateIntegrity(game: number[]): boolean {
    return game.length === 7;
  }

  static analyzePositional(game: number[], draw: number[]) {
    const hits = game.filter((n, i) => n === draw[i]).length;
    return { hits };
  }
}
