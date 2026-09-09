/** @module src/domains/marketplace/mercado-livre/constraints.ts */

import type { ListingConstraints } from "../types";

const BULLET_MIN = 4;
const BULLET_MAX = 6;

/**
 * Checklist compacto injetado no user prompt — reforço por proximidade à tarefa.
 * A doutrina completa está em SYSTEM_ML_LISTING_V3.
 */
export const mercadoLivreConstraints: ListingConstraints = {
  maxTitleLength: 60,
  bulletCountMin: BULLET_MIN,
  bulletCountMax: BULLET_MAX,
  promptRulesBlock: `
CHECKLIST_MERCADO_LIVRE (reforço — regras completas no system):

Limites:
- title: máx. 60 caracteres
- bullets: ${BULLET_MIN} a ${BULLET_MAX}
- keywords: 8 a 20
- seo_suggestions: 5 a 12

Nunca use (adjetivo/promoção vazia):
"ótima qualidade" · "excelente" · "imperdível" · "lindo" · "super" · "perfeito" · "garantido" · "o melhor" · "sem igual"

Nunca use (promessa/exagero):
"100%..." · "garantimos..." · "maior do Brasil"

Nunca use:
- Emojis e símbolos chamativos em excesso (!!!, ***, ____)
- Números/specs técnicas não verificáveis (voltagem, capacidade, dimensões, compatibilidade específica, certificação)

Título — se marca/modelo/atributo não estiverem confirmados: omita, não substitua por termo genérico.
Keywords — termo principal + sinônimos naturais + variações populares + atributos pesquisáveis (somente confirmados).
SEO — cubra variações e atributos esperados da categoria; não repita o título inteiro várias vezes.
`.trim(),
};
