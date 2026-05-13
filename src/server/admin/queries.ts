/** @module src/server/admin/queries.ts */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanId } from "@/server/billing/plans";
import {
  resolveCurrentUsagePeriod,
  type BillingProfileFields,
} from "@/server/usage/billing-period";
import { resolvePlanLimits, type PlanLimitsResolved } from "@/server/usage/plan-limits";
import { usagePeriodKeyFromProfileRow } from "@/server/usage/usage-service";

function startOfUtcDayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function isoDaysAgoUtc(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export type AdminOverviewStats = {
  totalUsers: number;
  activeUsers30d: number;
  generationsTodayUtc: number;
  listingsCreatedTodayUtc: number;
  avgFieldsEditedLast30d: number | null;
  avgGenerationToSaveMsLast30d: number | null;
  usersByPlan: Record<string, number>;
  monthlyGenerationsByPlan: Record<string, number>;
  /** b2b | b2c | both | unknown (não informado ou legado) */
  usersBySellerSegment: Record<string, number>;
  usagePeriodNote: string;
};

export async function getAdminOverviewStats(
  supabase: SupabaseClient,
): Promise<AdminOverviewStats> {
  const dayStart = startOfUtcDayIso();
  const since30d = isoDaysAgoUtc(30);

  const { count: totalUsers, error: c1 } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  if (c1) throw c1;

  const { data: activeRows, error: c2 } = await supabase
    .from("listings")
    .select("user_id")
    .gte("created_at", since30d);
  if (c2) throw c2;
  const activeUsers30d = new Set(
    (activeRows ?? []).map((r) => r.user_id as string),
  ).size;

  const { count: generationsTodayUtc, error: c3 } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")
    .gte("created_at", dayStart);
  if (c3) throw c3;

  const { count: listingsCreatedTodayUtc, error: c4 } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .gte("created_at", dayStart);
  if (c4) throw c4;

  const { data: behaviorRows, error: c5 } = await supabase
    .from("listing_behavior_events")
    .select("metrics, generation_to_save_ms")
    .gte("created_at", since30d)
    .limit(5000);
  if (c5) throw c5;

  let sumFields = 0;
  let nFields = 0;
  let sumGen = 0;
  let nGen = 0;
  for (const row of behaviorRows ?? []) {
    const m = row.metrics as { fieldsEditedCount?: number } | null;
    const fc = m?.fieldsEditedCount;
    if (typeof fc === "number") {
      sumFields += fc;
      nFields += 1;
    }
    const g =
      typeof row.generation_to_save_ms === "number"
        ? row.generation_to_save_ms
        : null;
    if (g != null && g >= 0) {
      sumGen += g;
      nGen += 1;
    }
  }

  const { data: profiles, error: c6 } = await supabase
    .from("profiles")
    .select(
      "id, plan_id, billing_cycle_anchor_at, free_tier_ends_at, billing_interval, created_at, seller_segment",
    );
  if (c6) throw c6;

  const usersByPlan: Record<string, number> = {};
  const usersBySellerSegment: Record<string, number> = {};
  const planByUser = new Map<string, PlanId | string>();
  const periodKeyByUser = new Map<string, string>();
  for (const p of profiles ?? []) {
    const pid = (p.plan_id as string) ?? "free";
    usersByPlan[pid] = (usersByPlan[pid] ?? 0) + 1;
    planByUser.set(p.id as string, pid);
    const rawSeg = (p.seller_segment as string | null)?.trim();
    const segKey =
      rawSeg === "b2b" || rawSeg === "b2c" || rawSeg === "both"
        ? rawSeg
        : "unknown";
    usersBySellerSegment[segKey] = (usersBySellerSegment[segKey] ?? 0) + 1;
    periodKeyByUser.set(
      p.id as string,
      usagePeriodKeyFromProfileRow({
        plan_id: pid,
        billing_cycle_anchor_at: p.billing_cycle_anchor_at as string | null,
        free_tier_ends_at: p.free_tier_ends_at as string | null,
        billing_interval: p.billing_interval as string | null,
        created_at: p.created_at as string,
      }),
    );
  }

  const ids = (profiles ?? []).map((r) => r.id as string);
  const monthlyGenerationsByPlan: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: usageRows, error: c7 } = await supabase
      .from("user_usage_monthly")
      .select("user_id, period, generations_completed")
      .in("user_id", ids);
    if (c7) throw c7;
    const usageByUserPeriod = new Map<string, number>();
    for (const u of usageRows ?? []) {
      const uid = u.user_id as string;
      const pk = periodKeyByUser.get(uid);
      if (pk && u.period === pk) {
        usageByUserPeriod.set(
          uid,
          (usageByUserPeriod.get(uid) ?? 0) + (u.generations_completed ?? 0),
        );
      }
    }
    for (const uid of ids) {
      const pid = (planByUser.get(uid) as string) ?? "free";
      const g = usageByUserPeriod.get(uid) ?? 0;
      monthlyGenerationsByPlan[pid] =
        (monthlyGenerationsByPlan[pid] ?? 0) + g;
    }
  }

  return {
    totalUsers: totalUsers ?? 0,
    activeUsers30d,
    generationsTodayUtc: generationsTodayUtc ?? 0,
    listingsCreatedTodayUtc: listingsCreatedTodayUtc ?? 0,
    avgFieldsEditedLast30d: nFields ? sumFields / nFields : null,
    avgGenerationToSaveMsLast30d: nGen ? sumGen / nGen : null,
    usersByPlan,
    monthlyGenerationsByPlan,
    usersBySellerSegment,
    usagePeriodNote:
      "Consumo por plano soma apenas o ciclo atual de cada usuário (âncora de assinatura).",
  };
}

