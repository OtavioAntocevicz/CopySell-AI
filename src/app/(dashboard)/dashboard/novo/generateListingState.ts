export type GenerateListingState =
  | { ok: false; error?: string }
  | { ok: true; listingId: string };

export const generateListingInitialState: GenerateListingState = { ok: false };
