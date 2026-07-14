/**
 * GeneticOptimizer — algoritmo genético para set-cover de fechamentos.
 * Cada indivíduo = conjunto de jogos. Evolução via crossover + mutação.
 */

import { greedyCover } from "./GreedyOptimizer";
import {
  makeContext, coveragePct, pruneRedundant, fitness, randomGame,
  type CoverContext,
} from "../core/CoverEval";

export interface GAOptions {
  maxGames?: number;
  populationSize?: number;
  generations?: number;
  mutationRate?: number;
  elitism?: number;
  seedGames?: number[][];
}

export interface GAOutput {
  games: number[][];
  generations: number;
  bestFitness: number;
  finalCoverage: number;
  history: { gen: number; best: number; avg: number }[];
}

function crossover(a: number[][], b: number[][]): number[][] {
  const size = Math.max(a.length, b.length);
  const child: number[][] = [];
  for (let i = 0; i < size; i++) {
    const src = Math.random() < 0.5 ? a : b;
    if (src[i]) child.push(src[i]);
  }
  return child;
}

function mutate(games: number[][], ctx: CoverContext, rate: number): number[][] {
  return games.map(g => {
    if (Math.random() < rate) return randomGame(ctx.baseSize, ctx.pick);
    return g;
  });
}

export function runGeneticAlgorithm(
  baseSize: number, pick: number, m: number, opts: GAOptions = {},
): GAOutput {
  const ctx = makeContext(baseSize, pick, m);
  const popSize = opts.populationSize ?? 20;
  const generations = opts.generations ?? 60;
  const mutationRate = opts.mutationRate ?? 0.15;
  const elitism = opts.elitism ?? 2;

  const seed = opts.seedGames
    ?? greedyCover(baseSize, pick, m, { maxGames: opts.maxGames }).games;
  const target = seed.length;

  // População inicial: mutações do seed
  let population: number[][][] = [seed];
  while (population.length < popSize) {
    population.push(mutate(seed, ctx, 0.3));
  }

  const history: GAOutput["history"] = [];
  let best = seed;
  let bestFit = fitness(seed, ctx, target);

  for (let gen = 0; gen < generations; gen++) {
    const scored = population.map(ind => ({ ind, fit: fitness(ind, ctx, target) }));
    scored.sort((a, b) => b.fit - a.fit);

    if (scored[0].fit > bestFit) {
      best = scored[0].ind;
      bestFit = scored[0].fit;
    }

    const avg = scored.reduce((s, x) => s + x.fit, 0) / scored.length;
    history.push({ gen, best: bestFit, avg });

    // Nova geração: elitismo + descendentes
    const next: number[][][] = scored.slice(0, elitism).map(s => s.ind);
    while (next.length < popSize) {
      const p1 = tournamentPick(scored);
      const p2 = tournamentPick(scored);
      let child = crossover(p1, p2);
      child = mutate(child, ctx, mutationRate);
      if (child.length === 0) child = [randomGame(baseSize, pick)];
      next.push(child);
    }
    population = next;
  }

  best = pruneRedundant(best, ctx);

  return {
    games: best,
    generations,
    bestFitness: bestFit,
    finalCoverage: coveragePct(best, ctx),
    history,
  };
}

function tournamentPick(scored: { ind: number[][]; fit: number }[]): number[][] {
  const k = 3;
  let best = scored[Math.floor(Math.random() * scored.length)];
  for (let i = 1; i < k; i++) {
    const c = scored[Math.floor(Math.random() * scored.length)];
    if (c.fit > best.fit) best = c;
  }
  return best.ind;
}
