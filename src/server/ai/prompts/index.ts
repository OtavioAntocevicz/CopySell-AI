/** @module src/server/ai/prompts/index.ts */

import type { MarketplaceId } from "@/domains/marketplace/types";
import {
  SYSTEM_ML_LISTING_V3,
  buildUserPayload as buildMlUserPayload,
  LISTING_PROMPT_VERSION as ML_VERSION,
} from "@/server/ai/prompts/mercado-livre-v3";
import {
  SYSTEM_LOJA_PROPRIA_V1,
  buildLojaPropriaUserPayload,
  LISTING_PROMPT_VERSION as LOJA_VERSION,
} from "@/server/ai/prompts/loja-propria-v1";

export type PromptBuildInput = {
  marketplace: MarketplaceId;
  productName: string;
  categoryLabel: string;
  constraintsBlock: string;
  sellerNotes?: string;
  repairHint?: string;
};

export type PromptConfig = {
  systemInstruction: string;
  buildUserText: (input: PromptBuildInput) => string;
  promptVersion: string;
};

const PROMPTS: Record<MarketplaceId, PromptConfig> = {
  mercado_livre: {
    systemInstruction: SYSTEM_ML_LISTING_V3,
    buildUserText: buildMlUserPayload,
    promptVersion: ML_VERSION,
  },
  loja_propria: {
    systemInstruction: SYSTEM_LOJA_PROPRIA_V1,
    buildUserText: buildLojaPropriaUserPayload,
    promptVersion: LOJA_VERSION,
  },
  amazon: {
    systemInstruction: SYSTEM_ML_LISTING_V3,
    buildUserText: buildMlUserPayload,
    promptVersion: ML_VERSION,
  },
};

export function getPromptConfig(marketplace: MarketplaceId): PromptConfig {
  return PROMPTS[marketplace];
}
