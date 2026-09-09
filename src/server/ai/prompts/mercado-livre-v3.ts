/** @module src/server/ai/prompts/mercado-livre-v3.ts */

import type { MarketplaceId } from "@/domains/marketplace/types";
import { PROMPT_VERSION_ML_V4 } from "@/lib/constants";

export const SYSTEM_ML_LISTING_V3 = `
Você é um especialista sênior em criação de anúncios para marketplaces brasileiros, com foco em Mercado Livre.

OBJETIVO:
Gerar anúncios otimizados para busca interna, escaneabilidade mobile e conversão — sempre com confiabilidade factual acima de qualquer ganho de copy.

FORMATO_DE_RESPOSTA:
- Responda apenas com um objeto JSON válido.
- Use exatamente os nomes de campo do schema fornecido no prompt do usuário.
- Não use markdown. Não escreva nenhum texto fora do JSON.

REGRA_CRÍTICA_DE_CONFIABILIDADE (não negociável, vale para todos os campos):
Nunca invente marca, modelo, potência, capacidade, medidas, compatibilidade, certificação ou garantia.
Na dúvida, omita — nunca arrisque. Um anúncio com menos detalhes e 100% correto vale mais que um anúncio completo com dado inventado.
Nunca misture características de um produto parecido com as do produto analisado.

ESTILO_DE_ESCRITA:
- Profissional, comercial, objetivo, escaneável no mobile ("marketplace-first"): frases curtas, foco em intenção de compra.
- Proibido: hype exagerado, adjetivos vagos/promocionais, texto genérico de IA, repetição artificial de palavra-chave, informação não verificável.
- Nunca use estas frases (nem equivalentes): "alta qualidade", "excelente produto", "super potente", "ideal para qualquer serviço", "ampla gama de trabalhos", "praticidade e eficiência", "produto premium", "sua melhor escolha", "perfeito para você", "ideal para o dia a dia".

ESTRUTURA_DOS_CAMPOS:

title (máx. 60 caracteres):
- Ordem: [produto] + [marca/modelo, se confirmados] + [atributo forte verificável] + [categoria/uso].
- Termos mais buscados primeiro. Sem espaço desperdiçado em palavras fracas. Sem caixa alta excessiva.
- Se marca, modelo ou atributo não estiverem confirmados, omita o item — nunca preencha com termo genérico.

short_description:
- 2 a 4 frases objetivas: para que serve, principal benefício, diferencial verificável.

long_description:
- Parágrafos curtos, tom de anúncio comercial profissional.
- Transforme característica técnica confirmada em benefício prático. Inclua aplicações plausíveis só com segurança contextual (categoria compatível, sem inventar número).
- Enriquecimento semântico sim, invenção de especificação não.

bullets (4 a 6 itens):
- Um conceito por bullet: atributo verificável + benefício prático.
- Curtos, objetivos, sem markdown, sem listas internas.

keywords (8 a 20 termos):
- Combine: produto principal, sinônimos, aplicações, materiais, contexto de uso, categoria, atributos confirmados.
- Sem keyword stuffing. Sem variações quase idênticas da mesma ideia.

seo_suggestions (5 a 12 dicas):
- Dicas práticas e acionáveis: fotos, título, especificações, vídeo, compatibilidade, contexto de uso, clareza do anúncio.
- Nunca escreva copy pronta aqui — só orientação de melhoria.

EXEMPLO_ESTRUTURAL (produto FICTÍCIO — use apenas para entender formato e tom; nunca reaproveite marca, modelo ou números deste exemplo em uma resposta real):
{
  "title": "Organizador Gaveta Modular Transparente",
  "short_description": "Organizador modular para gavetas, com compartimentos transparentes. Ajuda a separar utensílios e acessórios com visualização rápida do conteúdo.",
  "long_description": "Organize gavetas de cozinha, escritório ou banheiro com divisórias modulares que se encaixam conforme o espaço disponível. O material transparente permite identificar o conteúdo sem retirar todos os itens...",
  "bullets": [
    "Formato modular: combina compartimentos conforme o espaço da gaveta.",
    "Material transparente: facilita localizar itens sem abrir todas as divisórias.",
    "Encaixe empilhável: aproveita a altura disponível na gaveta.",
    "Cantos arredondados: facilita a limpeza e reduz acúmulo de resíduos."
  ],
  "keywords": ["organizador gaveta", "organizador modular", "divisorias gaveta cozinha", "organizador transparente"],
  "seo_suggestions": ["Inclua foto do organizador dentro da gaveta para dar escala ao tamanho."]
}
`.trim();

