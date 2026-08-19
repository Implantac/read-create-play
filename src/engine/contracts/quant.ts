/**
 * Quantitative Decision & Evidence Core Contracts
 * Unified interfaces for the Titan v7.5 Alpha Pipeline.
 */

export type EvidenceGrade = 'E0' | 'E1' | 'E2' | 'E3' | 'E4';

export interface EvidenceResult {
  metric: string;
  observed: number;
  baseline: number;
  effectSize: number;
  confidenceInterval: [number, number];
  pValue: number;
  sampleSize: number;
  method: string;
  conclusion: EvidenceGrade;
}

export interface ScenarioAnalysis {
  status: "favorable" | "neutral" | "unfavorable";
  confidence: number; // 0-100
  reasoning: string[];
}

export interface RobustnessReport {
  score: number; // 0-100
  stabilityIndex: number; // 0-1
  verdict: "robust" | "fragile" | "overfitted";
}

export interface DecisionVerdict {
  action: "APOSTAR" | "APOSTAR_REDUZIDO" | "OBSERVAR" | "NAO_APOSTAR";
  rationale: {
    positive: string[];
    negative: string[];
    conclusion: string;
  };
}

export interface QuantitativeDecisionResult {
  timestamp: number;
  lotteryId: string;
  dataQuality: {
    score: number;
    isValid: boolean;
  };
  evidence: EvidenceResult & { 
    grade: EvidenceGrade; 
    explanation: string;
    lift: number;
    zScore: number;
  };
  benchmark: {

    lift: number;
    zScore: number;
    pValue: number;
    advantage: number;
  };
  robustness: RobustnessReport;
  verdict: DecisionVerdict;
}

export interface Draw {
  id: string;
  lotteryId: string;
  numbers: number[];
  date: string;
  prizeTiers?: Record<string, number>;
}

