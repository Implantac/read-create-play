import { describe, it, expect } from "vitest";
import { parseClosingFile, serializeClosingFile } from "@/engine/closing/io/parsers";

describe("io/parsers", () => {
  it("parseia CSV com múltiplos separadores", async () => {
    const csv = "1,2,3,4,5\n6 7 8 9 10\n# comentário\n11;12;13;14;15";
    const m = await parseClosingFile(csv, "csv");
    expect(m.games).toHaveLength(3);
    expect(m.games[0]).toEqual([1, 2, 3, 4, 5]);
    expect(m.games[2]).toEqual([11, 12, 13, 14, 15]);
  });

  it("parseia TXT idêntico a CSV", async () => {
    const txt = "1 2 3\n4 5 6";
    const m = await parseClosingFile(txt, "txt");
    expect(m.games).toHaveLength(2);
  });

  it("round-trip JSON preserva jogos", async () => {
    const games = [[1, 2, 3], [4, 5, 6]];
    const json = await serializeClosingFile({ games }, "json");
    const parsed = await parseClosingFile(json, "json");
    expect(parsed.games).toEqual(games);
  });

  it("round-trip XML preserva jogos", async () => {
    const games = [[7, 8, 9], [10, 11, 12]];
    const xml = await serializeClosingFile({ games }, "xml");
    const parsed = await parseClosingFile(xml, "xml");
    expect(parsed.games).toEqual(games);
  });

  it("round-trip CSV preserva jogos", async () => {
    const games = [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]];
    const csv = await serializeClosingFile({ games }, "csv");
    const parsed = await parseClosingFile(csv, "csv");
    expect(parsed.games).toEqual(games);
  });
});
