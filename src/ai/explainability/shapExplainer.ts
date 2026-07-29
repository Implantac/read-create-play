/**
 * SHAP-style Explainer para Titan Score
 * -----------------------------------------------------------------------------
 * Full Shapley requires 2^N evaluations. Como o Titan Score é uma soma
 * ponderada linear de features (frame, repeat, sum, parity, entropy, χ², etc.),
 * podemos usar a **decomposição aditiva exata**: a contribuição de cada
 * feature é `weight_i · (feature_i - baseline_i)`.
 *
 * Isso é matematicamente idêntico ao SHAP para modelos aditivos lineares
 * (KernelSHAP degenera para essa forma quando f é linear).
 *
 * Uso:
 *   explainScore({
 *     features: { frame: 0.85, repeat: 0.72, sum: 0.90, ... },
 *     weights:  { frame: 0.20, repeat: 0.15, sum: 0.10, ... },
 *     baselines:{ frame: 0.50, repeat: 0.50, sum: 0.50, ... },
 *   })
 *   → [{ feature: 'sum', contribution: +0.040, direction: 'positive' }, ...]
 */

export interface ShapInput {
  features: Record<string, number>;   // 0..1 typically
  weights: Record<string, number>;    // soma deve ser ~1
  baselines?: Record<string, number>; // default 0.5 (jogo aleatório)
}

export interface ShapContribution {
  feature: string;
  value: number;
  weight: number;
  baseline: number;
  contribution: number;    // + ou -; soma total = score - base_score
  direction: "positive" | "negative" | "neutral";
  pctOfTotal: number;      // |contribution| / Σ|contributions|
}

export interface ShapExplanation {
  baseScore: number;
  finalScore: number;
  delta: number;
  contributions: ShapContribution[];
  topPositive: ShapContribution[];
  topNegative: ShapContribution[];
}

export function explainScore(input: ShapInput): ShapExplanation {
  const { features, weights } = input;
  const baselines = input.baselines ?? {};

  let baseScore = 0;
  let finalScore = 0;

  const raw: ShapContribution[] = [];
  for (const key of Object.keys(features)) {
    const value = features[key];
    const weight = weights[key] ?? 0;
    const baseline = baselines[key] ?? 0.5;
    if (weight === 0) continue;
    const contribution = weight * (value - baseline);
    baseScore += weight * baseline;
    finalScore += weight * value;
    raw.push({
      feature: key,
      value,
      weight,
      baseline,
      contribution,
      direction:
        Math.abs(contribution) < 1e-4
          ? "neutral"
          : contribution > 0
            ? "positive"
            : "negative",
      pctOfTotal: 0,
    });
  }

  const totalAbs = raw.reduce((s, c) => s + Math.abs(c.contribution), 0) || 1;
  const contributions = raw
    .map((c) => ({ ...c, pctOfTotal: Math.abs(c.contribution) / totalAbs }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const topPositive = contributions
    .filter((c) => c.direction === "positive")
    .slice(0, 5);
  const topNegative = contributions
    .filter((c) => c.direction === "negative")
    .slice(0, 5);

  return {
    baseScore,
    finalScore,
    delta: finalScore - baseScore,
    contributions,
    topPositive,
    topNegative,
  };
}

/** Formata explicação em Markdown para uso no chat/UI */
export function explanationToMarkdown(exp: ShapExplanation): string {
  const lines: string[] = [];
  lines.push(`**Score base (aleatório):** ${(exp.baseScore * 100).toFixed(1)}`);
  lines.push(`**Score final:** ${(exp.finalScore * 100).toFixed(1)}`);
  lines.push(`**Ganho sobre baseline:** ${(exp.delta * 100).toFixed(1)} pts`);
  lines.push("");
  if (exp.topPositive.length > 0) {
    lines.push("**🟢 Fatores que elevaram o score:**");
    for (const c of exp.topPositive) {
      lines.push(
        `- \`${c.feature}\` +${(c.contribution * 100).toFixed(1)} pts (${(c.pctOfTotal * 100).toFixed(0)}% do impacto)`,
      );
    }
    lines.push("");
  }
  if (exp.topNegative.length > 0) {
    lines.push("**🔴 Fatores que puxaram para baixo:**");
    for (const c of exp.topNegative) {
      lines.push(
        `- \`${c.feature}\` ${(c.contribution * 100).toFixed(1)} pts (${(c.pctOfTotal * 100).toFixed(0)}% do impacto)`,
      );
    }
  }
  return lines.join("\n");
}
