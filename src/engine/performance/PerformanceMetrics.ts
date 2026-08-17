import { BacktestResult } from "@/engine/strategy-lab/backtest-engine";

export interface PortfolioMetrics {
  totalROI: number;
  netProfit: number;
  maxDrawdown: number;
  recoveryFactor: number;
  profitFactor: number;
  kellyCriterion: number;
}

/**
 * Motor de métricas de performance quantitativa.
 */
export class PerformanceMetrics {
  static calculatePortfolio(results: BacktestResult[]): PortfolioMetrics {
    let totalSpent = 0;
    let totalWon = 0;
    let maxDD = 0;
    
    results.forEach(res => {
      totalSpent += res.metrics.totalSpent;
      totalWon += res.metrics.totalWon;
      maxDD = Math.max(maxDD, res.metrics.drawdown);
    });

    const netProfit = totalWon - totalSpent;
    const totalROI = totalSpent > 0 ? netProfit / totalSpent : 0;
    
    // Profit Factor: Total Ganhos / Total Gastos (Baseline > 1.0)
    const profitFactor = totalSpent > 0 ? totalWon / totalSpent : 0;
    
    // Recovery Factor: Lucro Líquido / Drawdown Máximo
    const recoveryFactor = maxDD > 0 ? netProfit / (maxDD * 100) : 0;

    // Kelly Criterion simplificado para gestão de banca
    // K = (p * b - q) / b
    // Onde p = winRate, b = odds - 1 (aqui usamos ROI médio como proxy de edge)
    const avgWinRate = results.reduce((a, b) => a + b.metrics.winRate, 0) / results.length / 100;
    const kelly = totalROI > 0 ? (avgWinRate * (1 + totalROI) - 1) / totalROI : 0;

    return {
      totalROI,
      netProfit,
      maxDrawdown: maxDD,
      recoveryFactor,
      profitFactor,
      kellyCriterion: Math.max(0, kelly)
    };
  }
}
