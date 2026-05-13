"use server";

/** @module src/app/(dashboard)/dashboard/novo/actions.ts - Server Action do formulario de geracao de anuncio. */

import { createClient } from "@/server/supabase/server";
import { generateListingFormSchema } from "@/domains/listing/schemas";
import { generateListingForUser } from "@/server/listing/aiListingService";
import { mapListingError } from "@/lib/errors";
import { explainListingFailure } from "@/lib/listingFailure";
import type { GenerateListingState } from "./generateListingState";

export async function generateListingAction(
  _prev: GenerateListingState,
  formData: FormData,
): Promise<GenerateListingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: mapListingError("UNAUTHORIZED") };
  }

  const parsed = generateListingFormSchema.safeParse({
    productName: formData.get("productName"),
    category: formData.get("category"),
    sellerNotes: formData.get("sellerNotes"),
  });

  if (!parsed.success) {
    return { ok: false, error: mapListingError("VALIDATION") };
  }

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return { ok: false, error: mapListingError("IMAGE_REQUIRED") };
  }

  try {
    const { listingId } = await generateListingForUser({
      userId: user.id,
      marketplace: "mercado_livre",
      productName: parsed.data.productName,
      category: parsed.data.category,
      sellerNotes: parsed.data.sellerNotes,
      imageFile: image,
    });
    return { ok: true, listingId };
  } catch (err) {
    return { ok: false, error: explainListingFailure(err) };
  }
}
