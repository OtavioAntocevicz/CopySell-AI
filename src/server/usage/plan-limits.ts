/** @module src/server/usage/plan-limits.ts */

import { z } from "zod";
import { MAX_IMAGE_BYTES } from "@/lib/constants";

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

export function resolvePlanLimits(raw: unknown): PlanLimitsResolved {
  const parsed = limitsJsonSchema.safeParse(raw);
  const l = parsed.success ? parsed.data : {};
  return {
    monthlyGenerations: l.monthlyGenerations ?? 20,
    maxImagesPerGeneration: Math.max(1, l.maxImagesPerGeneration ?? 1),
    maxImageBytes: l.maxImageBytes ?? MAX_IMAGE_BYTES,
  };
}
