import { describe, expect, it } from "vitest";
import { escapeCsvField, rowsToCsv } from "@/lib/csv";
import { toMarketplaceCsvRow } from "@/domains/marketplace/mercado-livre/export";

describe("csv", () => {
  it("escapeCsvField quotes when needed", () => {
    expect(escapeCsvField("ok")).toBe("ok");
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField("a,b")).toBe('"a,b"');
  });

  it("rowsToCsv joins header and rows", () => {
    const csv = rowsToCsv(["a", "b"], [{ a: "1", b: "two" }]);
    expect(csv).toBe("a,b\r\n1,two");
  });
});

describe("toMarketplaceCsvRow", () => {
  it("maps listing export payload", () => {
    const row = toMarketplaceCsvRow({
      productName: "Produto X",
      category: "eletronicos",
      title: "Título",
      shortDescription: "Curta",
      longDescription: "Longa",
      bullets: ["a", "b"],
      keywords: ["k1", "k2"],
    });
    expect(row.titulo).toBe("Título");
    expect(row.bullets).toBe("a | b");
    expect(row.palavras_chave).toBe("k1, k2");
  });
});
