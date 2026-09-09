/** @module src/domains/marketplace/loja-propria/constraints.ts */

import type { ListingConstraints } from "@/domains/marketplace/types";

const BULLET_MIN = 4;
const BULLET_MAX = 6;

/** Checklist compacto — reforço por proximidade à tarefa. Doutrina em SYSTEM_LOJA_PROPRIA_V1. */
export const lojaPropriaConstraints: ListingConstraints = {
  maxTitleLength: 120,
  bulletCountMin: BULLET_MIN,
  bulletCountMax: BULLET_MAX,
  promptRulesBlock: `
CHECKLIST_LOJA_PROPRIA (reforço — regras completas no system):

Limites:
- title: máx. 120 caracteres
- bullets: ${BULLET_MIN} a ${BULLET_MAX}
- keywords: 8 a 20
- seo_suggestions: 5 a 12
- export_meta.slug: 3-120 chars, kebab-case ASCII
- export_meta.meta_title: até 70 caracteres
- export_meta.meta_description: até 180 caracteres
- export_meta.h1_suggestion: até 150 caracteres
- export_meta.og_description: até 220 caracteres
- export_meta.notes_for_seller: até 2000 caracteres

export_meta é OBRIGATÓRIO nesta resposta — nunca omita o objeto, mesmo que algum campo interno fique mais curto por falta de informação confirmada.

Nunca invente especificação não confirmada na imagem ou nas notas do vendedor — vale para todos os campos, inclusive dentro de export_meta.
meta_title e meta_description devem ser únicos, clicáveis e sem keyword stuffing.
`.trim(),
};
