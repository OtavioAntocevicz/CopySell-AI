# Modelo, prompts e resiliencia

## Modelo e configuracao

| Variavel / constante | Valor / papel |
|---------------------|---------------|
| `GEMINI_API_KEY` | Obrigatoria no servidor |
| `GEMINI_MODEL` | Opcional; fallback `gemini-2.5-flash` |
| `GEMINI_TIMEOUT_MS` | 60s por tentativa |
| `GEMINI_TRANSIENT_MAX_ATTEMPTS` | 3 tentativas |
| `GEMINI_TRANSIENT_RETRY_BASE_MS` | Backoff exponencial a partir de 1200ms |

## Prompt engineering

- **System**: `SYSTEM_ML_LISTING_V3` - regras fixas orientadas a marketplaces (conteudo em `mercado-livre-v3.ts`).
- **User**: texto estruturado com nome, categoria (PT), bloco de restricoes do marketplace (`constraints.promptRulesBlock`), notas do vendedor.
- **Versao**: `PROMPT_VERSION_ML_V3` gravada no listing para rastreabilidade.

## Multimodal

- Imagem enviada como `inlineData` (base64) junto da parte textual no mesmo `generateContent`.

## Custos estimados (qualitativo)

- Custo cresce com **tamanho da imagem** e **tokens** de saida; ha teto de imagem 2MB padrao.
- Monitorar quotas Google Cloud do projeto da chave.

## Anti-abuso

- Limite por **plano + ciclo** e **creditos**; bloqueio admin; sem rate limit distribuido documentado (ver seguranca).

## Fallbacks e erros

- Retry em erros **transientes** (502/503/504, mensagens de sobrecarga).
- Erros de schema JSON: segunda chamada com instrucao de reparo.
- Erros expostos ao usuario via `explainListingFailure` / mapas de erro.

## Cache

- Nao ha cache de respostas Gemini no servidor nesta versao.

## Links

- [Constantes no codigo](../../src/lib/constants.ts)
- [Seguranca](../seguranca/README.md)
