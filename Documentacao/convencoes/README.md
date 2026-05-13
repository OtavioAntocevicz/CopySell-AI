# Convencoes do projeto

## Nomes

- **Arquivos**: kebab-case para rotas Next; componentes em PascalCase (`AdminUsersTable.tsx`).
- **Funcoes**: camelCase; tipos exportados PascalCase.
- **Constantes**: UPPER_SNAKE em `constants.ts`.

## Imports

- Alias `@/` para `src/`.
- Ordem sugerida: externos -> `@/server` -> `@/components` -> `@/lib` -> relativos.

## Componentes React

- Um componente principal por arquivo (excecao: colocated small helpers).
- `"use client"` apenas na fronteira que precisa de estado ou eventos DOM.

## Server

- `"use server"` no topo do arquivo de actions.
- Sem logica de negocio pesada em `page.tsx` - preferir `src/server` ou actions dedicadas.

## Tipagem

- TypeScript strict conforme `tsconfig`.
- Validacao runtime com Zod para dados externos (forms, JSON IA).

## Texto na UI

- Placeholder de valor ausente: hifen ASCII `-` (nao travessao unicode).

## Links

- [Manutencao](../manutencao/README.md)
- [INDICE](../INDICE.md)

[Voltar](../README.md)
