import { DrawResult, LotteryConfig } from "@/data/lotteries";

/**
 * Motor Quantitativo Especializado para Mega-Sena.
 */
export class MegaSenaEngine {
  static validateIntegrity(game: number[]): boolean {
    if (game.length < 6 || game.length > 15) return false;
    const sum = game.reduce((a, b) => a + b, 0);
    if (sum < 50 || sum > 320) return false;
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
    if (sum < 40 || sum > 380) return false;
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
 * Inclui suporte nativo ao conceito de jogo espelho (Regra 17).
 */
export class LotomaniaEngine {
  static validateIntegrity(game: number[]): boolean {
    if (game.length !== 50) return false;
    return true;
  }
  
  static getMirror(game: number[]): number[] {
    const gameSet = new Set(game);
    const mirror: number[] = [];
    // Lotomania: 00 a 99 (representado como 1-100 ou 0-99 conforme o sistema)
    // Aqui assumimos 0-99 para facilitar o espelho puro.
    for (let i = 0; i < 100; i++) {
      if (!gameSet.has(i)) mirror.push(i);
    }
    return mirror;
  }
}

/**
 * Motor Quantitativo Especializado para Dupla Sena.
 * Considera os dois sorteios como eventos independentes (Regra 18).
 */
export class DuplaSenaEngine {
  static validateIntegrity(game: number[]): boolean {
    return game.length >= 6 && game.length <= 15;
  }

  /** Analisa performance comparativa entre sorteio 1 e 2 */
  static compareSorteios(game: number[], s1: number[], s2: number[]) {
    const hits1 = game.filter(n => s1.includes(n)).length;
    const hits2 = game.filter(n => s2.includes(n)).length;
    return { hits1, hits2, combined: hits1 + hits2 };
  }
}

/**
 * Motor Quantitativo Especializado para Timemania.
 * Separa dezenas de "Time do Coração" (Regra 19).
 */
export class TimemaniaEngine {
  static validateIntegrity(game: number[]): boolean {
    return game.length === 10;
  }

  /** O Time do Coração deve ser tratado como variável independente */
  static analyzeWithTeam(game: number[], teamId: number, draw: number[], winningTeamId: number) {
    const hits = game.filter(n => draw.includes(n)).length;
    const teamHit = teamId === winningTeamId;
    return { hits, teamHit };
  }
}

/**
 * Motor Quantitativo Especializado para Dia de Sorte.
 * Separa dezenas de "Mês da Sorte" (Regra 20).
 */
export class DiaDeSorteEngine {
  static validateIntegrity(game: number[]): boolean {
    return game.length >= 7 && game.length <= 15;
  }
}

/**
 * Motor Quantitativo Especializado para Super Sete.
 * Engine completamente independente para 7 colunas (Regra 21).
 */
export class SuperSeteEngine {
  // 7 colunas (0-9)
  static validateIntegrity(game: number[]): boolean {
    return game.length === 7;
  }

  /** Super Sete não é uma escolha de N entre M, mas uma escolha de 1 em 7 colunas de 10 */
  static analyzePositional(game: number[], draw: number[]) {
    const hits = game.filter((n, i) => n === draw[i]).length;
    return { hits };
  }
}
