// Shared AI enhancement utilities: ensemble, chain-of-verification,
// citation validation, few-shot exemplars, structured stats helpers.
//
// Used by ai-pattern-analysis, ai-simulation-analysis, ai-massive-simulation.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ────────────────────────────────────────────────────────────────────────────
// FEW-SHOT (#7) — exemplo curto de análise "gold standard" para calibrar o tom
// ────────────────────────────────────────────────────────────────────────────
export const FEW_SHOT_PROMPT_BLOCK = `

━━━ EXEMPLO DE PADRÃO DE QUALIDADE ESPERADO (gold standard, NÃO copiar dados) ━━━
## 1. Diagnóstico Executivo
O regime atual é de **transição moderada**: a paridade 8P/7I está 24% acima do esperado (lift 1.24, z=+2.1σ) enquanto o setor 21-25 acumula déficit de 14% nos últimos 30 sorteios (z=-1.8σ). Sinal de reversão técnica.

## 2. Evidências Quantitativas
| Métrica | Observado | Esperado | Desvio | Sig. |
|---|---|---|---|---|
| Paridade 8/7 | 28% | 22.5% | +5.5pp | z=+2.1 |
| Soma média | 192 | 195 | -3 | dentro de 1σ |
| Setor 21-25 | 2.6 dez | 3.0 dez | -13% | z=-1.8 |

## 3. Cruzamento Multi-dimensional
Paridade + setor + momentum convergem: 3 das 5 dezenas em maior atraso (Nº22, Nº24, Nº25) estão no setor subexplorado **e** ajudariam a forçar 8/7 voltando à média.

## 4. Recomendação Acionável
Incluir **Nº22, Nº24, Nº25** (combinação cobre déficit setorial + reversão de paridade). Evitar pares acima de 9.

## 5. Confiança: 72/100
Forte em paridade (n=120), moderada em setor (n=30). Invalidaria se próximo concurso repetir 9P/6I com soma >210.
━━━ FIM DO EXEMPLO ━━━
`;

// ────────────────────────────────────────────────────────────────────────────
// (#2) Estatística enriquecida — z-scores e autocorrelação simples
// ────────────────────────────────────────────────────────────────────────────
export function computeZScoresFromFrequencies(
  freqs: Array<{ number: number; count: number }>,
  totalDraws: number,
  pick: number,
  range: number,
): Array<{ number: number; count: number; expected: number; zScore: number }> {
  if (totalDraws <= 0 || range <= 0) return [];
  const p = pick / range; // prob por sorteio de uma dezena
  const expected = totalDraws * p;
  const variance = totalDraws * p * (1 - p);
  const std = Math.sqrt(Math.max(variance, 1e-9));
  return freqs.map((f) => ({
    number: f.number,
    count: f.count,
    expected: Number(expected.toFixed(2)),
    zScore: Number(((f.count - expected) / std).toFixed(2)),
  }));
}

export function formatZScoreBlock(
  zs: Array<{ number: number; count: number; expected: number; zScore: number }>,
): string {
  const hot = zs.filter((x) => x.zScore >= 1.5).sort((a, b) => b.zScore - a.zScore).slice(0, 10);
  const cold = zs.filter((x) => x.zScore <= -1.5).sort((a, b) => a.zScore - b.zScore).slice(0, 10);
  return [
    `Dezenas com z-score significativamente positivo (≥+1.5σ):`,
    hot.length
      ? hot.map((x) => `Nº${String(x.number).padStart(2, "0")} obs=${x.count} esp=${x.expected} z=+${x.zScore}`).join("\n")
      : "(nenhuma)",
    ``,
    `Dezenas com z-score significativamente negativo (≤-1.5σ):`,
    cold.length
      ? cold.map((x) => `Nº${String(x.number).padStart(2, "0")} obs=${x.count} esp=${x.expected} z=${x.zScore}`).join("\n")
      : "(nenhuma)",
  ].join("\n");
}

// ────────────────────────────────────────────────────────────────────────────
// Chamada base ao gateway
// ────────────────────────────────────────────────────────────────────────────
async function callGateway(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  opts: { model?: string; temperature?: number; max_tokens?: number } = {},
): Promise<{ ok: boolean; status: number; content: string; error?: string }> {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-3.1-pro-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: opts.temperature ?? 0.15,
      max_tokens: opts.max_tokens ?? 12000,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, status: res.status, content: "", error: text };
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  return { ok: true, status: 200, content };
}

// ────────────────────────────────────────────────────────────────────────────
// (#1) Ensemble / self-consistency
// Roda N variantes em paralelo (T diferentes) e pede ao modelo juíz consolidar.
// Ativa por env AI_ENSEMBLE=1. Default: single call (custo controlado).
// ────────────────────────────────────────────────────────────────────────────
export type EnsembleResult = {
  analysis: string;
  variants: number;
  ensemble: boolean;
  rateLimited?: boolean;
  creditsExhausted?: boolean;
  error?: string;
};

