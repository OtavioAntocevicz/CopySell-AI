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
REGRAS ESPECÍFICAS — LOJA PRÓPRIA

OBJETIVO

Gerar uma página de produto profissional para e-commerce próprio, adequada para plataformas como Shopify, WooCommerce, VTEX, Nuvemshop ou sistemas internos.

A página deve combinar:
- clareza comercial;
- informação técnica;
- SEO on-page;
- escaneabilidade;
- confiança;
- intenção de compra.

Não escreva apenas uma descrição curta. Gere conteúdo estruturado para uma página de produto.

TÍTULO

Campo: title

- Máximo de 120 caracteres.
- Deve identificar claramente o produto.
- Priorize produto principal, marca, modelo e atributo relevante quando confirmados.
- Não adicione especificações ausentes.
- Não use adjetivos promocionais vazios.
- Evite repetir palavras desnecessariamente.
- O título deve ser compreensível para o comprador e útil para busca.

DESCRIÇÃO CURTA

Campo: short_description

- Escreva um resumo comercial para card de vitrine ou área acima da dobra.
- Use de 2 a 4 frases objetivas.
- Explique o que é o produto, para que serve e qual característica confirmada merece destaque.
- Não invente benefícios, aplicações ou especificações.
- Não use markdown.
- Evite repetir o título integralmente.

DESCRIÇÃO LONGA

Campo: long_description

- Escreva uma descrição completa para a página de produto.
- Use parágrafos curtos.
- Apresente o produto de forma clara.
- Explique benefícios práticos somente quando ligados a características confirmadas.
- Inclua aplicações somente quando confirmadas ou quando forem contextos neutros e plausíveis da categoria.
- Inclua especificações técnicas somente quando confirmadas.
- Inclua conteúdo da embalagem e garantia somente quando confirmados.
- Não invente informações para preencher uma seção.
- Não use markdown.
- Não use listas com marcadores dentro da string.
- Não repita a mesma informação em vários parágrafos.
- Não transforme a descrição em texto institucional ou genérico.

A descrição deve ser informativa e comercial, mas não deve parecer uma redação artificial.

BULLETS

Campo: bullets

- Gere de ${BULLET_MIN} a ${BULLET_MAX} itens.
- Cada item deve expressar uma única ideia.
- Priorize atributos confirmados e seus benefícios práticos.
- Use frases curtas e objetivas.
- Comece com capitalização normal.
- Não use markdown.
- Não use listas internas.
- Não repita o mesmo benefício em bullets diferentes.
- Não invente especificações.
- Não use adjetivos vazios.
- Não crie bullets apenas para preencher quantidade.

Exemplo de estrutura:
"[Característica confirmada] + [benefício prático relacionado]"

KEYWORDS

Campo: keywords

- Gere de 8 a 20 termos.
- Inclua o produto principal.
- Inclua sinônimos naturais.
- Inclua atributos confirmados.
- Inclua aplicações confirmadas ou contexto neutro relevante.
- Inclua marca e modelo quando confirmados.
- Evite termos genéricos isolados.
- Evite variações quase idênticas.
- Não repita a mesma ideia com pequenas mudanças.
- Não inclua atributos não confirmados.
- Não use keywords de produtos semelhantes.

SEO_SUGGESTIONS

Campo: seo_suggestions

- Gere de 5 a 12 sugestões práticas.
- As sugestões devem ajudar o vendedor a melhorar a página.
- Priorize:
  - fotos adicionais;
  - imagem de detalhes;
  - ficha técnica;
  - FAQ;
  - informações de compatibilidade;
  - conteúdo da embalagem;
  - garantia;
  - vídeo demonstrativo;
  - organização da página;
  - dados estruturados;
  - links internos;
  - clareza do título e H1.
- Não invente que uma informação existe.
- Quando um dado estiver ausente, sugira confirmá-lo ou adicioná-lo.
- Não escreva sugestões genéricas como "melhore o SEO" sem explicar como.

EXPORT_META

Campo obrigatório: export_meta

slug:
- Derive do nome do produto.
- Use apenas ASCII.
- Use letras minúsculas, números e hífens.
- Remova acentos.
- Não use barras, espaços ou caracteres especiais.
- Evite hífens duplicados.
- O slug deve ter entre 3 e 120 caracteres.
- Não inclua informações não confirmadas.

meta_title:
- Entre 5 e 70 caracteres.
- Deve ser claro, relevante e adequado para o título SEO.
- Priorize produto, marca e modelo quando confirmados.
- Não use keyword stuffing.
- Não use promessas exageradas.

meta_description:
- Entre 10 e 180 caracteres.
- Resuma o produto e seu principal diferencial confirmado.
- Use linguagem natural.
- Não invente especificações.
- Não use promessas absolutas.

h1_suggestion:
- Entre 3 e 150 caracteres.
- Deve ser um título claro para a página.
- Pode ser semelhante ao title, mas não deve ser artificialmente diferente.
- Não inclua atributos não confirmados.

og_description:
- Entre 10 e 220 caracteres.
- Deve funcionar como descrição de compartilhamento.
- Seja claro e comercial.
- Não use hype vazio.
- Não invente informações.

notes_for_seller:
- Forneça orientações práticas para publicação.
- Aponte informações importantes que não foram confirmadas.
- Sugira imagens, campos ou dados que deveriam ser adicionados.
- Não invente dados do produto.
- Não trate sugestões como fatos.
- Se não houver pendências relevantes, informe uma orientação curta e útil.

REGRAS DE CONFIANÇA

Informações explicitamente fornecidas no nome, nas notas do vendedor ou em dados estruturados podem ser usadas, desde que não entrem em conflito com as imagens.

Características visuais evidentes podem ser descritas, mas não devem ser convertidas em especificações técnicas.

Se uma informação não estiver confirmada:
- omita da copy;
- não inclua nas keywords;
- não inclua nos metadados;
- quando for importante para a decisão de compra, mencione a necessidade de confirmação em notes_for_seller ou seo_suggestions.

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
