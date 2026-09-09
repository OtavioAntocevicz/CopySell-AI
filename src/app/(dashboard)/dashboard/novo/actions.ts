"use server";

/** @module src/app/(dashboard)/dashboard/novo/actions.ts - Server Action do formulario de geracao de anuncio. */

import { createClient } from "@/server/supabase/server";
import { generateListingFormSchema } from "@/domains/listing/schemas";
import { isMarketplaceAvailable } from "@/domains/marketplace/registry";
import type { MarketplaceId } from "@/domains/marketplace/types";
import { generateListingForUser } from "@/server/listing/aiListingService";
import { mapListingError } from "@/lib/errors";
import { explainListingFailure } from "@/lib/listingFailure";
import { assertGenerationRateLimit } from "@/server/security/rate-limit-generation";
import type { GenerateListingState } from "./generateListingState";

function collectImageFiles(formData: FormData): File[] {
  const multi = formData.getAll("images");
  const files = multi.filter(
    (item): item is File => item instanceof File && item.size > 0,
  );
  if (files.length > 0) return files;

  const single = formData.get("image");
  if (single instanceof File && single.size > 0) return [single];
  return [];
}

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
    marketplace: formData.get("marketplace"),
    productName: formData.get("productName"),
    category: formData.get("category"),
    sellerNotes: formData.get("sellerNotes"),
  });

  if (!parsed.success) {
    return { ok: false, error: mapListingError("VALIDATION") };
  }

  const marketplace = parsed.data.marketplace as MarketplaceId;
  if (!isMarketplaceAvailable(marketplace)) {
    return {
      ok: false,
      error: "Este canal ainda não está disponível. Escolha Mercado Livre ou Loja própria.",
    };
  }

  const imageFiles = collectImageFiles(formData);
  if (imageFiles.length === 0) {
    return { ok: false, error: mapListingError("IMAGE_REQUIRED") };
  }

  try {
    await assertGenerationRateLimit(supabase, user.id);
  } catch {
    return {
      ok: false,
      error: "Aguarde alguns segundos antes de gerar outro anúncio.",
    };
  }

  try {
    const { listingId } = await generateListingForUser({
      userId: user.id,
      marketplace,
      productName: parsed.data.productName,
      category: parsed.data.category,
      sellerNotes: parsed.data.sellerNotes,
      imageFiles,
    });
    return { ok: true, listingId };
  } catch (err) {
    return { ok: false, error: explainListingFailure(err) };
  }
}