export async function runEnsembleOrSingle(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  opts: { model?: string; ensembleTemps?: number[] } = {},
): Promise<EnsembleResult> {
  const ensembleEnabled = (Deno.env.get("AI_ENSEMBLE") ?? "0") === "1";
  const temps = opts.ensembleTemps ?? [0.1, 0.25];

  if (!ensembleEnabled) {
    const r = await callGateway(apiKey, systemPrompt, userPrompt, { model: opts.model, temperature: 0.15 });
    if (!r.ok) {
      return {
        analysis: "",
        variants: 0,
        ensemble: false,
        rateLimited: r.status === 429,
        creditsExhausted: r.status === 402,
        error: r.error,
      };
    }
    return { analysis: r.content, variants: 1, ensemble: false };
  }

  // Ensemble: rodar variantes em paralelo
  const variants = await Promise.all(
    temps.map((t) => callGateway(apiKey, systemPrompt, userPrompt, { model: opts.model, temperature: t })),
  );

  const successes = variants.filter((v) => v.ok && v.content);
  if (successes.length === 0) {
    const first = variants[0];
    return {
      analysis: "",
      variants: 0,
      ensemble: true,
      rateLimited: first?.status === 429,
      creditsExhausted: first?.status === 402,
      error: first?.error,
    };
  }
  if (successes.length === 1) {
    return { analysis: successes[0].content, variants: 1, ensemble: true };
  }

  // Juíz consolida
  const judgePrompt = `Você é um juíz analítico. Recebeu ${successes.length} análises produzidas em paralelo pelo MESMO modelo a partir do MESMO dataset, apenas com temperaturas diferentes.

Sua tarefa: consolidar UMA análise final que:
1. Mantém APENAS afirmações em que ≥2 variantes concordam ou que estão diretamente apoiadas pelo dado.
2. Marca em itálico qualquer afirmação onde as variantes divergem.
3. Preserva o formato markdown rico das variantes.
4. Não inventa números novos.
5. Mantém a confiança final calibrada pelo grau de concordância (mais divergência = menor confiança).

${successes.map((v, i) => `═══ VARIANTE ${i + 1} ═══\n${v.content}`).join("\n\n")}

Retorne SOMENTE a análise consolidada final em markdown.`;

  const judge = await callGateway(
    apiKey,
    "Você consolida análises quantitativas mantendo rigor estatístico e marcando divergências.",
    judgePrompt,
    { model: opts.model, temperature: 0.1, max_tokens: 12000 },
  );

  if (!judge.ok || !judge.content) {
    return { analysis: successes[0].content, variants: successes.length, ensemble: true };
  }
  return { analysis: judge.content, variants: successes.length, ensemble: true };
}

// ────────────────────────────────────────────────────────────────────────────
// (#6) Chain-of-Verification
// Pede ao modelo Flash (mais barato) para revisar e corrigir afirmações sem base.
// ────────────────────────────────────────────────────────────────────────────
export async function chainOfVerification(
  apiKey: string,
  analysis: string,
  userPrompt: string,
): Promise<{ verified: string; revised: boolean }> {
  const enabled = (Deno.env.get("AI_VERIFY") ?? "1") === "1";
  if (!enabled || !analysis) return { verified: analysis, revised: false };

  const verifyPrompt = `Você é um revisor estatístico. Abaixo está (A) o DATASET enviado a outro modelo e (B) a ANÁLISE produzida.

Sua tarefa: produzir uma versão REVISADA da análise que:
1. Remove ou corrige qualquer número, dezena, percentual ou estatística que NÃO esteja presente no DATASET.
2. Mantém o formato markdown original.
3. Não adiciona conteúdo novo — apenas corrige/remove o que não tem base.
4. Se a análise estiver íntegra, retorne-a IDÊNTICA.

═══ A. DATASET ═══
${userPrompt.slice(0, 12000)}

═══ B. ANÁLISE A REVISAR ═══
${analysis}

Retorne SOMENTE a versão revisada em markdown, nada mais.`;

  const r = await callGateway(
    apiKey,
    "Você é um revisor que apenas corrige; jamais inventa dados.",
    verifyPrompt,
    { model: "google/gemini-2.5-flash", temperature: 0.05, max_tokens: 12000 },
  );

  if (!r.ok || !r.content) return { verified: analysis, revised: false };
  const revised = r.content.trim() !== analysis.trim();
  return { verified: r.content, revised };
}

// ────────────────────────────────────────────────────────────────────────────
// (#5) Validação de citações
// Extrai todas as referências "Nº\d+" e "dezena \d+" e checa se aparecem no input.
// ────────────────────────────────────────────────────────────────────────────
export type ValidationReport = {
  totalCitations: number;
  groundedCitations: number;
  ungroundedCitations: number[];
  grounding: number; // 0..1
};

export function validateCitations(analysis: string, userPrompt: string): ValidationReport {
  const re = /(?:Nº|N°|Nº\s*|dezena[s]?\s+)0*(\d{1,2})/gi;
  const cited = new Set<number>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(analysis)) !== null) {
    const n = Number(m[1]);
    if (n > 0 && n <= 100) cited.add(n);
  }
  if (cited.size === 0) return { totalCitations: 0, groundedCitations: 0, ungroundedCitations: [], grounding: 1 };

  // Constrói o conjunto de números que aparecem no input (em qualquer formato razoável)
  const inputNums = new Set<number>();
  const numRe = /\b(\d{1,3})\b/g;
  let nm: RegExpExecArray | null;
  while ((nm = numRe.exec(userPrompt)) !== null) {
    const n = Number(nm[1]);
    if (n > 0 && n <= 100) inputNums.add(n);
  }

  const ungrounded = [...cited].filter((n) => !inputNums.has(n));
  const grounded = cited.size - ungrounded.length;
  return {
    totalCitations: cited.size,
    groundedCitations: grounded,
    ungroundedCitations: ungrounded,
    grounding: Number((grounded / cited.size).toFixed(2)),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Helper: traduz status do gateway em Response HTTP padronizado
// ────────────────────────────────────────────────────────────────────────────
export function gatewayErrorResponse(
  status: number,
  corsHeaders: Record<string, string>,
): Response | null {
  if (status === 429) {
    return new Response(
      JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (status === 402) {
    return new Response(
      JSON.stringify({ error: "Créditos de IA esgotados." }),
      { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  return null;
}
