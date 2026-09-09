/** @module src/domains/marketplace/loja-propria/constraints.ts */

import type { ListingConstraints } from "@/domains/marketplace/types";

const BULLET_MIN = 4;
const BULLET_MAX = 6;

/** Regras específicas de página de produto — injetadas em REGRAS_DO_CANAL no user prompt. */
export const lojaPropriaConstraints: ListingConstraints = {
  maxTitleLength: 120,
  bulletCountMin: BULLET_MIN,
  bulletCountMax: BULLET_MAX,
  promptRulesBlock: `
REGRAS ESPECÍFICAS — LOJA PRÓPRIA (MODO FACTUAL)

OBJETIVO

Gerar uma página de produto profissional e factual para e-commerce próprio.

Priorize precisão sobre completude comercial.

Não invente benefícios, aplicações ou especificações para enriquecer a página.

TÍTULO

Campo: title

- Máximo de 120 caracteres.
- Deve identificar claramente o produto.
- Priorize produto principal, marca, modelo e atributo relevante quando confirmados.
- Não adicione especificações ausentes.
- Não use adjetivos promocionais vazios.
- Evite repetir palavras desnecessariamente.

DESCRIÇÃO CURTA

Campo: short_description

- Resumo comercial direto e profissional.
- Use de 2 a 4 frases objetivas.
- Apenas informações confirmadas.
- Não invente benefícios, aplicações ou especificações.
- Não use markdown.

DESCRIÇÃO LONGA

Campo: long_description

- Descrição completa para a página de produto.
- Use parágrafos curtos.
- Estrutura sugerida quando houver dados:
  1. Apresentação do produto (nome, marca, categoria)
  2. Características técnicas confirmadas
  3. Materiais e acabamento visíveis
  4. Itens inclusos (se visíveis)
  5. Informações adicionais confirmadas
- NÃO incluir seção de "benefícios" com inferências.
- NÃO incluir aplicações ou contextos de uso não confirmados.
- NÃO incluir preço, frete ou condições comerciais.
- Não invente informações para preencher uma seção.
- Se faltarem dados, gere descrição menor — não complete com inferências.

BULLETS

Campo: bullets

- Gere de ${BULLET_MIN} a ${BULLET_MAX} itens.
- Priorizar características técnicas e materiais visíveis confirmados.
- NÃO inventar benefícios ou aplicações não confirmadas.
- NÃO transformar características em promessas de desempenho.
- Exemplo correto: "Potência de 2500W indicada no produto."
- Exemplo incorreto: "Motor potente para limpeza profunda."
- Não crie bullets apenas para preencher quantidade.

KEYWORDS FACTUAIS

Campo: keywords

- Gere de 8 a 20 termos.
- Apenas termos confirmados: nome do produto, marca, categoria, características técnicas visíveis.
- NÃO incluir keywords de aplicação inferida (ex.: "limpeza profissional", "ideal para garagem").
- NÃO incluir keywords de benefício inferido (ex.: "alta performance", "fácil transporte").
- NÃO incluir atributos técnicos ausentes, termos promocionais ou características por inferência.
- Exemplo proibido sem ficha técnica: "lavadora profissional", "limpeza pesada", "lavadora para lava-rápido".
- Não use keyword stuffing.

SEO FACTUAL

Campo: export_meta

- meta_title: entre 5 e 70 caracteres. Nome do produto + marca + categoria. Sem clickbait.
- meta_description: entre 10 e 180 caracteres. Resumo factual do produto.
- og_description: entre 10 e 220 caracteres. Descrição para compartilhamento social.
- NÃO incluir promessas de desempenho ou aplicações inferidas no SEO.
- NÃO use: "Perfeita para limpezas pesadas.", "Alta eficiência para uso profissional.", "Maior compatibilidade e durabilidade."
- Prefira: "Conheça a Lavadora de Alta Pressão Tekna HL2500IPM PRO 2500W 220V."
- O SEO deve ser claro e relevante, mas nunca mais criativo do que os dados disponíveis.

SEO_SUGGESTIONS

Campo: seo_suggestions

- Gere de 5 a 12 sugestões práticas.
- Priorize fotos adicionais, ficha técnica, FAQ, compatibilidade, conteúdo da embalagem, garantia.
- Quando um dado estiver ausente, sugira confirmá-lo ou adicioná-lo.
- Não invente que uma informação existe.

NOTAS PARA O VENDEDOR

Campo: export_meta.notes_for_seller

- Mencionar APENAS lacunas reais de informação (ex.: "voltagem não visível", "capacidade não informada").
- Exemplo: "Confirmar pressão máxima, vazão, tipo de motor, acessórios inclusos, peso e garantia antes da publicação."
- NÃO sugerir adicionar benefícios inferidos.
- NÃO sugerir adicionar aplicações ou contextos de uso.
- NÃO sugerir adicionar promessas de desempenho.
- Não invente os valores ausentes.
- Não transforme uma sugestão de confirmação em informação do produto.
- Se todas as informações visíveis foram utilizadas, retorne orientação curta ou array vazio conforme o schema.

EXPORT_META (obrigatório)

- Preencher TODOS os campos: slug, meta_title, meta_description, h1_suggestion, og_description, notes_for_seller.
- slug: ASCII, minúsculas, kebab-case, 3 a 120 caracteres.
- Não invente campos extras além do schema.

REGRAS DE CONFIANÇA

Informações explicitamente fornecidas no nome, nas notas do vendedor ou em dados estruturados podem ser usadas, desde que não entrem em conflito com as imagens.

Características visuais evidentes podem ser descritas, mas não devem ser convertidas em especificações técnicas nem promessas de desempenho.

Se uma informação não estiver confirmada:
- omita da copy;
- não inclua nas keywords;
- não inclua nos metadados;
- quando for importante, mencione a necessidade de confirmação em notes_for_seller ou seo_suggestions.

REGRAS DE REPARO

Quando o bloco de reparo estiver presente:

- Corrija os problemas identificados.
- Preserve o restante do conteúdo que estiver correto.
- Não reescreva desnecessariamente todo o anúncio.
- Não introduza informações novas para resolver erros estruturais.
- Se um erro indicar informação não confirmada, remova ou neutralize a afirmação.
- Continue obedecendo ao schema e às regras de confiança.
`.trim(),
};
