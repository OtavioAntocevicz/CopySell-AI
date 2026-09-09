import { describe, expect, it } from "vitest";
import { PLAN_LIMIT_FALLBACKS, resolvePlanLimits } from "@/server/usage/plan-limits";

describe("resolvePlanLimits", () => {
  it("uses DB limits when present", () => {
    const r = resolvePlanLimits(
      { monthlyGenerations: 99, maxImagesPerGeneration: 2 },
      "pro",
    );
    expect(r.monthlyGenerations).toBe(99);
    expect(r.maxImagesPerGeneration).toBe(2);
  });

  it("falls back per plan when DB empty", () => {
    expect(resolvePlanLimits({}, "free").monthlyGenerations).toBe(
      PLAN_LIMIT_FALLBACKS.free.monthlyGenerations,
    );
    expect(resolvePlanLimits({}, "pro").monthlyGenerations).toBe(
      PLAN_LIMIT_FALLBACKS.pro.monthlyGenerations,
    );
    expect(resolvePlanLimits({}, "business").maxImagesPerGeneration).toBe(5);
  });
});
