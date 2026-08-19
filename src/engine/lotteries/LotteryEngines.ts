import { DrawResult, LotteryConfig } from "@/data/lotteries";

/**
 * Motor Quantitativo Especializado para Mega-Sena.
 */
export class MegaSenaEngine {
  static validateIntegrity(game: number[]): boolean {
    if (game.length < 6 || game.length > 20) return false;
    const sum = game.reduce((a, b) => a + b, 0);
    // Mega-Sena range 1-60. 6-20 numbers.
    if (sum < 21 || sum > 1000) return false;
    const evens = game.filter(n => n % 2 === 0).length;
    if (evens < 1 || evens > game.length - 1) return false; // Evita all-even/all-odd extremo
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
    // Quina 1-80. Min: 15. Max sum for 15 numbers: 1100.
    if (sum < 15 || sum > 1100) return false;
    const evens = game.filter(n => n % 2 === 0).length;
    if (evens < 1 || evens > game.length - 1) return false;
    return true;
  }

  static analyze(game: number[]) {
    const evens = game.filter(n => n % 2 === 0).length;
    const sum = game.reduce((a, b) => a + b, 0);
    return { parity: `${game.length - evens}I:${evens}P`, sum };
  }
}

/**
 * Motor Quantitativo Especializado para Lotomania.
 */
export class LotomaniaEngine {
  static validateIntegrity(game: number[]): boolean {
    return game.length === 50;
  }

  static analyze(game: number[]) {
    const evens = game.filter(n => n % 2 === 0).length;
    const sum = game.reduce((a, b) => a + b, 0);
    return { parity: `${50 - evens}I:${evens}P`, sum };
  }
}

/**
 * Motor Quantitativo Especializado para Timemania.
 */
export class TimemaniaEngine {
  static validateIntegrity(game: number[]): boolean {
    return game.length === 10;
  }

  static analyze(game: number[]) {
    const evens = game.filter(n => n % 2 === 0).length;
    const sum = game.reduce((a, b) => a + b, 0);
    return { parity: `${10 - evens}I:${evens}P`, sum };
  }
}

/**
 * Motor Quantitativo Especializado para Dia de Sorte.
 */
export class DiaDeSorteEngine {
  static validateIntegrity(game: number[]): boolean {
    if (game.length < 7 || game.length > 15) return false;
    const sum = game.reduce((a, b) => a + b, 0);
    if (sum < 28 || sum > 450) return false;
    return true;
  }

  static analyze(game: number[]) {
    const evens = game.filter(n => n % 2 === 0).length;
    const sum = game.reduce((a, b) => a + b, 0);
    return { parity: `${game.length - evens}I:${evens}P`, sum };
  }
}

/**
 * Motor Quantitativo Especializado para Dupla Sena.
 * Regras: 50 números no universo (1-50), aposta de 6 a 15 dezenas.
 */
export class DuplaSenaEngine {
  static validateIntegrity(game: number[]): boolean {
    if (game.length < 6 || game.length > 15) return false;
    const sum = game.reduce((a, b) => a + b, 0);
    if (sum < 21 || sum > 650) return false;
    return true;
  }

  static analyze(game: number[]) {
    const evens = game.filter(n => n % 2 === 0).length;
    const sum = game.reduce((a, b) => a + b, 0);
    return { parity: `${game.length - evens}I:${evens}P`, sum };
  }
}

/**
 * Motor Quantitativo Especializado para Super Sete.
 */
export class SuperSeteEngine {
  static validateIntegrity(game: number[]): boolean {
    // Super Sete: 1 número por coluna (0-9) em 7 colunas.
    // Representamos como [c1, c2, c3, c4, c5, c6, c7] cada de 0-9.
    return game.length === 7 && game.every(n => n >= 0 && n <= 9);
  }

  static analyze(game: number[]) {
    const sum = game.reduce((a, b) => a + b, 0);
    return { sum };
  }
}
