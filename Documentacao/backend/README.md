# Backend

O "backend" deste projeto e predominantemente **Next.js Server** + **Supabase** (Postgres/Auth/Storage). Nao ha servidor Express separado.

## Conteudo

- [Server Actions (contratos)](./server-actions.md)
- [Servicos internos (dominio)](./servicos-internos.md)

## Integracoes externas

| Sistema | Uso |
|---------|-----|
| Supabase | Persistencia, auth, storage, RPC |
| Google Gemini | Geracao JSON do anuncio |

## Tratamento de erros

- Erros de dominio mapeados em `src/lib/errors.ts` e `listingFailure.ts` para mensagens de UI.
- Logs estruturados: `src/lib/logger.ts` (`logServerInfo`, `logServerWarn`, `logServerError`).

## Links

- [Catalogo API / Actions](../api/catalogo-completo.md)
- [Seguranca](../seguranca/README.md)

[Voltar](../README.md)
