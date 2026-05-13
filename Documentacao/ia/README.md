# IA (geracao de anuncios)

## Conteudo

- [Fluxo de geracao](./fluxo-de-geracao.md)
- [Modelo, prompts e resiliencia](./modelo-prompts-e-resiliencia.md)

## Resumo

- Modelo default: `gemini-2.5-flash` (`DEFAULT_GEMINI_MODEL` em `src/lib/constants.ts`), sobrescrito por `GEMINI_MODEL` no env.
- Entrada multimodal: **texto** (regras ML + produto) + **imagem** (inline base64 na chamada).
- Saida: JSON validado por Zod (`listingAiOutputSchema`).

## Links

- [Seguranca: abuso](../seguranca/README.md)
- [Performance](../performance/README.md)

[Voltar](../README.md)
