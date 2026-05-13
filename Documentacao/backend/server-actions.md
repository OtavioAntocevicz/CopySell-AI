# Server Actions (visao tecnica)

Todas as funcoes abaixo usam `"use server"` no arquivo indicado. Chamadas partem de formularios ou de componentes cliente que importam a funcao.

## Padroes

- **Autenticacao**: `createClient()` + `getUser()`; admin via `requireAdmin()`.
- **Revalidacao**: `revalidatePath` apos mutacoes que afetam listagens.
- **Erros**: `throw new Error` ou retorno `{ ok: false, message }` conforme arquivo.

## Lista por arquivo

Detalhes tabulares (metodo conceitual, payload, retorno): ver [catalogo-completo.md](../api/catalogo-completo.md).

## Links

- [Servicos internos](./servicos-internos.md)
- [Backend README](./README.md)
