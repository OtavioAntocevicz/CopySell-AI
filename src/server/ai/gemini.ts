/** @module src/server/ai/gemini.ts */

import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";
import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_TIMEOUT_MS,
  GEMINI_TRANSIENT_MAX_ATTEMPTS,
  GEMINI_TRANSIENT_RETRY_BASE_MS,
} from "@/lib/constants";
import { logServerError, logServerInfo, logServerWarn } from "@/lib/logger";
import { resolveGeminiApiKey } from "@/server/secrets/gemini-api-key";

function isTransientGeminiFailure(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes("503") ||
    lower.includes("502") ||
    lower.includes("504") ||
    lower.includes("service unavailable") ||
    lower.includes("high demand") ||
    (lower.includes("unavailable") &&
      lower.includes("generativelanguage.googleapis.com"))
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type GeminiImagePart = { mimeType: string; base64: string };

export type GeminiListingCallParams = {
  systemInstruction: string;
  userText: string;
  images: GeminiImagePart[];
};

function getModelName() {
  return process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
}

export async function generateListingJson(
  params: GeminiListingCallParams,
): Promise<{ rawText: string }> {
  const apiKey = await resolveGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = getModelName();

  const generationConfig: GenerationConfig = {
    temperature: 0.65,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
  };

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: params.systemInstruction,
    generationConfig,
  });

  logServerInfo("gemini_listing_request", { model: modelName });

  let lastErr: unknown;
  for (let attempt = 0; attempt < GEMINI_TRANSIENT_MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
      const imageParts = params.images.map((img) => ({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      }));

      const result = await model.generateContent(
        {
          contents: [
            {
              role: "user",
              parts: [{ text: params.userText }, ...imageParts],
            },
          ],
        },
        { signal: controller.signal },
      );

      const rawText = result.response.text();
      return { rawText };
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);
      const retryable =
        isTransientGeminiFailure(err) && attempt < GEMINI_TRANSIENT_MAX_ATTEMPTS - 1;

      if (retryable) {
        logServerWarn("gemini_listing_retry", {
          model: modelName,
          attempt: attempt + 1,
          message,
        });
        await delay(GEMINI_TRANSIENT_RETRY_BASE_MS * 2 ** attempt);
        continue;
      }

      logServerError("gemini_listing_error", { model: modelName, message });
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastErr;
}
