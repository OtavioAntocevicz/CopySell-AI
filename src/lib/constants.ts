/** @module src/lib/constants.ts */

/** Limite de upload de imagem (bytes) - custo e latência do pipeline de IA. */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];

export const GEMINI_TIMEOUT_MS = 60_000;

/** Tentativas extras após falhas transitórias (503 / sobrecarga). */
export const GEMINI_TRANSIENT_MAX_ATTEMPTS = 3;

/** Espera base entre tentativas (ms); aplicamos backoff exponencial. */
export const GEMINI_TRANSIENT_RETRY_BASE_MS = 1_200;

/** Modelo padrão na API atual (google.ai.dev); 1.5 foi removido do v1beta para várias chaves. */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export const PROMPT_VERSION_ML_V4 = "ml-v4";
export const PROMPT_VERSION_LOJA_V2 = "loja-v2";

/** @deprecated Use PROMPT_VERSION_ML_V4 */
export const PROMPT_VERSION_ML_V3 = PROMPT_VERSION_ML_V4;

/** @deprecated Use PROMPT_VERSION_LOJA_V2 */
export const PROMPT_VERSION_LOJA_V1 = PROMPT_VERSION_LOJA_V2;

/** Intervalo mínimo entre gerações consecutivas (ms) por usuário. */
export const GENERATION_RATE_LIMIT_MS = 15_000;