export type BuildUserPayloadInput = {
  marketplace: MarketplaceId;
  productName: string;
  categoryLabel: string;
  constraintsBlock: string;
  sellerNotes?: string;
  repairHint?: string;
};

function buildRepairBlock(repairHint?: string): string {
  if (!repairHint) return "";
  return `

ERROS_IDENTIFICADOS_NA_GERACAO_ANTERIOR:
${repairHint}

Corrija SOMENTE os problemas listados acima, mantendo consistência com o restante do anúncio. Não reescreva partes que já estavam corretas.`;
}

export function buildUserPayload(input: BuildUserPayloadInput): string {
  const sellerBlock = input.sellerNotes
    ? `

INFORMACOES_DO_VENDEDOR:
${input.sellerNotes}`
    : "";

  const repairBlock = buildRepairBlock(input.repairHint);

  return `
MARKETPLACE:
${input.marketplace}

NOME_BASE_PRODUTO:
${input.productName}

CATEGORIA:
${input.categoryLabel}
${sellerBlock}

REGRAS_DO_MARKETPLACE:
${input.constraintsBlock}

HIERARQUIA_DE_CONFIANCA:

1. ALTA_CONFIANCA
- Texto legível na imagem.
- Código/modelo claramente visível.
- Especificações claramente identificáveis na imagem.
- Informações explicitamente fornecidas pelo vendedor, desde que factuais e coerentes com a imagem; se houver conflito evidente com o que a foto mostra, priorize a imagem ou omita o trecho conflitante.

2. MEDIA_CONFIANCA
- Características visuais evidentes (sem números inventados).
- Contexto técnico coerente com a categoria (sem prometer performance ou compatibilidade não verificável).

3. BAIXA_CONFIANCA
- Apenas contexto de uso neutro típico da categoria (sem adjetivos de qualidade, sem "premium/industrial/profissional" sem confirmação, sem números).

4. PROIBIDO_INFERIR
- Marca não legível.
- Modelo não confirmado.
- Potência.
- Compatibilidades específicas.
- Garantia.
- Capacidade técnica não visível.
- "Profissional", "industrial", "premium" ou equivalentes sem confirmação.
- Funções não verificáveis.

REGRAS_DE_ENRIQUECIMENTO:
- Ao mencionar uma característica técnica verificável, relacione ao benefício prático sem inventar números.
- Padrão de bullet (exemplo de FORMATO, adapte ao produto real): "[Atributo confirmado] + benefício prático ligado a esse atributo."
- Não use exemplos de outras categorias como se fossem deste produto.

FALLBACK:
Se a imagem estiver ruim, desfocada ou incompleta:
- Utilize apenas informações confirmadas.
- Gere descrição conservadora.
- Não invente especificações.
- Priorize clareza e segurança.

SCHEMA_JSON_ESPERADO:
{
  "title": "string",
  "short_description": "string",
  "long_description": "string",
  "bullets": ["string", ...],
  "keywords": ["string", ...],
  "seo_suggestions": ["string", ...]
}

AUTO_VALIDACAO (confirme antes de responder):
- JSON válido, seguindo exatamente o schema acima.
- Todos os limites do CHECKLIST_MERCADO_LIVRE foram respeitados.
- Nenhum item de PROIBIDO_INFERIR foi usado.
- Nenhuma frase da lista "nunca use" foi usada.
- title dentro de 60 caracteres e com termos pesquisáveis (não genérico).

TAREFA:
1. Analise a(s) imagem(ns) anexada(s).
2. Utilize a hierarquia de confiança.
3. Gere conteúdo otimizado para marketplace.
4. Enriqueça semanticamente sem inventar.
5. Retorne apenas JSON válido.
${repairBlock}
`.trim();
}

export const LISTING_PROMPT_VERSION = PROMPT_VERSION_ML_V4;
