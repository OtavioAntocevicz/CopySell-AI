# Frontend

## Conteudo

- [Estrutura e paginas](./estrutura-e-paginas.md)

## Organizacao

| Pasta | Uso |
|-------|-----|
| `src/components/ui` | Primitivos (Button, Dialog, Input) - estilo design system |
| `src/components/layout` | Shell dashboard, menu usuario |
| `src/components/features` | Fluxos (auth forms, listing form, profile) |
| `src/components/admin` | Tabelas e paineis admin |
| `src/components/dashboard` | UI area usuario (ex.: solicitacoes) |
| `src/components/plans` | Pricing, modais de pedido |
| `src/components/marketing` | Secoes da landing |

## Hooks e estado

- Estado local com `useState` / `useEffect` nos componentes cliente.
- Nao ha Context global de aplicacao documentado; dados vêm de Server Components ou props.
- Formularios criticos usam **Server Actions** ou `useActionState` onde implementado.

## Providers

- Toasts: `sonner` (componente em `src/components/ui/sonner.tsx`).

## Links

- [Componentes](../componentes/README.md)
- [Fluxos](../fluxos/README.md)

[Voltar](../README.md)
