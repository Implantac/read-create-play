export interface BankrollStats {
  initial: number;
  current: number;
  totalInvested: number;
  totalWon: number;
  roi: number;
  drawdown: number;
}

export class BankrollManager {
  private stats: BankrollStats;

  constructor(initial: number) {
    this.stats = {
      initial,
      current: initial,
      totalInvested: 0,
      totalWon: 0,
      roi: 0,
      drawdown: 0
    };
  }

  recordBet(cost: number, winnings: number) {
    this.stats.totalInvested += cost;
    this.stats.totalWon += winnings;
    this.stats.current = this.stats.initial - this.stats.totalInvested + this.stats.totalWon;
    this.stats.roi = (this.stats.totalWon - this.stats.totalInvested) / (this.stats.totalInvested || 1);
  }

  getStats() { return { ...this.stats }; }
}
