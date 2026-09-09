/** @module src/server/usage/usage-service.ts */

import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerWarn } from "@/lib/logger";
import { MAX_IMAGE_BYTES } from "@/lib/constants";
import {
  resolveCurrentUsagePeriod,
  type BillingProfileFields,
} from "./billing-period";
import { resolvePlanLimits } from "./plan-limits";

async function loadPlanLimits(
  supabase: SupabaseClient,
  planId: string,
): Promise<ReturnType<typeof resolvePlanLimits>> {
  const { data: plan, error } = await supabase
    .from("plans")
    .select("limits")
    .eq("id", planId)
    .maybeSingle();
  if (error) throw error;
  return resolvePlanLimits(plan?.limits ?? {}, planId as "free" | "pro" | "business");
}

function toBillingProfile(row: {
  plan_id: string;
  billing_cycle_anchor_at: string | null;
  free_tier_ends_at: string | null;
  billing_interval: string | null;
  created_at: string;
}): BillingProfileFields {
  return {
    planId: row.plan_id ?? "free",
    billingCycleAnchorAt:
      row.billing_cycle_anchor_at ?? row.created_at,
    freeTierEndsAt: row.free_tier_ends_at,
    billingInterval:
      row.billing_interval === "month" || row.billing_interval === "year"
        ? row.billing_interval
        : null,
  };
}

async function syncFreeTierExpiry(
  supabase: SupabaseClient,
  userId: string,
  row: {
    plan_id: string;
    free_tier_ends_at: string | null;
    subscription_status: string;
  },
): Promise<void> {
  if (row.plan_id !== "free" || !row.free_tier_ends_at) return;
  if (row.subscription_status !== "active") return;
  if (new Date() <= new Date(row.free_tier_ends_at)) return;
  await supabase
    .from("profiles")
    .update({ subscription_status: "expired" })
    .eq("id", userId);
}

export type GenerationGateReason =
  | "USER_BLOCKED"
  | "MONTHLY_LIMIT"
  | "SUBSCRIPTION_INACTIVE";

export type GenerationGateResult =
  | {
      allowed: true;
      limits: ReturnType<typeof resolvePlanLimits>;
      /** Créditos extras (não expiram), somados ao ciclo do plano. */
      extraCredits: number;
    }
  | { allowed: false; reason: GenerationGateReason };

/**
 * Verifica se o usuário pode iniciar uma nova geração (bloqueio, assinatura, limite mensal no ciclo atual).
 */
