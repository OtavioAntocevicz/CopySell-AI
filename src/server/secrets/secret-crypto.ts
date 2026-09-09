/** @module src/server/secrets/secret-crypto.ts */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function encryptionKey(): Buffer {
  const material =
    process.env.APP_SECRETS_ENCRYPTION_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!material) {
    throw new Error("APP_SECRETS_ENCRYPTION_KEY_MISSING");
  }
  return createHash("sha256").update(material).digest();
}

/** Cifra texto; retorna base64(iv + authTag + ciphertext). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/** Decifra payload produzido por encryptSecret. */
export function decryptSecret(payloadBase64: string): string {
  const buf = Buffer.from(payloadBase64, "base64");
  if (buf.length < IV_BYTES + TAG_BYTES + 1) {
    throw new Error("INVALID_ENCRYPTED_SECRET");
  }
  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = buf.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv(ALGO, encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

export function hasSecretEncryptionConfigured(): boolean {
  return Boolean(
    process.env.APP_SECRETS_ENCRYPTION_KEY?.trim() ||
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}
