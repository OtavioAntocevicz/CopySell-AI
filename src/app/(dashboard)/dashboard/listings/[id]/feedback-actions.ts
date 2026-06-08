"use server";

import {
  listingQualityFeedbackSchema,
  type ListingQualityFeedbackInput,
} from "@/domains/listing/quality-feedback";
import { createClient } from "@/server/supabase/server";

export type SubmitQualityFeedbackResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitListingQualityFeedbackAction(
  listingId: string,
  input: ListingQualityFeedbackInput,
): Promise<SubmitQualityFeedbackResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão expirada." };
  }

  const parsed = listingQualityFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join(" · "),
    };
  }

  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .maybeSingle();

  if (listingErr || !listing) {
    return { ok: false, error: "Anúncio não encontrado." };
  }

  const { error } = await supabase.from("listing_quality_feedback").upsert(
    {
      listing_id: listingId,
      user_id: user.id,
      issue_tags: parsed.data.issueTags,
      notes: parsed.data.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "listing_id,user_id" },
  );

  if (error) {
    return { ok: false, error: "Não foi possível salvar o feedback." };
  }

  return { ok: true };
}