export async function canUserGenerate(
  supabase: SupabaseClient,
  userId: string,
): Promise<GenerationGateResult> {
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select(
      "blocked_at, plan_id, subscription_status, billing_cycle_anchor_at, free_tier_ends_at, billing_interval, created_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (pErr) throw pErr;
  if (!profile) {
    return { allowed: false, reason: "USER_BLOCKED" };
  }
  if (profile.blocked_at) {
    logServerWarn("usage_limit_hit", { userId, gate: "USER_BLOCKED" });
    return { allowed: false, reason: "USER_BLOCKED" };
  }

  await syncFreeTierExpiry(supabase, userId, {
    plan_id: profile.plan_id as string,
    free_tier_ends_at: profile.free_tier_ends_at as string | null,
    subscription_status: profile.subscription_status as string,
  });

  const { data: fresh } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .maybeSingle();
  const status = (fresh?.subscription_status ??
    profile.subscription_status) as string;

  const { data: creditRow, error: cErr } = await supabase
    .from("credit_balances")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();
  if (cErr) throw cErr;
  const extraCredits = Math.max(0, (creditRow?.balance as number) ?? 0);

  if (status !== "active" && extraCredits <= 0) {
    logServerWarn("usage_limit_hit", { userId, gate: "SUBSCRIPTION_INACTIVE" });
    return { allowed: false, reason: "SUBSCRIPTION_INACTIVE" };
  }

  const limits = await loadPlanLimits(supabase, (profile.plan_id as string) ?? "free");
  const billing = toBillingProfile({
    plan_id: profile.plan_id as string,
    billing_cycle_anchor_at: profile.billing_cycle_anchor_at as string | null,
    free_tier_ends_at: profile.free_tier_ends_at as string | null,
    billing_interval: profile.billing_interval as string | null,
    created_at: profile.created_at as string,
  });
  const { periodKey } = resolveCurrentUsagePeriod(billing);

  const { data: usageRow, error: uErr } = await supabase
    .from("user_usage_monthly")
    .select("generations_completed")
    .eq("user_id", userId)
    .eq("period", periodKey)
    .maybeSingle();

  if (uErr) throw uErr;
  const monthlyUsed = usageRow?.generations_completed ?? 0;

  const subscriptionAllowsPlanQuota = status === "active";
  const planSlotAvailable =
    subscriptionAllowsPlanQuota && monthlyUsed < limits.monthlyGenerations;
  const creditSlotAvailable = extraCredits > 0;

  if (!planSlotAvailable && !creditSlotAvailable) {
    logServerWarn("usage_limit_hit", {
      userId,
      gate: "MONTHLY_LIMIT",
      monthlyUsed,
      monthlyCap: limits.monthlyGenerations,
      periodKey,
      subscriptionAllowsPlanQuota,
    });
    return { allowed: false, reason: "MONTHLY_LIMIT" };
  }

  return { allowed: true, limits, extraCredits };
}

export async function consumeGenerationAtomically(
  supabase: SupabaseClient,
  userId: string,
  imageCount: number,
): Promise<"plan" | "credit"> {
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select(
      "plan_id, billing_cycle_anchor_at, free_tier_ends_at, billing_interval, created_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!profile) throw new Error("PROFILE_MISSING");

  const billing = toBillingProfile({
    plan_id: profile.plan_id as string,
    billing_cycle_anchor_at: profile.billing_cycle_anchor_at as string | null,
    free_tier_ends_at: profile.free_tier_ends_at as string | null,
    billing_interval: profile.billing_interval as string | null,
    created_at: profile.created_at as string,
  });
  const { periodKey } = resolveCurrentUsagePeriod(billing);

  const { data, error } = await supabase.rpc("consume_generation_if_allowed", {
    p_period: periodKey,
    p_images: imageCount,
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("user blocked")) throw new Error("USER_BLOCKED");
    if (msg.includes("subscription inactive")) {
      throw new Error("SUBSCRIPTION_INACTIVE");
    }
    if (msg.includes("monthly limit")) throw new Error("MONTHLY_LIMIT_REACHED");
    if (msg.includes("extra credit")) {
      throw new Error("EXTRA_CREDIT_DECREMENT_FAILED");
    }
    throw error;
  }

  const source = String(data);
  if (source !== "plan" && source !== "credit") {
    throw new Error("USAGE_CONSUME_FAILED");
  }
  return source;
}

export type UsageSummary = {
  periodKey: string;
  periodEndsAt: string;
  monthlyUsed: number;
  monthlyCap: number;
  /** Créditos extras comprados (não expiram). */
  extraCredits: number;
  maxImageBytes: number;
  maxImagesPerGeneration: number;
  subscriptionStatus: string;
  planId: string;
};

export async function getUsageSummaryForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<UsageSummary | null> {
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select(
      "plan_id, subscription_status, billing_cycle_anchor_at, free_tier_ends_at, billing_interval, created_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (pErr || !profile) return null;

  const limits = await loadPlanLimits(supabase, (profile.plan_id as string) ?? "free");
  const billing = toBillingProfile({
    plan_id: profile.plan_id as string,
    billing_cycle_anchor_at: profile.billing_cycle_anchor_at as string | null,
    free_tier_ends_at: profile.free_tier_ends_at as string | null,
    billing_interval: profile.billing_interval as string | null,
    created_at: profile.created_at as string,
  });
  const { periodKey, periodEnd } = resolveCurrentUsagePeriod(billing);

  const { data: usageRow } = await supabase
    .from("user_usage_monthly")
    .select("generations_completed")
    .eq("user_id", userId)
    .eq("period", periodKey)
    .maybeSingle();

  const { data: creditRow } = await supabase
    .from("credit_balances")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    periodKey,
    periodEndsAt: periodEnd.toISOString(),
    monthlyUsed: usageRow?.generations_completed ?? 0,
    monthlyCap: limits.monthlyGenerations,
    extraCredits: Math.max(0, (creditRow?.balance as number) ?? 0),
    maxImageBytes: Math.min(MAX_IMAGE_BYTES, limits.maxImageBytes),
    maxImagesPerGeneration: limits.maxImagesPerGeneration,
    subscriptionStatus: profile.subscription_status as string,
    planId: (profile.plan_id as string) ?? "free",
  };
}

/** Chave do período de uso atual (para admin / reset). */
export async function getUsagePeriodKeyForUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "plan_id, billing_cycle_anchor_at, free_tier_ends_at, billing_interval, created_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;
  const billing = toBillingProfile({
    plan_id: profile.plan_id as string,
    billing_cycle_anchor_at: profile.billing_cycle_anchor_at as string | null,
    free_tier_ends_at: profile.free_tier_ends_at as string | null,
    billing_interval: profile.billing_interval as string | null,
    created_at: profile.created_at as string,
  });
  return resolveCurrentUsagePeriod(billing).periodKey;
}

export function usagePeriodKeyFromProfileRow(row: {
  plan_id: string;
  billing_cycle_anchor_at: string | null;
  free_tier_ends_at: string | null;
  billing_interval: string | null;
  created_at: string;
}): string {
  return resolveCurrentUsagePeriod(toBillingProfile(row)).periodKey;
}
