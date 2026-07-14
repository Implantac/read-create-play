/**
 * Parsers e serializers para matrizes de fechamento.
 * Formatos: CSV, TXT, JSON, XML, XLSX (lazy).
 */

import { XMLParser, XMLBuilder } from "fast-xml-parser";
import {
  ClosingMatrixSchema,
  normalizeMatrix,
  type ClosingMatrix,
} from "./ClosingMatrixSchema";

export type ClosingFileFormat = "csv" | "txt" | "json" | "xml" | "xlsx";

function parseGameLine(line: string): number[] {
  return line
    .split(/[\s,;|\t-]+/)
    .map(t => Number(t.replace(/[^\d]/g, "")))
    .filter(n => Number.isFinite(n) && n > 0);
}

function parseCsvOrTxt(text: string): number[][] {
  return text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !/^#/.test(l))
    .map(parseGameLine)
    .filter(g => g.length > 0);
}

function parseXml(text: string): number[][] {
  const parser = new XMLParser({ ignoreAttributes: false });
  const doc = parser.parse(text) as Record<string, unknown>;
  const games: number[][] = [];
  const visit = (n: unknown): void => {
    if (!n) return;
    if (Array.isArray(n)) { n.forEach(visit); return; }
    if (typeof n === "object") {
      const obj = n as Record<string, unknown>;
      if ("game" in obj) visit(obj.game);
      if ("jogo" in obj) visit(obj.jogo);
      if ("numbers" in obj) {
        const nums = String(obj.numbers).split(/[\s,;|-]+/).map(Number).filter(Boolean);
        if (nums.length) games.push(nums);
      } else if (typeof (obj["#text"]) === "string") {
        const nums = parseGameLine(obj["#text"] as string);
        if (nums.length) games.push(nums);
      } else {
        Object.values(obj).forEach(visit);
      }
    } else if (typeof n === "string") {
      const nums = parseGameLine(n);
      if (nums.length) games.push(nums);
    }
  };
  visit(doc);
  return games;
}

async function parseXlsx(buffer: ArrayBuffer): Promise<number[][]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
  return rows
    .map(row => (row || [])
      .map(c => Number(String(c ?? "").replace(/[^\d]/g, "")))
      .filter(n => Number.isFinite(n) && n > 0))
    .filter(g => g.length > 0);
}

export interface ParseOptions {
  lotteryId: string;
  lotteryName?: string;
  pick: number;
  totalNumbers: number;
  source?: string;
}

export async function parseClosingFile(
  file: File,
  opts: ParseOptions,
): Promise<ClosingMatrix> {
  const name = file.name.toLowerCase();
  const ext: ClosingFileFormat = name.endsWith(".xlsx") ? "xlsx"
    : name.endsWith(".xml") ? "xml"
    : name.endsWith(".json") ? "json"
    : name.endsWith(".csv") ? "csv"
    : "txt";

  let games: number[][] = [];
  let base: number[] = [];

  if (ext === "xlsx") {
    games = await parseXlsx(await file.arrayBuffer());
  } else {
    const text = await file.text();
    if (ext === "json") {
      const raw = JSON.parse(text) as Record<string, unknown>;
      // Tenta usar schema completo primeiro.
      const attempt = ClosingMatrixSchema.safeParse({ ...raw, source: opts.source ?? "import" });
      if (attempt.success) return normalizeMatrix(attempt.data);
      games = Array.isArray(raw.games) ? (raw.games as number[][]) : [];
      base = Array.isArray(raw.baseNumbers) ? (raw.baseNumbers as number[]) : [];
    } else if (ext === "xml") {
      games = parseXml(text);
    } else {
      games = parseCsvOrTxt(text);
    }
  }

  if (games.length === 0) throw new Error("Nenhum jogo válido encontrado no arquivo.");

  const matrix: ClosingMatrix = {
    lotteryId: opts.lotteryId,
    lotteryName: opts.lotteryName,
    pick: opts.pick,
    totalNumbers: opts.totalNumbers,
    baseNumbers: base,
    games,
    source: opts.source ?? "import",
  };
  const parsed = ClosingMatrixSchema.parse(matrix);
  return normalizeMatrix(parsed);
}

// ---------- Serializers ----------

export function serializeCsv(m: ClosingMatrix): string {
  return m.games.map(g => g.map(n => n.toString().padStart(2, "0")).join(",")).join("\n");
}

export function serializeTxt(m: ClosingMatrix): string {
  const header = `# ${m.lotteryName ?? m.lotteryId} — ${m.games.length} jogos, base ${m.baseNumbers.length}\n`;
  return header + m.games.map(g => g.map(n => n.toString().padStart(2, "0")).join(" ")).join("\n");
}

export function serializeJson(m: ClosingMatrix): string {
  return JSON.stringify(m, null, 2);
}

export function serializeXml(m: ClosingMatrix): string {
  const builder = new XMLBuilder({ format: true, ignoreAttributes: false });
  return builder.build({
    closing: {
      "@_lottery": m.lotteryId,
      "@_pick": m.pick,
      "@_totalNumbers": m.totalNumbers,
      baseNumbers: m.baseNumbers.join(","),
      games: { game: m.games.map(g => g.join(",")) },
    },
  }) as string;
}

export async function serializeXlsx(m: ClosingMatrix): Promise<Blob> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const rows = m.games.map(g => g.map(n => n));
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, sheet, "Fechamento");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function serializeClosingFile(
  m: ClosingMatrix,
  format: ClosingFileFormat,
): Promise<{ blob: Blob; filename: string }> {
  const stem = `fechamento_${m.lotteryId}_${m.games.length}j`;
  switch (format) {
    case "csv": return { blob: new Blob([serializeCsv(m)], { type: "text/csv" }), filename: `${stem}.csv` };
    case "txt": return { blob: new Blob([serializeTxt(m)], { type: "text/plain" }), filename: `${stem}.txt` };
    case "json": return { blob: new Blob([serializeJson(m)], { type: "application/json" }), filename: `${stem}.json` };
    case "xml": return { blob: new Blob([serializeXml(m)], { type: "application/xml" }), filename: `${stem}.xml` };
    case "xlsx": return { blob: await serializeXlsx(m), filename: `${stem}.xlsx` };
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
