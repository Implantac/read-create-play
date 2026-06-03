import { describe, expect, it } from "vitest";
import {
  analyzeWorksheetGames,
  generateWorksheetMatrixGames,
  LOTOFACIL_WORKSHEET_PRESETS,
} from "@/engine/worksheet-matrices";

describe("worksheet matrices", () => {
  it("generates Lotofacil worksheet games with 15 numbers", () => {
    const preset = LOTOFACIL_WORKSHEET_PRESETS.find((item) => item.id === "plan17x8")!;
    const selected = Array.from({ length: 17 }, (_, index) => index + 1);

    const games = generateWorksheetMatrixGames(preset, selected);

    expect(games).toHaveLength(8);
    expect(games.every((game) => game.length === 15)).toBe(true);
    expect(games.every((game) => new Set(game).size === 15)).toBe(true);
  });

  it("checks generated games against a draw", () => {
    const preset = LOTOFACIL_WORKSHEET_PRESETS.find((item) => item.id === "plan19x5")!;
    const selected = Array.from({ length: 19 }, (_, index) => index + 1);
    const games = generateWorksheetMatrixGames(preset, selected);
    const draw = {
      concurso: 3200,
      date: "2026-06-03",
      numbers: Array.from({ length: 15 }, (_, index) => index + 1),
    };

    const result = analyzeWorksheetGames(games, draw);

    expect(result.games).toHaveLength(5);
    expect(result.bestHits).toBeGreaterThan(0);
    expect(result.totalCost).toBe(15);
  });
});
