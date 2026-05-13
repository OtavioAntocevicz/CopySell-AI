/** @module src/server/storage/uploadProductImage.ts */

import { randomUUID } from "crypto";
import {
  ALLOWED_IMAGE_MIMES,
  MAX_IMAGE_BYTES,
  type AllowedImageMime,
} from "@/lib/constants";
import { createClient } from "@/server/supabase/server";

export type UploadedImageMeta = {
  path: string;
  mime: AllowedImageMime;
};

function extensionForMime(mime: AllowedImageMime): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "webp";
}

export async function uploadProductImage(
  userId: string,
  file: File,
): Promise<UploadedImageMeta> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  const mime = file.type as AllowedImageMime;
  if (!ALLOWED_IMAGE_MIMES.includes(mime)) {
    throw new Error("IMAGE_TYPE_UNSUPPORTED");
  }

  const supabase = await createClient();
  const path = `users/${userId}/listings/${randomUUID()}.${extensionForMime(mime)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return { path, mime };
}
