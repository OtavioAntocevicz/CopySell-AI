/** @module src/server/storage/getProductImageSignedUrl.ts */

import { createClient } from "@/server/supabase/server";

const SIGNED_URL_TTL_SECONDS = 3600;

export async function getProductImageSignedUrl(
  path: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("product-images")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function getProductImageSignedUrls(
  paths: string[],
): Promise<string[]> {
  const results = await Promise.all(paths.map((p) => getProductImageSignedUrl(p)));
  return results.filter((u): u is string => Boolean(u));
}
