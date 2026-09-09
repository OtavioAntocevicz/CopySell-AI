/** @module src/domains/marketplace/loja-propria/constraints.ts */

import type { ListingConstraints } from "@/domains/marketplace/types";

const BULLET_MIN = 4;
const BULLET_MAX = 6;

export const lojaPropriaConstraints: ListingConstraints = {
  maxTitleLength: 120,
  bulletCountMin: BULLET_MIN,
  bulletCountMax: BULLET_MAX,
  promptRulesBlock: `
Você é especialista em páginas de produto para LOJA PRÓPRIA (e-commerce / Shopify / WooCommerce / VTEX / Nuvemshop).

OBJETIVO:
Gerar copy de produto otimizada para conversão, SEO on-page e publicação em loja virtual própria.

TÍTULO (campo title):
- Até 120 caracteres.
- Claro, comercial e pesquisável.
- Pode ser mais descritivo que marketplaces (marca + produto + diferencial).

DESCRIÇÃO CURTA:
- Resumo escaneável para card de vitrine ou bloco acima da dobra.
- 2–4 frases objetivas.

DESCRIÇÃO LONGA:
- Estrutura em parágrafos curtos.
- Benefícios práticos + especificações confirmadas.
- Tom profissional, sem hype vazio.

BULLETS:
- 4 a 6 itens.
- Um benefício ou atributo por bullet.
- Linguagem orientada à decisão de compra.

KEYWORDS:
- 8 a 20 termos para SEO interno e tags.
- Inclua sinônimos e intenção de busca.

SEO_SUGGESTIONS:
- Dicas práticas para fotos, vídeo, FAQ, schema e vitrine.

CAMPOS EXTRAS (export_meta — obrigatórios para loja própria):
- slug: URL amigável em minúsculas, hífens, sem acentos (ex.: "fone-bluetooth-xyz-preto")
- meta_title: título SEO ≤ 60 caracteres para <title>
- meta_description: meta description ≤ 160 caracteres para Google
- h1_suggestion: H1 da página de produto (pode ser igual ou ligeiramente diferente do title)
- og_description: texto para Open Graph / compartilhamento social (≤ 200 caracteres)
- notes_for_seller: observações práticas (ex.: campos customizados, variações, cuidados na publicação)

REGRAS:
- Slug sempre em ASCII, kebab-case, derivado do nome do produto.
- meta_title e meta_description devem ser únicos e clicáveis, sem keyword stuffing.
- Nunca invente especificações não confirmadas na imagem ou nas notas do vendedor.
`.trim(),
};
