import { describe, expect, it } from "vitest";
import {
  addMonthsUtc,
  resolveCurrentUsagePeriod,
} from "@/server/usage/billing-period";

describe("resolveCurrentUsagePeriod", () => {
  it("free plan uses anchor to free_tier_ends_at window", () => {
    const anchor = "2026-01-01T00:00:00.000Z";
    const end = "2026-01-31T00:00:00.000Z";
    const w = resolveCurrentUsagePeriod(
      {
        planId: "free",
        billingCycleAnchorAt: anchor,
        freeTierEndsAt: end,
        billingInterval: null,
      },
      new Date("2026-01-15T12:00:00.000Z"),
    );
    expect(w.periodKey).toBe(anchor);
    expect(w.periodEnd.toISOString()).toBe(end);
  });

  it("paid plan rolls monthly from anchor", () => {
    const anchor = "2026-01-10T00:00:00.000Z";
    const w = resolveCurrentUsagePeriod(
      {
        planId: "pro",
        billingCycleAnchorAt: anchor,
        freeTierEndsAt: null,
        billingInterval: "month",
      },
      new Date("2026-03-15T00:00:00.000Z"),
    );
    expect(w.periodStart.toISOString()).toBe("2026-03-10T00:00:00.000Z");
    expect(w.periodEnd.toISOString()).toBe("2026-04-10T00:00:00.000Z");
  });
});

describe("addMonthsUtc", () => {
  it("handles month-end overflow", () => {
    const base = new Date("2026-01-31T00:00:00.000Z");
    const next = addMonthsUtc(base, 1);
    expect(next.getUTCMonth()).toBe(1);
  });
});
