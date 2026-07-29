/**
 * Testes estatísticos formais para Lotofácil.
 *
 * Diferente das heurísticas lineares que dominam o resto do projeto
 * ("pressão", "trend score", "hot bias"), estas funções aplicam testes
 * matematicamente definidos com hipótese nula explícita, permitindo
 * separar sinal real de ruído combinatório.
 *
 * Nenhuma dependência externa (implementações fechadas para o range
 * pequeno da Lotofácil: 25 dezenas, 15 marcadas).
 */

import type { DrawResult } from "@/data/lotteries";

/**
 * Chi-quadrado da distribuição de dezenas por décadas para um jogo de 15.
 *
 * Décadas: 1-10 (10 dezenas), 11-20 (10), 21-25 (5).
 * Sob a hipótese nula (sorteio uniforme sem reposição de 15 em 25),
 * o valor esperado por década é 15 × (tamanho_década / 25).
 *
 * Retorna o estatístico χ² e um p-value aproximado (2 graus de liberdade).
 * χ² baixo ⇒ jogo estatisticamente "bem distribuído".
 * χ² alto ⇒ jogo concentrado em poucas décadas (aceitável se tese for cluster).
 */
export function chiSquareDecades(numbers: number[]): {
  chi2: number;
  pValue: number;
  observed: [number, number, number];
  expected: [number, number, number];
} {
  const pick = numbers.length || 15;
  const obs: [number, number, number] = [0, 0, 0];
  for (const n of numbers) {
    if (n <= 10) obs[0]++;
    else if (n <= 20) obs[1]++;
    else obs[2]++;
  }
  const exp: [number, number, number] = [
    pick * (10 / 25),
    pick * (10 / 25),
    pick * (5 / 25),
  ];
  let chi2 = 0;
  for (let i = 0; i < 3; i++) {
    const diff = obs[i] - exp[i];
    chi2 += (diff * diff) / exp[i];
  }
  // 2 graus de liberdade: p ≈ exp(-χ²/2) (fórmula exata p/ df=2)
  const pValue = Math.exp(-chi2 / 2);
  return { chi2, pValue, observed: obs, expected: exp };
}

/**
 * Z-score do atraso atual de uma dezena vs. distribuição geométrica esperada.
 *
 * Sob H0 (dezena com probabilidade p = pick/N de sair por sorteio, i.i.d.),
 * o atraso segue geométrica com média μ = 1/p e desvio σ = √((1-p)/p²).
 *
 * z = (delay - μ) / σ.
 * z > 2  ⇒ atraso estatisticamente anômalo (dezena vencida — pressão real).
 * |z| ≤ 1 ⇒ dezena dentro do ciclo esperado.
 * z < -1 ⇒ dezena saiu recentemente com frequência acima do esperado.
 */
export function delayZScore(
  delay: number,
  pick: number = 15,
  totalNumbers: number = 25,
): { z: number; expected: number; sigma: number } {
  const p = pick / totalNumbers;
  const mu = 1 / p;
  const sigma = Math.sqrt((1 - p) / (p * p));
  const z = (delay - mu) / sigma;
  return { z, expected: mu, sigma };
}

/**
 * Composto de anomalias: mede quantas dezenas do jogo estão em regiões
 * estatisticamente anômalas (z > 1.5 = "muito atrasada", z < -1.5 = "sobre-repetida").
 * Um jogo balanceado deve ter uma minoria de anômalas.
 */
export function anomalyProfile(
  numbers: number[],
  draws: DrawResult[],
  totalNumbers: number = 25,
  pick: number = 15,
): { overdue: number; hot: number; neutral: number; delays: Map<number, number> } {
  const delays = new Map<number, number>();
  for (const n of numbers) {
    let d = draws.length;
    for (let i = 0; i < draws.length; i++) {
      if (draws[i].numbers.includes(n)) {
        d = i;
        break;
      }
    }
    delays.set(n, d);
  }
  let overdue = 0;
  let hot = 0;
  let neutral = 0;
  for (const [, d] of delays) {
    const { z } = delayZScore(d, pick, totalNumbers);
    if (z > 1.5) overdue++;
    else if (z < -1.5) hot++;
    else neutral++;
  }
  return { overdue, hot, neutral, delays };
}

/**
 * Lift real de um par co-ocorrer no mesmo sorteio, com correção de
 * Bonferroni para as C(25,2)=300 hipóteses testadas simultaneamente.
 *
 * Sob H0 (independência), P(A,B|sorteio) = P(A)·P(B) ajustada para
 * amostragem sem reposição.
 */
export function pairLiftCorrected(
  a: number,
  b: number,
  draws: DrawResult[],
  totalNumbers: number = 25,
  pick: number = 15,
): { lift: number; significant: boolean; pValue: number } {
  if (draws.length === 0) return { lift: 1, significant: false, pValue: 1 };
  const N = draws.length;
  let jointCount = 0;
  let aCount = 0;
  let bCount = 0;
  for (const d of draws) {
    const set = new Set(d.numbers);
    const hasA = set.has(a);
    const hasB = set.has(b);
    if (hasA) aCount++;
    if (hasB) bCount++;
    if (hasA && hasB) jointCount++;
  }
  const pA = aCount / N;
  const pB = bCount / N;
  // P(A e B | um sorteio) sob independência com amostragem sem reposição:
  // pick/N * (pick-1)/(N-1) para dois específicos — mas simplificamos p/ pA*pB
  // (aproximação válida para totalNumbers>>pick, aceitável aqui).
  const expected = pA * pB * N;
  const lift = expected > 0 ? jointCount / expected : 1;
  // p-value aproximado por teste binomial (normalização):
  const sigma = Math.sqrt(expected * (1 - pA * pB));
  const z = sigma > 0 ? Math.abs(jointCount - expected) / sigma : 0;
  const pValue = 2 * (1 - normalCdf(z));
  // Bonferroni: 300 pares testados
  const numPairs = (totalNumbers * (totalNumbers - 1)) / 2;
  const significant = pValue < 0.05 / numPairs;
  void pick;
  return { lift, significant, pValue };
}

/**
 * CDF da normal padrão (aproximação Abramowitz & Stegun 26.2.17, erro < 7.5e-8).
 */
function normalCdf(z: number): number {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const abs = Math.abs(z);
  const t = 1 / (1 + p * abs);
  const pdf = Math.exp((-abs * abs) / 2) / Math.sqrt(2 * Math.PI);
  const cdf = 1 - pdf * (b1 * t + b2 * t * t + b3 * t ** 3 + b4 * t ** 4 + b5 * t ** 5);
  return z >= 0 ? cdf : 1 - cdf;
}
