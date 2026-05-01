/**
 * Native AI — Lottery Knowledge Base
 * Complete rules, odds, and parameters for all Brazilian lotteries
 */

import { LotteryRules } from "../core/aiTypes";

export const LOTTERY_RULES: Record<string, LotteryRules> = {
  lotofacil: {
    id: "lotofacil", name: "Lotofácil",
    totalNumbers: 25, pick: 15, minBet: 15, maxBet: 20,
    ticketPrice: 3.0,
    drawDays: ["segunda", "terça", "quarta", "quinta", "sexta", "sábado"],
    hasGrid: true, gridRows: 5, gridCols: 5,
    prizeTiers: [
      { hits: 15, description: "15 acertos" },
      { hits: 14, description: "14 acertos" },
      { hits: 13, description: "13 acertos" },
      { hits: 12, description: "12 acertos" },
      { hits: 11, description: "11 acertos" },
    ],
    odds: { 15: 3268760, 14: 21791, 13: 691, 12: 59, 11: 11 },
    idealSumRange: [170, 220],
    idealParityRange: [6, 9],
    idealFrameRange: [8, 11],
    avgRepeatFromPrevious: [7, 11],
    maxRecommendedSequence: 3,
  },
  megasena: {
    id: "megasena", name: "Mega-Sena",
    totalNumbers: 60, pick: 6, minBet: 6, maxBet: 20,
    ticketPrice: 5.0,
    drawDays: ["terça", "quinta", "sábado"],
    hasGrid: false, gridRows: 10, gridCols: 6,
    prizeTiers: [
      { hits: 6, description: "Sena" },
      { hits: 5, description: "Quina" },
      { hits: 4, description: "Quadra" },
    ],
    odds: { 6: 50063860, 5: 154518, 4: 2332 },
    idealSumRange: [140, 220],
    idealParityRange: [2, 4],
    avgRepeatFromPrevious: [1, 3],
    maxRecommendedSequence: 2,
  },
  quina: {
    id: "quina", name: "Quina",
    totalNumbers: 80, pick: 5, minBet: 5, maxBet: 15,
    ticketPrice: 2.5,
    drawDays: ["segunda", "terça", "quarta", "quinta", "sexta", "sábado"],
    hasGrid: false, gridRows: 8, gridCols: 10,
    prizeTiers: [
      { hits: 5, description: "Quina" },
      { hits: 4, description: "Quadra" },
      { hits: 3, description: "Terno" },
      { hits: 2, description: "Duque" },
    ],
    odds: { 5: 24040016, 4: 64106, 3: 866, 2: 36 },
    idealSumRange: [150, 250],
    idealParityRange: [2, 3],
    avgRepeatFromPrevious: [1, 3],
    maxRecommendedSequence: 2,
  },
  lotomania: {
    id: "lotomania", name: "Lotomania",
    totalNumbers: 100, pick: 50, minBet: 50, maxBet: 50,
    ticketPrice: 3.0,
    drawDays: ["terça", "sexta"],
    hasGrid: false, gridRows: 10, gridCols: 10,
    prizeTiers: [
      { hits: 20, description: "20 acertos" },
      { hits: 19, description: "19 acertos" },
      { hits: 18, description: "18 acertos" },
      { hits: 17, description: "17 acertos" },
      { hits: 16, description: "16 acertos" },
      { hits: 15, description: "15 acertos" },
      { hits: 0, description: "0 acertos" },
    ],
    odds: { 20: 11372635, 19: 568632, 18: 14421, 17: 459, 16: 29, 15: 5, 0: 11372635 },
    idealSumRange: [2350, 2650],
    idealParityRange: [23, 27],
    avgRepeatFromPrevious: [20, 30],
    maxRecommendedSequence: 5,
  },
  duplasena: {
    id: "duplasena", name: "Dupla Sena",
    totalNumbers: 50, pick: 6, minBet: 6, maxBet: 15,
    ticketPrice: 2.5,
    drawDays: ["terça", "quinta", "sábado"],
    hasGrid: false, gridRows: 5, gridCols: 10,
    prizeTiers: [
      { hits: 6, description: "Sena" },
      { hits: 5, description: "Quina" },
      { hits: 4, description: "Quadra" },
      { hits: 3, description: "Terno" },
    ],
    odds: { 6: 15890700, 5: 60192, 4: 1119, 3: 60 },
    idealSumRange: [120, 190],
    idealParityRange: [2, 4],
    avgRepeatFromPrevious: [1, 3],
    maxRecommendedSequence: 2,
  },
  timemania: {
    id: "timemania", name: "Timemania",
    totalNumbers: 80, pick: 10, minBet: 10, maxBet: 10,
    ticketPrice: 3.5,
    drawDays: ["terça", "quinta", "sábado"],
    hasGrid: false, gridRows: 8, gridCols: 10,
    prizeTiers: [
      { hits: 7, description: "7 acertos" },
      { hits: 6, description: "6 acertos" },
      { hits: 5, description: "5 acertos" },
      { hits: 4, description: "4 acertos" },
      { hits: 3, description: "3 acertos" },
    ],
    odds: { 7: 26978328, 6: 216000, 5: 8040, 4: 195, 3: 12 },
    idealSumRange: [350, 470],
    idealParityRange: [4, 6],
    avgRepeatFromPrevious: [2, 5],
    maxRecommendedSequence: 3,
  },
  diadesorte: {
    id: "diadesorte", name: "Dia de Sorte",
    totalNumbers: 31, pick: 7, minBet: 7, maxBet: 15,
    ticketPrice: 2.5,
    drawDays: ["terça", "quinta", "sábado"],
    hasGrid: false, gridRows: 4, gridCols: 8,
    prizeTiers: [
      { hits: 7, description: "7 acertos" },
      { hits: 6, description: "6 acertos" },
      { hits: 5, description: "5 acertos" },
      { hits: 4, description: "4 acertos" },
    ],
    odds: { 7: 2629575, 5: 2727, 4: 129, 6: 44066 },
    idealSumRange: [95, 135],
    idealParityRange: [3, 4],
    avgRepeatFromPrevious: [2, 4],
    maxRecommendedSequence: 2,
  },
  supersete: {
    id: "supersete", name: "Super Sete",
    totalNumbers: 10, pick: 7, minBet: 7, maxBet: 21,
    ticketPrice: 2.5,
    drawDays: ["segunda", "quarta", "sexta"],
    hasGrid: false, gridRows: 1, gridCols: 7,
    prizeTiers: [
      { hits: 7, description: "7 acertos" },
      { hits: 6, description: "6 acertos" },
      { hits: 5, description: "5 acertos" },
      { hits: 4, description: "4 acertos" },
      { hits: 3, description: "3 acertos" },
    ],
    odds: { 7: 10000000, 6: 46512, 5: 1107, 4: 72, 3: 9 },
    idealSumRange: [25, 40],
    idealParityRange: [3, 4],
    avgRepeatFromPrevious: [3, 5],
    maxRecommendedSequence: 2,
  },
};

export function getLotteryRules(lotteryId: string): LotteryRules {
  return LOTTERY_RULES[lotteryId] || LOTTERY_RULES.lotofacil;
}

/** Constantes Matemáticas para Filtros de Elite */
export const PRIMES = new Set([2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97]);
export const FIBONACCI = new Set([1,2,3,5,8,13,21,34,55,89]);
export const MERSENNE = new Set([3, 7, 31, 127]); 
export const PERFECT_SQUARES = new Set([1, 4, 9, 16, 25, 36, 49, 64, 81, 100]);

/** Lotofácil: Mapeamento de Topologia do Volante */
export const LOTOFACIL_FRAME = new Set([1,2,3,4,5,6,10,11,15,16,20,21,22,23,24,25]);
export const LOTOFACIL_CENTER = new Set([7,8,9,12,13,14,17,18,19]);
