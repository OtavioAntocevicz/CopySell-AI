"use server";

/** @module src/server/admin/gemini-key-actions.ts */

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/admin/require-admin";
import {
  clearGeminiApiKeyFromDatabaseForAdmin,
  getGeminiKeyAdminStatus,
  saveGeminiApiKeyForAdmin,
  type GeminiKeyAdminStatus,
} from "@/server/secrets/gemini-api-key";

export async function fetchGeminiKeyAdminStatus(): Promise<GeminiKeyAdminStatus> {
  await requireAdmin();
  return getGeminiKeyAdminStatus();
}

export async function adminSaveGeminiApiKey(apiKey: string): Promise<void> {
  const { adminUserId } = await requireAdmin();
  await saveGeminiApiKeyForAdmin(apiKey, adminUserId);
  revalidatePath("/admin/gemini-key");
}

export async function adminClearGeminiApiKeyFromDatabase(): Promise<void> {
  const { adminUserId } = await requireAdmin();
  await clearGeminiApiKeyFromDatabaseForAdmin(adminUserId);
  revalidatePath("/admin/gemini-key");
}
