/** @module src/server/ai/prompts/loja-propria-v1.ts */

import type { MarketplaceId } from "@/domains/marketplace/types";
import { PROMPT_VERSION_LOJA_V1 } from "@/lib/constants";

export const SYSTEM_LOJA_PROPRIA_V1 = `
Você é um especialista em copywriting e SEO para LOJAS PRÓPRIAS (e-commerce).

OBJETIVO:
Gerar conteúdo de página de produto otimizado para conversão, SEO on-page e publicação em plataformas como Shopify, WooCommerce, VTEX ou Nuvemshop.

RESPOSTA:
- Responda apenas JSON válido.
- Obedeça exatamente ao schema solicitado.
- Não utilize markdown.
- Não escreva texto fora do JSON.

REGRAS_CRÍTICAS:
- Nunca invente marca, modelo, potência, compatibilidade, capacidade, medidas, garantia ou especificações técnicas.
- Se houver dúvida, omita.
- Prefira menos detalhes corretos do que informações inventadas.

ESTILO:
- Profissional, persuasivo sem hype vazio.
- Parágrafos curtos e escaneáveis.
- Benefícios ligados a atributos confirmados.

CAMPOS export_meta (OBRIGATÓRIOS):
- slug: URL amigável (minúsculas, hífens, sem acentos, ASCII)
- meta_title: ≤ 60 caracteres para tag <title>
- meta_description: ≤ 160 caracteres para meta description
- h1_suggestion: título H1 da página
- og_description: ≤ 200 caracteres para Open Graph
- notes_for_seller: dicas práticas de publicação na loja

TÍTULO (title): até 120 caracteres, comercial e descritivo.
BULLETS: 4 a 6 itens, um benefício/atributo por item.
KEYWORDS: 8 a 20 termos para SEO interno.
SEO_SUGGESTIONS: 5 a 12 dicas acionáveis (fotos, FAQ, schema, vitrine).
`.trim();

export type BuildUserPayloadInput = {
  marketplace: MarketplaceId;
  productName: string;
  categoryLabel: string;
  constraintsBlock: string;
  sellerNotes?: string;
  repairHint?: string;
};

export function buildLojaPropriaUserPayload(input: BuildUserPayloadInput): string {
  const sellerBlock = input.sellerNotes
    ? `\n\nINFORMACOES_DO_VENDEDOR:\n${input.sellerNotes}`
    : "";

  const repairBlock = input.repairHint
    ? `\n\nERROS_IDENTIFICADOS:\n${input.repairHint}\nCorrija mantendo consistência.`
    : "";

  return `
CANAL:
${input.marketplace}

NOME_BASE_PRODUTO:
${input.productName}

CATEGORIA:
${input.categoryLabel}
${sellerBlock}

REGRAS_DO_CANAL:
${input.constraintsBlock}

HIERARQUIA_DE_CONFIANCA:
1. ALTA: texto legível na imagem, specs visíveis, notas do vendedor coerentes com a foto.
2. MÉDIA: características visuais evidentes sem números inventados.
3. BAIXA: contexto de uso neutro da categoria.
4. PROIBIDO: inferir marca, modelo, potência ou specs não verificáveis.

SCHEMA JSON ESPERADO:
{
  "title": "string",
  "short_description": "string",
  "long_description": "string",
  "bullets": ["string", ...],
  "keywords": ["string", ...],
  "seo_suggestions": ["string", ...],
  "export_meta": {
    "slug": "string-kebab-case",
    "meta_title": "string",
    "meta_description": "string",
    "h1_suggestion": "string",
    "og_description": "string",
    "notes_for_seller": "string"
  }
}

TAREFA:
1. Analise a(s) imagem(ns) anexada(s).
2. Gere copy para loja própria com slug e meta tags.
3. Retorne apenas JSON válido.
${repairBlock}
`.trim();
}

export const LISTING_PROMPT_VERSION = PROMPT_VERSION_LOJA_V1;
