import { describe, expect, it } from "vitest";
import { INTERACT, T, W, buildWorld, isSolidTile } from "@/game/world";

describe("São Raimundo Nonato landmark map", () => {
  const world = buildWorld();
  const tile = (x: number, y: number) => world.tiles[y * W + x];

  it("places the Praça do Relógio in the plaza and lets it be inspected", () => {
    expect(tile(10, 18)).toBe(T.CLOCK);
    expect(isSolidTile(tile(10, 18) ?? 0)).toBe(true);
    expect(INTERACT["10,18"]?.label).toContain("Praça");
    expect(tile(10, 19)).toBe(T.PLAZA);
  });

  it("adds the onças, tatu and seriema monuments as solid world landmarks", () => {
    expect(tile(23, 14)).toBe(T.MON_ONCAS);
    expect(tile(3, 16)).not.toBe(T.MON_ONCAS);
    expect(tile(3, 26)).toBe(T.MON_TATU);
    expect(tile(23, 19)).toBe(T.MON_SERIEMA);
    expect(isSolidTile(tile(23, 14) ?? 0)).toBe(true);
    expect(isSolidTile(tile(3, 26) ?? 0)).toBe(true);
    expect(isSolidTile(tile(23, 19) ?? 0)).toBe(true);
    expect(INTERACT["23,14"]?.label).toBe("Monumento das Onças");
    expect(INTERACT["23,14"]?.lines.join(" ")).toContain("Capacete");
    expect(INTERACT["32,10"]?.lines.join(" ")).toContain("capacete");
    expect(INTERACT["23,10"]?.lines.join(" ")).toContain("GPS");
    expect(INTERACT["4,26"]?.label).toBe("Monumento do Tatu");
    expect(INTERACT["23,19"]?.label).toBe("Monumento da Seriema");
  });

  it("preserves walkable approaches to the three landmarks", () => {
    expect(tile(22, 14)).toBe(T.PLAZA);
    expect(isSolidTile(tile(22, 14) ?? 0)).toBe(false);
    expect(tile(5, 26)).toBe(T.WALK);
    expect(isSolidTile(tile(5, 26) ?? 0)).toBe(false);
    expect(tile(22, 19)).toBe(T.WALK);
    expect(isSolidTile(tile(22, 19) ?? 0)).toBe(false);
  });
});
