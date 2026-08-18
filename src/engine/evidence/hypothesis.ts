import { LotteryConfig } from "@/data/lotteries";

export interface Hypothesis {
  id: string;
  hypothesis: string;
  lottery: string;
  metric: "lift" | "precision" | "roi";
  nullHypothesis: number;
}

export class EvidenceHypothesis {
  constructor(private data: Hypothesis) {}

  getId() { return this.data.id; }
  getHypothesis() { return this.data.hypothesis; }
  
  validate(observedValue: number): boolean {
    return observedValue > this.data.nullHypothesis;
  }
}
