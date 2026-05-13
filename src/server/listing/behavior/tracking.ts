/** @module src/server/listing/behavior/tracking.ts */

import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerInfo } from "@/lib/logger";
import { computeListingBehaviorDiff, outputsDeepEqual } from "./diff";
import { buildListingBehaviorMetrics } from "./metrics";
import type { RecordListingBehaviorInput } from "./types";

/**
 * Persiste um evento de edição (diff + métricas). Idempotente no sentido de que
 * o chamador deve evitar invocar quando não houve mudança real.
 */
export async function recordListingBehaviorEvent(
  supabase: SupabaseClient,
  input: RecordListingBehaviorInput,
): Promise<void> {
  if (outputsDeepEqual(input.aiSnapshot, input.finalOutput)) {
    return;
  }

  const diff = computeListingBehaviorDiff(input.aiSnapshot, input.finalOutput);
  const generationToSaveMs =
    Date.now() - new Date(input.listingCreatedAtIso).getTime();
  const metrics = buildListingBehaviorMetrics(diff, {
    editDurationMs: input.editDurationMs,
    generationToSaveMs,
    aiLongDescription: input.aiSnapshot.long_description,
    finalLongDescription: input.finalOutput.long_description,
  });

  const { error } = await supabase.from("listing_behavior_events").insert({
    listing_id: input.listingId,
    user_id: input.userId,
    metrics,
    diff,
    edit_duration_ms: input.editDurationMs,
    generation_to_save_ms: generationToSaveMs,
  });

  if (error) throw error;

  logServerInfo("behavior_tracking_saved", {
    listingId: input.listingId,
    userId: input.userId,
    fieldsEditedCount: metrics.fieldsEditedCount,
    editDurationMs: metrics.editDurationMs,
    generationToSaveMs: metrics.generationToSaveMs,
  });
}
