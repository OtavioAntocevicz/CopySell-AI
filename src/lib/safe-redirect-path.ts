/** @module src/lib/safe-redirect-path.ts */

const DEFAULT_FALLBACK = "/dashboard";

/**
 * Aceita apenas paths relativos internos (ex.: `/dashboard`, `/login/reset`).
 * Rejeita URLs absolutas, protocol-relative (`//`) e backslashes.
 */
export function safeInternalRedirectPath(
  next: string | null | undefined,
  fallback: string = DEFAULT_FALLBACK,
): string {
  if (!next || typeof next !== "string") {
    return fallback;
  }

  const trimmed = next.trim();
  if (!trimmed.startsWith("/")) {
    return fallback;
  }
  if (trimmed.startsWith("//")) {
    return fallback;
  }
  if (trimmed.includes("://")) {
    return fallback;
  }
  if (trimmed.includes("\\")) {
    return fallback;
  }

  return trimmed;
}
