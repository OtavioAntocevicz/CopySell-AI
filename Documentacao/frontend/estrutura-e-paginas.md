# Estrutura e paginas

## Mapa de rotas (usuario)

| Rota | Tipo | Descricao |
|------|------|-----------|
| `/` | RSC + client secao planos | Landing; redireciona autenticado |
| `/login`, `/signup` | Client forms | Email/senha + OAuth conforme UI |
| `/planos` | Marketing | Planos publicos |
| `/dashboard` | RSC + lista | Home logada, listings |
| `/dashboard/novo` | Client form + action | Geracao IA |
| `/dashboard/listings/[id]` | Misto | Detalhe, exportacao |
| `/dashboard/planos` | Misto | Planos + pedidos manuais |
| `/dashboard/solicitacoes` | Misto | Historico billing/support |
| `/dashboard/conta` | Perfil | Dados cadastrais |

## Mapa de rotas (admin)

Requer `role = admin` no perfil.

| Rota | Descricao |
|------|-----------|
| `/admin` | Overview estatisticas |
| `/admin/users` | Tabela usuarios, filtros, gestao |
| `/admin/avisos` | Solicitacoes `billing_requests` |
| `/admin/plans` | Edicao metadados planos (onde implementado) |
| `/admin/ia` | Insights comportamento |

## Navegacao

Implementada em `DashboardShell`: sidebar colapsavel, itens condicionais (admin), estado persistido em `localStorage`.

## Links

- [Componentes: DashboardShell](../componentes/modulos-principais.md)
- [Arquitetura App Router](../arquitetura/app-router-e-camadas.md)
