import { describe, it, expect } from "vitest";
import { parseClosingFile, serializeClosingFile, serializeCsv, serializeJson, serializeXml } from "@/engine/closing/io/parsers";
import type { ClosingMatrix } from "@/engine/closing/io/ClosingMatrixSchema";

const opts = {
  lotteryId: "lotofacil",
  lotteryName: "Lotofácil",
  pick: 15,
  totalNumbers: 25,
} as const;

function fileFrom(content: string, name: string): File {
  return {
    name,
    async text() { return content; },
    async arrayBuffer() { return new TextEncoder().encode(content).buffer; },
  } as unknown as File;
}

async function blobText(blob: Blob): Promise<string> {
  const buf = await new Response(blob).text();
  return buf;
}

const baseMatrix: ClosingMatrix = {
  lotteryId: "lotofacil",
  lotteryName: "Lotofácil",
  pick: 3,
  totalNumbers: 25,
  baseNumbers: [1, 2, 3, 4, 5, 6],
  games: [[1, 2, 3], [4, 5, 6]],
  source: "editor",
};

describe("io/parsers", () => {
  it("parseia CSV com múltiplos separadores", async () => {
    const f = fileFrom("1,2,3,4,5\n6 7 8 9 10\n# comentário\n11;12;13;14;15", "x.csv");
    const m = await parseClosingFile(f, opts);
    expect(m.games).toHaveLength(3);
    expect(m.games[0]).toEqual([1, 2, 3, 4, 5]);
    expect(m.games[2]).toEqual([11, 12, 13, 14, 15]);
  });

  it("parseia TXT", async () => {
    const f = fileFrom("1 2 3\n4 5 6", "x.txt");
    const m = await parseClosingFile(f, opts);
    expect(m.games).toHaveLength(2);
  });

  it("serialize CSV produz linhas por jogo", () => {
    const csv = serializeCsv(baseMatrix);
    expect(csv.split("\n")).toHaveLength(2);
    expect(csv).toContain("01,02,03");
  });

  it("round-trip JSON preserva games", async () => {
    const json = serializeJson(baseMatrix);
    const f = fileFrom(json, "x.json");
    const parsed = await parseClosingFile(f, { ...opts, pick: 3 });
    expect(parsed.games).toEqual(baseMatrix.games);
  });

  it("round-trip XML preserva games", async () => {
    const xml = serializeXml(baseMatrix);
    const f = fileFrom(xml, "x.xml");
    const parsed = await parseClosingFile(f, { ...opts, pick: 3 });
    expect(parsed.games).toEqual(baseMatrix.games);
  });

  it("serializeClosingFile devolve Blob + filename", async () => {
    const out = await serializeClosingFile(baseMatrix, "csv");
    expect(out.filename).toMatch(/\.csv$/);
    const text = await blobText(out.blob);
    expect(text).toContain("01,02,03");
  });
});
