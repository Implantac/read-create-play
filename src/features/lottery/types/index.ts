export interface LotteryConfig {
  id: string;
  name: string;
  numbers: number;
  pick: number;
  color: string;
  icon: string;
}

export interface DrawResult {
  concurso: number;
  date: string;
  numbers: number[];
}

export interface PrizeTierInfo {
  descricao: string;
  faixa: number;
  ganhadores: number;
  valorPremio: number;
}

export interface DrawPrizeData {
  premiacoes: PrizeTierInfo[];
  acumulou: boolean;
  valorAcumulado: number;
  valorEstimado: number;
  valorArrecadado: number;
}

export interface DrawResultWithPrizes extends DrawResult {
  prizeTiers?: DrawPrizeData | null;
}
