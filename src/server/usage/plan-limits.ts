/** @module src/server/usage/plan-limits.ts */

import { z } from "zod";
import { MAX_IMAGE_BYTES } from "@/lib/constants";
import type { PlanId } from "@/server/billing/plans";

const limitsJsonSchema = z
  .object({
    monthlyGenerations: z.number().int().positive().optional(),
    maxImagesPerGeneration: z.number().int().positive().optional(),
    maxImageBytes: z.number().int().positive().optional(),
  })
  .passthrough();

export type PlanLimitsResolved = {
  monthlyGenerations: number;
  maxImagesPerGeneration: number;
  maxImageBytes: number;
};

/** Fallback por plano quando o banco não retorna limites (ex.: Supabase pausado). */
export const PLAN_LIMIT_FALLBACKS: Record<PlanId, PlanLimitsResolved> = {
  free: {
    monthlyGenerations: 5,
    maxImagesPerGeneration: 1,
    maxImageBytes: MAX_IMAGE_BYTES,
  },
  pro: {
    monthlyGenerations: 75,
    maxImagesPerGeneration: 3,
    maxImageBytes: MAX_IMAGE_BYTES,
  },
  business: {
    monthlyGenerations: 150,
    maxImagesPerGeneration: 5,
    maxImageBytes: MAX_IMAGE_BYTES,
  },
};

export function resolvePlanLimits(
  raw: unknown,
  planId?: PlanId,
): PlanLimitsResolved {
  const parsed = limitsJsonSchema.safeParse(raw);
  const l = parsed.success ? parsed.data : {};
  const fallback = planId ? PLAN_LIMIT_FALLBACKS[planId] : PLAN_LIMIT_FALLBACKS.free;

  return {
    monthlyGenerations: l.monthlyGenerations ?? fallback.monthlyGenerations,
    maxImagesPerGeneration: Math.max(
      1,
      l.maxImagesPerGeneration ?? fallback.maxImagesPerGeneration,
    ),
    maxImageBytes: l.maxImageBytes ?? fallback.maxImageBytes,
  };
}
