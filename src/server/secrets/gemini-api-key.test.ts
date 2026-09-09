import { describe, expect, it } from "vitest";
import {
  isValidGeminiApiKeyFormat,
  maskGeminiApiKey,
} from "@/server/secrets/gemini-api-key";

describe("gemini-api-key helpers", () => {
  it("validates AI Studio key prefix", () => {
    expect(isValidGeminiApiKeyFormat("AIzaSyDfakeKeyForTesting123456")).toBe(true);
    expect(isValidGeminiApiKeyFormat("sk-short")).toBe(false);
    expect(isValidGeminiApiKeyFormat("")).toBe(false);
  });

  it("masks key for display", () => {
    expect(maskGeminiApiKey("AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz")).toBe(
      "AIza…WxYz",
    );
  });
});
