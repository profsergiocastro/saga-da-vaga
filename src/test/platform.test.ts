import { describe, expect, it } from "vitest";
import { apply, initialProgress } from "@/game/quest";
import { createPlatformRun, registerFactHit, stepPlatform } from "@/game/PlatformLevel";

describe("Rota do Calouro platform level", () => {
  it("starts grounded, moves to the right and jumps on command", () => {
    const start = createPlatformRun();
    expect(start.grounded).toBe(true);
    const jumping = stepPlatform(start, 1 / 60, { right: true, jump: true });
    expect(jumping.x).toBeGreaterThan(start.x);
    expect(jumping.y).toBeLessThan(start.y);
    expect(jumping.grounded).toBe(false);
  });

  it("can hit an overhead brick while jumping to reveal an IFPI fact", () => {
    let run = { ...createPlatformRun(), x: 300 };
    for (let frame = 0; frame < 20; frame++) {
      run = stepPlatform(run, 1 / 60, { right: true, jump: frame === 0 });
      if (run.hitFacts.includes("public")) break;
    }
    expect(run.hitFacts).toContain("public");
    expect(run.factMessage).toContain("instituição pública federal");
  });

  it("bumps the player back to a checkpoint when walking into a campus hazard", () => {
    const run = { ...createPlatformRun(), x: 480, checkpoint: 54 };
    const hit = stepPlatform(run, 1 / 30, { right: true });
    expect(hit.hearts).toBe(2);
    expect(hit.x).toBe(54);
    expect(hit.factMessage).toContain("gatinho");
  });

  it("reveals each IFPI fact only once per run", () => {
    const start = createPlatformRun();
    const first = registerFactHit(start, "public");
    expect(first.hitFacts).toEqual(["public"]);
    expect(first.factMessage).toContain("instituição pública federal");
    expect(registerFactHit(first, "public")).toBe(first);
    expect(registerFactHit(first, "missing")).toBe(first);
  });

  it("does not award the uniform before the gate mission is completed", () => {
    const before = initialProgress();
    expect(apply(before, "platformClear")).toBe(before);

    let p = apply(before, "beto");
    p = apply(p, "docsOk");
    p = apply(p, "quizOk");
    p = apply(p, "finish");
    expect(p.step).toBe(4);

    const rewarded = apply(p, "platformClear");
    expect(rewarded.uniform).toBe(true);
    expect(rewarded.platformDone).toBe(true);
    expect(rewarded.items).toContain("Camisa do IFPI");
    expect(rewarded.achievements).toContain("uniforme");
    expect(apply(rewarded, "platformClear")).toBe(rewarded);
  });
});
