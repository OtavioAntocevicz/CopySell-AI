/** @module src/server/billing/load-pricing-plans.ts */

import type { PricingPlanRow } from "@/components/plans/pricing-plan-types";
import { createPublicSupabaseClient } from "@/server/supabase/public";
import { PLAN_CATALOG } from "@/server/billing/catalog";
import { resolvePlanLimits } from "@/server/usage/plan-limits";

export async function loadPricingPlanRows(): Promise<PricingPlanRow[]> {
  let rows: Array<{
    id: string;
    name: string | null;
    description: string | null;
    limits: unknown;
  }> = [];

  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from("plans")
      .select("id, name, description, limits, display_order")
      .eq("active", true)
      .order("display_order", { ascending: true });
    rows = data ?? [];
  } catch {
    rows = [];
  }

  return PLAN_CATALOG.map((c) => {
    const row = (rows ?? []).find((r) => r.id === c.id);
    const lim = resolvePlanLimits(row?.limits ?? {}, c.id);
    return {
      id: c.id,
      name: row?.name ?? c.id,
      description: row?.description ?? null,
      tagline: c.tagline,
      bullets: c.bullets,
      highlight: c.highlight,
      priceMonthlyCents: c.priceMonthlyCents,
      priceYearlyCents: c.priceYearlyCents,
      yearlySavingsLabel: c.yearlySavingsLabel,
      monthlyGenerations: lim.monthlyGenerations,
      maxImagesPerGeneration: lim.maxImagesPerGeneration,
    };
  });
}