export type AdminUserRow = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  seller_segment: string | null;
  plan_id: string;
  role: string;
  subscription_status: string;
  billing_interval: string | null;
  free_tier_ends_at: string | null;
  blocked_at: string | null;
  created_at: string;
  monthlyGenerationsUsed: number;
  usagePeriodKey: string;
  usagePeriodEndsAt: string;
  /** Saldo de créditos extras (`credit_balances.balance`). */
  extra_credits_balance: number;
};

export type AdminUserWithLimits = AdminUserRow & {
  limits: PlanLimitsResolved;
};

export async function getAdminUserWithLimitsById(
  supabase: SupabaseClient,
  userId: string,
): Promise<AdminUserWithLimits | null> {
  const { data: row, error: pErr } = await supabase
    .from("profiles")
    .select(
      "id, display_name, first_name, last_name, email, phone, company_name, seller_segment, plan_id, role, subscription_status, billing_interval, free_tier_ends_at, blocked_at, created_at, billing_cycle_anchor_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!row) return null;

  const billing: BillingProfileFields = {
    planId: (row.plan_id as string) ?? "free",
    billingCycleAnchorAt:
      (row.billing_cycle_anchor_at as string | null) ??
      (row.created_at as string),
    freeTierEndsAt: row.free_tier_ends_at as string | null,
    billingInterval:
      row.billing_interval === "month" || row.billing_interval === "year"
        ? row.billing_interval
        : null,
  };
  const w = resolveCurrentUsagePeriod(billing);
  const periodKey = w.periodKey;
  const usagePeriodEndsAt = w.periodEnd.toISOString();

  const [{ data: usageRow }, { data: creditRow }, { data: planRow }] =
    await Promise.all([
      supabase
        .from("user_usage_monthly")
        .select("generations_completed")
        .eq("user_id", userId)
        .eq("period", periodKey)
        .maybeSingle(),
      supabase
        .from("credit_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("plans")
        .select("limits")
        .eq("id", (row.plan_id as string) ?? "free")
        .maybeSingle(),
    ]);

  const limits = resolvePlanLimits(planRow?.limits ?? {});

  const adminRow: AdminUserRow = {
    id: row.id as string,
    display_name: row.display_name as string | null,
    first_name: row.first_name as string | null,
    last_name: row.last_name as string | null,
    email: row.email as string | null,
    phone: row.phone as string | null,
    company_name: row.company_name as string | null,
    seller_segment: row.seller_segment as string | null,
    plan_id: (row.plan_id as string) ?? "free",
    role: row.role as string,
    subscription_status: row.subscription_status as string,
    billing_interval: row.billing_interval as string | null,
    free_tier_ends_at: row.free_tier_ends_at as string | null,
    blocked_at: row.blocked_at as string | null,
    created_at: row.created_at as string,
    monthlyGenerationsUsed: usageRow?.generations_completed ?? 0,
    usagePeriodKey: periodKey,
    usagePeriodEndsAt,
    extra_credits_balance: Math.max(0, (creditRow?.balance as number) ?? 0),
  };

  return { ...adminRow, limits };
}

export async function listAdminUsers(
  supabase: SupabaseClient,
): Promise<AdminUserRow[]> {
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select(
      "id, display_name, first_name, last_name, email, phone, company_name, seller_segment, plan_id, role, subscription_status, billing_interval, free_tier_ends_at, blocked_at, created_at, billing_cycle_anchor_at",
    )
    .order("created_at", { ascending: false });
  if (pErr) throw pErr;

  const rows = profiles ?? [];
  const ids = rows.map((r) => r.id as string);
  if (ids.length === 0) return [];

  const periodKeyByUser = new Map<string, string>();
  const periodEndByUser = new Map<string, string>();
  for (const row of rows) {
    const billing: BillingProfileFields = {
      planId: (row.plan_id as string) ?? "free",
      billingCycleAnchorAt:
        (row.billing_cycle_anchor_at as string | null) ??
        (row.created_at as string),
      freeTierEndsAt: row.free_tier_ends_at as string | null,
      billingInterval:
        row.billing_interval === "month" || row.billing_interval === "year"
          ? row.billing_interval
          : null,
    };
    const w = resolveCurrentUsagePeriod(billing);
    periodKeyByUser.set(row.id as string, w.periodKey);
    periodEndByUser.set(row.id as string, w.periodEnd.toISOString());
  }

  const { data: usage, error: uErr } = await supabase
    .from("user_usage_monthly")
    .select("user_id, period, generations_completed")
    .in("user_id", ids);
  if (uErr) throw uErr;

  const { data: creditRows, error: cErr } = await supabase
    .from("credit_balances")
    .select("user_id, balance")
    .in("user_id", ids);
  if (cErr) throw cErr;
  const creditsByUser = new Map<string, number>();
  for (const c of creditRows ?? []) {
    creditsByUser.set(
      c.user_id as string,
      Math.max(0, (c.balance as number) ?? 0),
    );
  }

  const usageMap = new Map<string, number>();
  for (const u of usage ?? []) {
    const uid = u.user_id as string;
    const pk = periodKeyByUser.get(uid);
    if (pk && u.period === pk) {
      usageMap.set(uid, u.generations_completed ?? 0);
    }
  }

  return rows.map((row) => ({
    id: row.id as string,
    display_name: row.display_name as string | null,
    first_name: row.first_name as string | null,
    last_name: row.last_name as string | null,
    email: row.email as string | null,
    phone: row.phone as string | null,
    company_name: row.company_name as string | null,
    seller_segment: row.seller_segment as string | null,
    plan_id: (row.plan_id as string) ?? "free",
    role: row.role as string,
    subscription_status: row.subscription_status as string,
    billing_interval: row.billing_interval as string | null,
    free_tier_ends_at: row.free_tier_ends_at as string | null,
    blocked_at: row.blocked_at as string | null,
    created_at: row.created_at as string,
    monthlyGenerationsUsed: usageMap.get(row.id as string) ?? 0,
    usagePeriodKey: periodKeyByUser.get(row.id as string) ?? "",
    usagePeriodEndsAt: periodEndByUser.get(row.id as string) ?? "",
    extra_credits_balance: creditsByUser.get(row.id as string) ?? 0,
  }));
}

export type AdminPlanRow = {
  id: string;
  name: string;
  description: string | null;
  limits: unknown;
  display_order: number;
  active: boolean;
};

export async function listAdminPlans(
  supabase: SupabaseClient,
): Promise<AdminPlanRow[]> {
  const { data, error } = await supabase
    .from("plans")
    .select("id, name, description, limits, display_order, active")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminPlanRow[];
}

export type AdminBillingRequestRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  kind: string;
  status: string;
  phone: string;
  payload: Record<string, unknown>;
  created_at: string;
  handled_at: string | null;
};

export async function listBillingRequests(
  supabase: SupabaseClient,
): Promise<AdminBillingRequestRow[]> {
  const { data: reqs, error } = await supabase
    .from("billing_requests")
    .select("id, user_id, kind, status, phone, payload, created_at, handled_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;

  const rows = reqs ?? [];
  const ids = [...new Set(rows.map((r) => r.user_id as string))];
  const emailByUser = new Map<string, string | null>();
  if (ids.length > 0) {
    const { data: profs, error: pErr } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", ids);
    if (pErr) throw pErr;
    for (const p of profs ?? []) {
      emailByUser.set(p.id as string, (p.email as string | null) ?? null);
    }
  }

  return rows.map((r) => ({
    id: r.id as string,
    user_id: r.user_id as string,
    user_email: emailByUser.get(r.user_id as string) ?? null,
    kind: r.kind as string,
    status: r.status as string,
    phone: r.phone as string,
    payload: (r.payload as Record<string, unknown>) ?? {},
    created_at: r.created_at as string,
    handled_at: (r.handled_at as string | null) ?? null,
  }));
}
