import { describe, expect, it } from "vitest";
import {
  generateListingFormSchema,
  listingAiOutputSchema,
  lojaPropriaOutputSchema,
} from "@/domains/listing/schemas";

describe("generateListingFormSchema", () => {
  it("accepts valid payload", () => {
    const r = generateListingFormSchema.safeParse({
      marketplace: "mercado_livre",
      productName: "Fone",
      category: "eletronicos",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.sellerNotes).toBeUndefined();
  });

  it("accepts optional seller notes", () => {
    const r = generateListingFormSchema.safeParse({
      marketplace: "loja_propria",
      productName: "Fone",
      category: "eletronicos",
      sellerNotes: "  127 V, cor azul  ",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.sellerNotes).toBe("127 V, cor azul");
  });

  it("treats blank seller notes as absent", () => {
    const r = generateListingFormSchema.safeParse({
      marketplace: "mercado_livre",
      productName: "Fone",
      category: "eletronicos",
      sellerNotes: "   \n  ",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.sellerNotes).toBeUndefined();
  });

  it("rejects short name", () => {
    const r = generateListingFormSchema.safeParse({
      marketplace: "mercado_livre",
      productName: "a",
      category: "eletronicos",
    });
    expect(r.success).toBe(false);
  });
});

describe("listingAiOutputSchema", () => {
  it("parses complete object", () => {
    const r = listingAiOutputSchema.safeParse({
      title: "Título de produto exemplo até 60 chars aqui",
      short_description: "x".repeat(40),
      long_description: "y".repeat(100),
      bullets: ["bullet um", "bullet dois", "bullet tres", "bullet quatro"],
      keywords: ["k1", "k2", "k3", "k4", "k5"],
      seo_suggestions: ["seo1", "seo2", "seo3"],
    });
    expect(r.success).toBe(true);
  });

  it("requires store meta for loja própria", () => {
    const base = {
      title: "Título de produto exemplo até 60 chars aqui",
      short_description: "x".repeat(40),
      long_description: "y".repeat(100),
      bullets: ["bullet um", "bullet dois", "bullet tres", "bullet quatro"],
      keywords: ["k1", "k2", "k3", "k4", "k5"],
      seo_suggestions: ["seo1", "seo2", "seo3"],
    };
    expect(lojaPropriaOutputSchema.safeParse(base).success).toBe(false);
    expect(
      lojaPropriaOutputSchema.safeParse({
        ...base,
        export_meta: {
          slug: "fone-bluetooth-xyz",
          meta_title: "Fone Bluetooth XYZ | Loja",
          meta_description: "Fone bluetooth com cancelamento de ruído e bateria longa para o dia a dia.",
          h1_suggestion: "Fone Bluetooth XYZ",
          og_description: "Conheça o Fone Bluetooth XYZ — conforto e som claro para seu dia.",
        },
      }).success,
    ).toBe(true);
  });
});
