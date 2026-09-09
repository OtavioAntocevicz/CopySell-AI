/** @module src/domains/marketplace/amazon/constraints.ts */

import type { ListingConstraints } from "@/domains/marketplace/types";

/** Placeholder para Amazon BR — canal ainda não disponível na UI. */
export const amazonConstraints: ListingConstraints = {
  maxTitleLength: 200,
  bulletCountMin: 5,
  bulletCountMax: 5,
  promptRulesBlock: "Amazon BR — em breve.",
};
