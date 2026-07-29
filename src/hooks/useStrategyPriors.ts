/**
 * useStrategyPriors — priors Bayesianos por estratégia persistidos em localStorage.
 *
 * Cada estratégia é modelada como uma Beta(α, β) de "probabilidade de gerar um
 * jogo premiado" contra um threshold configurável (padrão: metade + 1 do pick).
 * Chamar `record(hits, threshold)` atualiza o posterior de forma conjugada.
 */
import { useCallback, useEffect, useState } from "react";
import {
  defaultPrior,
  updatePosterior,
  expectedValue,
  credibilityInterval,
  type StrategyPrior,
} from "@/ai/engines/bayesianStrategyEngine";

const STORAGE_KEY = "titan:strategy-priors:v1";

type Store = Record<string, StrategyPrior>;

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function saveStore(s: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota / private mode */
  }
}

export interface StrategyPriorView {
  prior: StrategyPrior;
  mean: number;
  ci: [number, number];
  trials: number;
  successes: number;
}

export function useStrategyPriors(strategyKey: string) {
  const [store, setStore] = useState<Store>(() => loadStore());

  useEffect(() => {
    saveStore(store);
  }, [store]);

  const prior = store[strategyKey] ?? defaultPrior(strategyKey);

  const view: StrategyPriorView = {
    prior,
    mean: expectedValue(prior),
    ci: credibilityInterval(prior),
    // α,β começam em 1 (Laplace) → subtraímos p/ contagem "real".
    successes: Math.max(0, prior.alpha - 1),
    trials: Math.max(0, prior.alpha + prior.beta - 2),
  };

  const record = useCallback(
    (hits: number, threshold: number) => {
      setStore((prev) => {
        const current = prev[strategyKey] ?? defaultPrior(strategyKey);
        return { ...prev, [strategyKey]: updatePosterior(current, hits, threshold) };
      });
    },
    [strategyKey],
  );

  const reset = useCallback(() => {
    setStore((prev) => {
      const next = { ...prev };
      delete next[strategyKey];
      return next;
    });
  }, [strategyKey]);

  return { view, record, reset };
}
