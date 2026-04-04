import { DrawResult, LOTTERIES, LotteryConfig } from "@/data/lotteries";
import { DrawPrizeData, PrizeTierInfo } from "@/hooks/useLotteryDraws";

const API_PRIMARY = "https://loteriascaixa-api.herokuapp.com/api";
const API_FALLBACK = "https://api.guidi.dev.br/loteria";

// Map our IDs to API-compatible names
const API_NAMES: Record<string, string> = {
  megasena: "megasena",
  lotofacil: "lotofacil",
  quina: "quina",
  lotomania: "lotomania",
  duplasena: "duplasena",
  timemania: "timemania",
  diadesorte: "diadesorte",
  supersete: "supersete",
};

interface CaixaApiResult {
  loteria?: string;
  concurso: number;
  data?: string;
  dezenas?: string[];
  listaDezenas?: string[];
  listaDezenasSegundoSorteio?: string[];
  colunas?: string[][];
  premiacoes?: { descricao: string; faixa: number; ganhadores: number; valorPremio: number }[];
  acumulou?: boolean;
  valorAcumuladoProximoConcurso?: number;
  valorEstimadoProximoConcurso?: number;
  valorArrecadado?: number;
}

export interface LatestDrawResult extends DrawResult {
  prizeTiers?: DrawPrizeData | null;
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 8000): Promise<CaixaApiResult | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchApiJson(path: string): Promise<CaixaApiResult | null> {
  const normalizedPath = path.replace(/^\//, "");
  return (
    await fetchJsonWithTimeout(`${API_PRIMARY}/${normalizedPath}`)
  ) ?? (
    await fetchJsonWithTimeout(`${API_FALLBACK}/${normalizedPath}`)
  );
}

function parseApiResult(raw: CaixaApiResult): LatestDrawResult {
  const dezenas = raw.colunas?.flat() || raw.dezenas || raw.listaDezenas || [];

  let prizeTiers: DrawPrizeData | null = null;
  if (raw.premiacoes && raw.premiacoes.length > 0) {
    prizeTiers = {
      premiacoes: raw.premiacoes.map(p => ({
        descricao: p.descricao,
        faixa: p.faixa,
        ganhadores: p.ganhadores,
        valorPremio: p.valorPremio,
      })),
      acumulou: raw.acumulou ?? false,
      valorAcumulado: raw.valorAcumuladoProximoConcurso ?? 0,
      valorEstimado: raw.valorEstimadoProximoConcurso ?? 0,
      valorArrecadado: raw.valorArrecadado ?? 0,
    };
  }

  return {
    concurso: raw.concurso,
    date: raw.data || "",
    numbers: dezenas.map(d => parseInt(d, 10)).filter(n => !isNaN(n)),
    prizeTiers,
  };
}

export async function fetchLatestDraw(lotteryId: string): Promise<LatestDrawResult | null> {
  const apiName = API_NAMES[lotteryId];
  if (!apiName) return null;

  const data = await fetchApiJson(`${apiName}/latest`);
  return data ? parseApiResult(data) : null;
}

export async function fetchMultipleDraws(
  lotteryId: string,
  count: number = 200
): Promise<DrawResult[]> {
  const apiName = API_NAMES[lotteryId];
  if (!apiName) return [];

  // Try to fetch the latest first to get the current concurso number
  const latest = await fetchLatestDraw(lotteryId);
  if (!latest) return [];

  const draws: DrawResult[] = [latest];

  // Fetch additional draws in batches
  const batchSize = 10;
  const promises: Promise<DrawResult | null>[] = [];

  for (let i = 1; i < Math.min(count, 100); i++) {
    const concurso = latest.concurso - i;
    if (concurso < 1) break;

    promises.push(
      fetch(`${API_PRIMARY}/${apiName}/${concurso}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => (data ? parseApiResult(data) : null))
        .catch(() => null)
    );

    // Batch requests to avoid overwhelming the API
    if (promises.length >= batchSize) {
      const results = await Promise.all(promises);
      draws.push(...results.filter((r): r is DrawResult => r !== null));
      promises.length = 0;
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  if (promises.length > 0) {
    const results = await Promise.all(promises);
    draws.push(...results.filter((r): r is DrawResult => r !== null));
  }

  return draws.sort((a, b) => b.concurso - a.concurso);
}

// Check if a bet matches a draw result
export interface MatchResult {
  concurso: number;
  date: string;
  drawnNumbers: number[];
  matchedNumbers: number[];
  matchCount: number;
}

export function checkBetAgainstDraws(
  bet: number[],
  draws: DrawResult[]
): MatchResult[] {
  return draws.map(draw => {
    const matched = bet.filter(n => draw.numbers.includes(n));
    return {
      concurso: draw.concurso,
      date: draw.date,
      drawnNumbers: draw.numbers,
      matchedNumbers: matched,
      matchCount: matched.length,
    };
  }).filter(r => r.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);
}

// Prize tiers for each lottery with estimated values
export function getPrizeTiers(lotteryId: string): { hits: number; label: string; estimatedPrize?: string }[] {
  switch (lotteryId) {
    case "megasena":
      return [
        { hits: 6, label: "Sena (6 acertos)", estimatedPrize: "Valor variável (rateado)" },
        { hits: 5, label: "Quina (5 acertos)", estimatedPrize: "Valor variável (rateado)" },
        { hits: 4, label: "Quadra (4 acertos)", estimatedPrize: "Valor variável (rateado)" },
      ];
    case "lotofacil":
      return [
        { hits: 15, label: "15 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 14, label: "14 acertos", estimatedPrize: "Valor variável (R$ 2.000+)" },
        { hits: 13, label: "13 acertos", estimatedPrize: "R$ 35,00 (fixo)" },
        { hits: 12, label: "12 acertos", estimatedPrize: "R$ 14,00 (fixo)" },
        { hits: 11, label: "11 acertos", estimatedPrize: "R$ 7,00 (fixo)" },
      ];
    case "quina":
      return [
        { hits: 5, label: "Quina (5 acertos)", estimatedPrize: "Valor variável (rateado)" },
        { hits: 4, label: "Quadra (4 acertos)", estimatedPrize: "Valor variável (rateado)" },
        { hits: 3, label: "Terno (3 acertos)", estimatedPrize: "Valor variável (rateado)" },
        { hits: 2, label: "Duque (2 acertos)", estimatedPrize: "Valor variável (rateado)" },
      ];
    case "lotomania":
      return [
        { hits: 20, label: "20 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 19, label: "19 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 18, label: "18 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 17, label: "17 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 16, label: "16 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 15, label: "15 acertos", estimatedPrize: "R$ 6,00 (fixo)" },
        { hits: 0, label: "0 acertos", estimatedPrize: "R$ 6,00 (fixo)" },
      ];
    case "duplasena":
      return [
        { hits: 6, label: "Sena (6 acertos)", estimatedPrize: "Valor variável (rateado)" },
        { hits: 5, label: "Quina (5 acertos)", estimatedPrize: "Valor variável (rateado)" },
        { hits: 4, label: "Quadra (4 acertos)", estimatedPrize: "Valor variável (rateado)" },
        { hits: 3, label: "Terno (3 acertos)", estimatedPrize: "Valor variável (rateado)" },
      ];
    case "timemania":
      return [
        { hits: 7, label: "7 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 6, label: "6 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 5, label: "5 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 4, label: "4 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 3, label: "3 acertos", estimatedPrize: "R$ 3,00 (fixo)" },
      ];
    case "diadesorte":
      return [
        { hits: 7, label: "7 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 6, label: "6 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 5, label: "5 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 4, label: "4 acertos", estimatedPrize: "Valor variável (rateado)" },
      ];
    case "supersete":
      return [
        { hits: 7, label: "7 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 6, label: "6 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 5, label: "5 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 4, label: "4 acertos", estimatedPrize: "Valor variável (rateado)" },
        { hits: 3, label: "3 acertos", estimatedPrize: "R$ 3,00 (fixo)" },
      ];
    default:
      return [
        { hits: 6, label: "Primeira faixa", estimatedPrize: "Variável" },
        { hits: 5, label: "Segunda faixa", estimatedPrize: "Variável" },
        { hits: 4, label: "Terceira faixa", estimatedPrize: "Variável" },
      ];
  }
}
