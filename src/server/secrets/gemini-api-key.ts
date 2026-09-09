/** @module src/server/secrets/gemini-api-key.ts */

import { logServerInfo } from "@/lib/logger";
import {
  decryptSecret,
  encryptSecret,
  hasSecretEncryptionConfigured,
} from "@/server/secrets/secret-crypto";
import {
  createServiceClient,
  hasServiceRoleConfigured,
} from "@/server/supabase/service";

const SECRET_KEY = "gemini_api_key";
const CACHE_TTL_MS = 30_000;

type CachedKey = { value: string; expiresAt: number };
let cachedResolvedKey: CachedKey | null = null;

export type GeminiKeySource = "database" | "env" | "none";

export type GeminiKeyAdminStatus = {
  source: GeminiKeySource;
  maskedPreview: string | null;
  updatedAt: string | null;
  canPersistToDatabase: boolean;
  persistBlockReason: string | null;
};

/** Formato basico de chaves Google AI Studio (AIza...). */
export function isValidGeminiApiKeyFormat(key: string): boolean {
  const k = key.trim();
  return k.length >= 20 && k.startsWith("AIza");
}

export function maskGeminiApiKey(key: string): string {
  const k = key.trim();
  if (k.length <= 8) return "••••••••";
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}

export function invalidateGeminiApiKeyCache(): void {
  cachedResolvedKey = null;
}

async function readEncryptedFromDatabase(): Promise<{
  plaintext: string;
  updatedAt: string;
} | null> {
  if (!hasServiceRoleConfigured() || !hasSecretEncryptionConfigured()) {
    return null;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("app_secrets")
    .select("value_encrypted, updated_at")
    .eq("key", SECRET_KEY)
    .maybeSingle();

  if (error) {
    if (error.message.includes("app_secrets")) {
      return null;
    }
    throw error;
  }
  if (!data?.value_encrypted) return null;

  return {
    plaintext: decryptSecret(data.value_encrypted as string),
    updatedAt: data.updated_at as string,
  };
}

/** Chave efetiva para chamadas Gemini: banco (prioridade) → env. */
export async function resolveGeminiApiKey(): Promise<string | null> {
  const now = Date.now();
  if (cachedResolvedKey && cachedResolvedKey.expiresAt > now) {
    return cachedResolvedKey.value;
  }

  const fromDb = await readEncryptedFromDatabase();
  const resolved =
    fromDb?.plaintext?.trim() || process.env.GEMINI_API_KEY?.trim() || null;

  if (resolved) {
    cachedResolvedKey = {
      value: resolved,
      expiresAt: now + CACHE_TTL_MS,
    };
  }

  return resolved;
}

/** Status para painel admin (nunca retorna a chave completa). */
export async function getGeminiKeyAdminStatus(): Promise<GeminiKeyAdminStatus> {
  const canPersist =
    hasServiceRoleConfigured() && hasSecretEncryptionConfigured();
  let persistBlockReason: string | null = null;
  if (!hasServiceRoleConfigured()) {
    persistBlockReason =
      "Configure SUPABASE_SERVICE_ROLE_KEY no servidor para salvar chaves no banco.";
  } else if (!hasSecretEncryptionConfigured()) {
    persistBlockReason =
      "Configure APP_SECRETS_ENCRYPTION_KEY ou SUPABASE_SERVICE_ROLE_KEY para cifrar segredos.";
  }

  const fromDb = await readEncryptedFromDatabase();
  if (fromDb?.plaintext) {
    return {
      source: "database",
      maskedPreview: maskGeminiApiKey(fromDb.plaintext),
      updatedAt: fromDb.updatedAt,
      canPersistToDatabase: canPersist,
      persistBlockReason,
    };
  }

  const envKey = process.env.GEMINI_API_KEY?.trim();
  if (envKey) {
    return {
      source: "env",
      maskedPreview: maskGeminiApiKey(envKey),
      updatedAt: null,
      canPersistToDatabase: canPersist,
      persistBlockReason,
    };
  }

  return {
    source: "none",
    maskedPreview: null,
    updatedAt: null,
    canPersistToDatabase: canPersist,
    persistBlockReason,
  };
}

export async function saveGeminiApiKeyForAdmin(
  apiKey: string,
  adminUserId: string,
): Promise<void> {
  if (!hasServiceRoleConfigured()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada — impossível salvar no banco.",
    );
  }
  if (!hasSecretEncryptionConfigured()) {
    throw new Error(
      "Chave de cifragem ausente (APP_SECRETS_ENCRYPTION_KEY ou SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const trimmed = apiKey.trim();
  if (!isValidGeminiApiKeyFormat(trimmed)) {
    throw new Error(
      "Chave inválida. Use uma chave do Google AI Studio (formato AIza…).",
    );
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("app_secrets").upsert(
    {
      key: SECRET_KEY,
      value_encrypted: encryptSecret(trimmed),
      updated_at: new Date().toISOString(),
      updated_by: adminUserId,
    },
    { onConflict: "key" },
  );
  if (error) throw error;

  invalidateGeminiApiKeyCache();
  logServerInfo("admin_gemini_key_saved", { adminUserId });
}

export async function clearGeminiApiKeyFromDatabaseForAdmin(
  adminUserId: string,
): Promise<void> {
  if (!hasServiceRoleConfigured()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("app_secrets")
    .delete()
    .eq("key", SECRET_KEY);
  if (error) throw error;

  invalidateGeminiApiKeyCache();
  logServerInfo("admin_gemini_key_cleared", { adminUserId });
}
