/** @module src/server/billing/billing-requests-queries.ts */

import type { SupabaseClient } from "@supabase/supabase-js";

export type UserBillingRequestRow = {
  id: string;
  kind: string;
  status: string;
  phone: string;
  payload: Record<string, unknown>;
  created_at: string;
  handled_at: string | null;
};

export async function listOwnBillingRequests(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserBillingRequestRow[]> {
  const { data, error } = await supabase
    .from("billing_requests")
    .select("id, kind, status, phone, payload, created_at, handled_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    kind: r.kind as string,
    status: r.status as string,
    phone: r.phone as string,
    payload: (r.payload as Record<string, unknown>) ?? {},
    created_at: r.created_at as string,
    handled_at: (r.handled_at as string | null) ?? null,
  }));
}
