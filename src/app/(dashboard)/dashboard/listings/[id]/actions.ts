"use server";

import {
  listingAiOutputSchema,
  type ListingAiOutput,
} from "@/domains/listing/schemas";
import { logServerWarn } from "@/lib/logger";
import { recordListingBehaviorEvent } from "@/server/listing/behavior/tracking";
import { createClient } from "@/server/supabase/server";

export type SaveListingOutputResult =
  | { ok: true; output: ListingAiOutput }
  | { ok: false; error: string };

function parseListingOutputPayload(raw: unknown): ListingAiOutput | null {
  const parsed = listingAiOutputSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function saveListingOutputAction(
  listingId: string,
  payload: ListingAiOutput,
  editDurationMs: number | null,
): Promise<SaveListingOutputResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const validated = listingAiOutputSchema.safeParse(payload);
  if (!validated.success) {
    const hint = validated.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(" · ");
    return { ok: false, error: `Conteúdo inválido: ${hint}` };
  }

  const { data: row, error: fetchErr } = await supabase
    .from("listings")
    .select("id, user_id, created_at, outputs, outputs_ai_snapshot, status")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, error: "Não foi possível carregar o anúncio." };
  }

  if (!row || row.status !== "completed") {
    return { ok: false, error: "Anúncio não encontrado ou indisponível." };
  }

  const aiSnapshot =
    parseListingOutputPayload(row.outputs_ai_snapshot) ??
    parseListingOutputPayload(row.outputs);

  if (!aiSnapshot) {
    return { ok: false, error: "Snapshot original do anúncio está inválido." };
  }

  const output = validated.data;

  const { error: updateErr } = await supabase
    .from("listings")
    .update({ outputs: output })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (updateErr) {
    return { ok: false, error: "Não foi possível salvar as alterações." };
  }

  try {
    await recordListingBehaviorEvent(supabase, {
      listingId,
      userId: user.id,
      listingCreatedAtIso: row.created_at,
      aiSnapshot,
      finalOutput: output,
      editDurationMs,
    });
  } catch (err) {
    logServerWarn("listing_behavior_tracking_failed", {
      listingId,
      userId: user.id,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return { ok: true, output };
}
