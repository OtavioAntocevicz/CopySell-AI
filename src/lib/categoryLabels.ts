/** @module src/lib/categoryLabels.ts */

import { PRODUCT_CATEGORY_VALUES } from "@/domains/listing/schemas";

const labels: Record<(typeof PRODUCT_CATEGORY_VALUES)[number], string> = {
  eletronicos: "Eletrônicos",
  moda: "Moda e acessórios",
  casa_decoracao: "Casa e decoração",
  esporte_lazer: "Esporte e lazer",
  brinquedos: "Brinquedos e hobbies",
  beleza_cuidados: "Beleza e cuidados pessoais",
  automotivo: "Automotivo",
  ferramentas: "Ferramentas e construção",
  outros: "Outros",
};

export function categoryLabel(slug: keyof typeof labels): string {
  return labels[slug] ?? slug;
}

export function categoryOptions() {
  return PRODUCT_CATEGORY_VALUES.map((value) => ({
    value,
    label: labels[value],
  }));
}

export function resolveCategoryLabel(slug: string): string {
  if ((slug as keyof typeof labels) in labels) {
    return labels[slug as keyof typeof labels];
  }
  return slug;
}
