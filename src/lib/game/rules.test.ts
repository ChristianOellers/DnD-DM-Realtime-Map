import { describe, expect, it } from "vitest";

import { abilityModifier, parseAbilityScores } from "./types";
import { cellsAround } from "./mutations";

describe("D&D ability rules", () => {
  it("derives the standard modifier curve", () => {
    expect(abilityModifier(10)).toBe(0);
    expect(abilityModifier(8)).toBe(-1);
    expect(abilityModifier(18)).toBe(4);
  });

  it("falls back to 10 for missing or malformed scores", () => {
    expect(parseAbilityScores({ str: 16 })).toMatchObject({ str: 16, dex: 10, cha: 10 });
    expect(parseAbilityScores(null).con).toBe(10);
  });
});

describe("fog of war reveal", () => {
  it("reveals a disc around the figure and stays inside the map", () => {
    const cells = cellsAround(0, 0, 10, 10);
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every(([x, y]) => x >= 0 && y >= 0 && x < 10 && y < 10)).toBe(true);
    expect(cells).toContainEqual([0, 0]);
  });
});
