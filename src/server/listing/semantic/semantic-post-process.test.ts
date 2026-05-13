import { describe, expect, it } from "vitest";
import { dedupeKeywordsStable } from "@/server/listing/semantic/keyword-dedupe";
import { combinedKeywordSimilarity } from "@/server/listing/semantic/text-utils";
import { semanticPostProcess } from "@/server/listing/semantic/semantic-post-process";
import type { ListingAiOutput } from "@/domains/listing/schemas";

describe("combinedKeywordSimilarity", () => {
  it("detects near-duplicate phrases", () => {
    expect(
      combinedKeywordSimilarity("fone gamer", "headset gamer"),
    ).toBeGreaterThan(0.55);
  });
});

describe("dedupeKeywordsStable", () => {
  it("removes redundant keywords but keeps minKeep", () => {
    const input = [
      "fone gamer",
      "headset gamer",
      "fone para jogos",
      "headset para jogos",
      "audio estereo",
      "microfone embutido",
      "conexao bluetooth",
      "cor preta",
    ];
    const out = dedupeKeywordsStable(input, {
      minKeep: 5,
      similarityThreshold: 0.58,
    });
    expect(out.length).toBeGreaterThanOrEqual(5);
    expect(out.length).toBeLessThan(input.length);
  });

  it("returns original when dedupe would drop below minKeep", () => {
    const input = ["a", "b", "c", "d", "e"];
    const out = dedupeKeywordsStable(input, {
      minKeep: 5,
      similarityThreshold: 0.99,
    });
    expect(out).toEqual(input);
  });
});

describe("semanticPostProcess", () => {
  const baseOutput: ListingAiOutput = {
    title: "Furadeira parafusadeira brushless premium excelente produto",
    short_description:
      "Furadeira com motor brushless e alta qualidade. Ideal para qualquer serviço. Praticidade e eficiência.",
    long_description:
      "Produto premium com ampla gama de trabalhos. Motor brushless de alta performance. " +
      "E importante ressaltar que oferece excelente experiência. ".repeat(12),
    bullets: [
      "Motor brushless com torque ajustavel",
      "Corpo em plastico resistente ao uso diario",
      "Led integrado para iluminar o ponto de trabalho",
      "Empunhadura antiderrapante para maior controle",
    ],
    keywords: [
      "furadeira impacto",
      "furadeira com impacto",
      "parafusadeira",
      "ferramenta eletrica",
      "motor brushless",
      "127v",
    ],
    seo_suggestions: [
      "Use fotos nítidas do produto",
      "Informe voltagem compatível com sua região",
      "Destaque acessórios inclusos",
    ],
  };

  const ctx = {
    productName: "Parafusadeira a bateria 12V",
    category: "ferramentas" as const,
    categoryLabel: "Ferramentas",
    sellerNotes: undefined,
    maxTitleLength: 60,
  };

  it("strips unsupported claims and hype when not in evidence", () => {
    const { output, reverted } = semanticPostProcess(baseOutput, ctx);
    expect(reverted).toBe(false);
    expect(output.title.toLowerCase()).not.toContain("brushless");
    expect(output.short_description.toLowerCase()).not.toContain(
      "alta qualidade",
    );
    expect(output.keywords.join(" ").toLowerCase()).not.toContain("127v");
    expect(output.keywords.join(" ").toLowerCase()).not.toContain("brushless");
  });
});
