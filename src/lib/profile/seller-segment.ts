/** @module src/lib/profile/seller-segment.ts */

import { z } from "zod";

export const SELLER_SEGMENT_VALUES = ["b2b", "b2c", "both"] as const;

export type SellerSegment = (typeof SELLER_SEGMENT_VALUES)[number];

export const sellerSegmentSchema = z.enum(SELLER_SEGMENT_VALUES);

export function isSellerSegment(v: unknown): v is SellerSegment {
  return sellerSegmentSchema.safeParse(v).success;
}

export function sellerSegmentLabel(
  v: string | null | undefined,
): string {
  switch (v) {
    case "b2b":
      return "Fornecedor (B2B)";
    case "b2c":
      return "Varejista (B2C)";
    case "both":
      return "B2B e B2C";
    default:
      return "Não informado";
  }
}

export const registrationProfileSchema = z.object({
  first_name: z.string().trim().min(1, "Informe o nome").max(80),
  last_name: z.string().trim().min(1, "Informe o sobrenome").max(80),
  phone: z
    .string()
    .trim()
    .min(8, "Telefone muito curto")
    .max(32, "Telefone muito longo"),
  company_name: z.string().trim().max(120).optional(),
  seller_segment: sellerSegmentSchema,
});

export type RegistrationProfileInput = z.infer<typeof registrationProfileSchema>;

export function buildDisplayName(parts: {
  first_name: string;
  last_name: string;
}): string {
  return `${parts.first_name.trim()} ${parts.last_name.trim()}`.trim();
}
