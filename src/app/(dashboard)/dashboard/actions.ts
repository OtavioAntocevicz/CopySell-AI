"use server";

/** @module src/app/(dashboard)/dashboard/actions.ts - Exclusao de listing e imagem no Storage. */

import { revalidatePath } from "next/cache";
import { logServerWarn } from "@/lib/logger";
import { createClient } from "@/server/supabase/server";

export type DeleteListingResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteListingAction(
  listingId: string,
): Promise<DeleteListingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { data: row, error: fetchErr } = await supabase
    .from("listings")
    .select("image_path")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, error: fetchErr.message };
  }
  if (!row?.image_path) {
    return { ok: false, error: "Anúncio não encontrado." };
  }

  const { error: storageErr } = await supabase.storage
    .from("product-images")
    .remove([row.image_path]);

  if (storageErr) {
    logServerWarn("listing_image_delete_failed", {
      listingId,
      message: storageErr.message,
    });
  }

  const { error: delErr } = await supabase
    .from("listings")
    .delete()
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (delErr) {
    return { ok: false, error: delErr.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/listings/${listingId}`);
  return { ok: true };
}
