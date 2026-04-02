import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface MarkedBet {
  numbers: number[];
  label: string;
}

interface SelectedBetsContextType {
  markedBets: MarkedBet[];
  toggleBet: (bet: MarkedBet) => void;
  clearMarked: () => void;
  isBetMarked: (numbers: number[]) => boolean;
  checkResults: BulkCheckResult[] | null;
  setCheckResults: (results: BulkCheckResult[] | null) => void;
}

export interface BulkCheckResult {
  numbers: number[];
  label: string;
  draws: { concurso: number; date: string; hits: number; matched: number[] }[];
  avgHits: number;
  bestHit: number;
  prizeHits: number;
}

const SelectedBetsContext = createContext<SelectedBetsContextType | null>(null);

export function SelectedBetsProvider({ children }: { children: ReactNode }) {
  const [markedBets, setMarkedBets] = useState<MarkedBet[]>([]);
  const [checkResults, setCheckResults] = useState<BulkCheckResult[] | null>(null);

  const toggleBet = useCallback((bet: MarkedBet) => {
    setMarkedBets(prev => {
      const key = bet.numbers.join(",");
      const exists = prev.some(b => b.numbers.join(",") === key);
      if (exists) return prev.filter(b => b.numbers.join(",") !== key);
      return [...prev, bet];
    });
    setCheckResults(null);
  }, []);

  const isBetMarked = useCallback((numbers: number[]) => {
    const key = numbers.join(",");
    return markedBets.some(b => b.numbers.join(",") === key);
  }, [markedBets]);

  const clearMarked = useCallback(() => {
    setMarkedBets([]);
    setCheckResults(null);
  }, []);

  return (
    <SelectedBetsContext.Provider value={{ markedBets, toggleBet, clearMarked, isBetMarked, checkResults, setCheckResults }}>
      {children}
    </SelectedBetsContext.Provider>
  );
}

export function useSelectedBets() {
  const ctx = useContext(SelectedBetsContext);
  if (!ctx) throw new Error("useSelectedBets must be within SelectedBetsProvider");
  return ctx;
}
