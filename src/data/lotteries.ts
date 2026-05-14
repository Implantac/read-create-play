export interface PrizeTier {
  hits: number;
  label: string;
  probability?: number;
  avgValue?: number;
}

export interface LotteryConfig {
  id: string;
  name: string;
  numbers: number;
  pick: number;
  color: string;
  icon: string;
  betPrice: number;
  prizeTiers: PrizeTier[];
}

export const LOTTERIES: LotteryConfig[] = [
  { 
    id: "megasena", 
    name: "Mega Sena", 
    numbers: 60, 
    pick: 6, 
    color: "neon-green", 
    icon: "🍀",
    betPrice: 5.00,
    prizeTiers: [
      { hits: 6, label: "Sena" },
      { hits: 5, label: "Quina" },
      { hits: 4, label: "Quadra" }
    ]
  },
  { 
    id: "lotofacil", 
    name: "Lotofácil", 
    numbers: 25, 
    pick: 15, 
    color: "neon-blue", 
    icon: "🎯",
    betPrice: 3.00,
    prizeTiers: [
      { hits: 15, label: "15 Acertos" },
      { hits: 14, label: "14 Acertos" },
      { hits: 13, label: "13 Acertos" },
      { hits: 12, label: "12 Acertos" },
      { hits: 11, label: "11 Acertos" }
    ]
  },
  { 
    id: "quina", 
    name: "Quina", 
    numbers: 80, 
    pick: 5, 
    color: "neon-purple", 
    icon: "⭐",
    betPrice: 2.50,
    prizeTiers: [
      { hits: 5, label: "Quina" },
      { hits: 4, label: "Quadra" },
      { hits: 3, label: "Terno" },
      { hits: 2, label: "Duque" }
    ]
  },
  { 
    id: "lotomania", 
    name: "Lotomania", 
    numbers: 100, 
    pick: 50, 
    color: "neon-amber", 
    icon: "🔥",
    betPrice: 3.00,
    prizeTiers: [
      { hits: 20, label: "20 Acertos" },
      { hits: 19, label: "19 Acertos" },
      { hits: 18, label: "18 Acertos" },
      { hits: 17, label: "17 Acertos" },
      { hits: 16, label: "16 Acertos" },
      { hits: 15, label: "15 Acertos" },
      { hits: 0, label: "Zero Acertos" }
    ]
  },
  { 
    id: "duplasena", 
    name: "Dupla Sena", 
    numbers: 50, 
    pick: 6, 
    color: "neon-red", 
    icon: "🎲",
    betPrice: 2.50,
    prizeTiers: [
      { hits: 6, label: "Sena" },
      { hits: 5, label: "Quina" },
      { hits: 4, label: "Quadra" },
      { hits: 3, label: "Terno" }
    ]
  },
  { 
    id: "timemania", 
    name: "Timemania", 
    numbers: 80, 
    pick: 10, 
    color: "neon-green", 
    icon: "⚽",
    betPrice: 3.50,
    prizeTiers: [
      { hits: 7, label: "7 Acertos" },
      { hits: 6, label: "6 Acertos" },
      { hits: 5, label: "5 Acertos" },
      { hits: 4, label: "4 Acertos" },
      { hits: 3, label: "3 Acertos" }
    ]
  },
  { 
    id: "diadesorte", 
    name: "Dia de Sorte", 
    numbers: 31, 
    pick: 7, 
    color: "neon-blue", 
    icon: "☀️",
    betPrice: 2.50,
    prizeTiers: [
      { hits: 7, label: "7 Acertos" },
      { hits: 6, label: "6 Acertos" },
      { hits: 5, label: "5 Acertos" },
      { hits: 4, label: "4 Acertos" }
    ]
  },
  { 
    id: "supersete", 
    name: "Super Sete", 
    numbers: 10, 
    pick: 7, 
    color: "neon-amber", 
    icon: "7️⃣",
    betPrice: 2.50,
    prizeTiers: [
      { hits: 7, label: "7 Acertos" },
      { hits: 6, label: "6 Acertos" },
      { hits: 5, label: "5 Acertos" },
      { hits: 4, label: "4 Acertos" },
      { hits: 3, label: "3 Acertos" }
    ]
  },
  { 
    id: "maismilionaria", 
    name: "+Milionária", 
    numbers: 50, 
    pick: 6, 
    color: "neon-gold", 
    icon: "💎",
    betPrice: 6.00,
    prizeTiers: [
      { hits: 6, label: "6 Acertos + 2 Trevos" },
      { hits: 5, label: "5 Acertos + 2 Trevos" },
      { hits: 4, label: "4 Acertos + 2 Trevos" }
    ]
  },
];

export interface DrawResult {
  concurso: number;
  date: string;
  numbers: number[];
  secondDrawNumbers?: number[];
}

