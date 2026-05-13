import { useState } from "react";

export type ABVariant = "A" | "B" | "C";

const STORAGE_KEY = "titan_ab_variant";

function getStoredVariant(): ABVariant {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "A" || stored === "B" || stored === "C") return stored;
  } catch {}
  // Random assignment
  const rand = Math.random();
  const variant: ABVariant = rand < 0.34 ? "A" : rand < 0.67 ? "B" : "C";
  try { localStorage.setItem(STORAGE_KEY, variant); } catch {}
  return variant;
}

export function useABTest() {
  const [variant] = useState<ABVariant>(getStoredVariant);
  return variant;
}

// ── A/B Copy Variants ──

export const heroVariants = {
  A: {
    headline: "Pare de jogar no escuro.",
    headlineHighlight: "Jogue com inteligência.",
    subheadline: "Analise 10.000+ sorteios reais, gere combinações otimizadas por IA e teste suas estratégias antes de apostar. Sem promessas mágicas — só dados, lógica e transparência.",
    cta: "Garantir Acesso Vitalício",
    secondaryCta: "Ver como funciona",
  },
  B: {
    headline: "Seus números podem ser melhores.",
    headlineHighlight: "A IA prova isso.",
    subheadline: "Enquanto outros jogam no palpite, 5.000+ brasileiros já usam inteligência artificial para gerar apostas com mais chance de acerto. Sua vez.",
    cta: "Acessar Plataforma Agora",
    secondaryCta: "Ver como funciona",
  },
  C: {
    headline: "14 algoritmos. 10.000 sorteios.",
    headlineHighlight: "Apostas baseadas em ciência.",
    subheadline: "Machine Learning analisa frequência, atraso, paridade e distribuição de cada loteria para gerar combinações com cobertura estatística máxima.",
    cta: "Obter Acesso Vitalício",
    secondaryCta: "Ver como funciona",
  },
};

export const floatingCtaVariants = {
  A: "Garantir Acesso",
  B: "Acessar Agora",
  C: "Acesso Vitalício",
};

export const midCtaVariants = {
  A: "Garantir Acesso Vitalício",
  B: "Acessar com Dados Reais",
  C: "Obter Acesso Agora",
};

export const finalCtaVariants = {
  A: "Garantir Acesso Agora",
  B: "Quero Apostar com Inteligência",
  C: "Acessar Plataforma Agora",
};

export const iaCtaVariants = {
  A: "Ativar IA Vitalícia",
  B: "Experimentar a IA Agora",
  C: "Obter IA Agora",
};
