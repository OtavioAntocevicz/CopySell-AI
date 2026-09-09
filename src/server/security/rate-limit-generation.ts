/** @module src/server/security/rate-limit-generation.ts */

import type { SupabaseClient } from "@supabase/supabase-js";
import { GENERATION_RATE_LIMIT_MS } from "@/lib/constants";

export async function assertGenerationRateLimit(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const since = new Date(Date.now() - GENERATION_RATE_LIMIT_MS).toISOString();
  const { data, error } = await supabase
    .from("listings")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  if (data && data.length > 0) {
    throw new Error("RATE_LIMIT");
  }
}
