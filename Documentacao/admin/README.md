# Admin

## Conteudo

- [Operacoes](./operacoes.md)

## Paineis

| Rota | Funcao |
|------|--------|
| `/admin` | KPIs: usuarios, uso, planos, segmentos |
| `/admin/users` | Lista, filtros, gestao plano/creditos, deep links `?user=` / `?highlight=` |
| `/admin/avisos` | `billing_requests`: filtros, modal gestao usuario, concluir/dispensar |
| `/admin/plans` | Manutencao de planos (conforme UI) |
| `/admin/ia` | Insights a partir de `listing_behavior_events` |

## Permissoes

- Apenas `profiles.role = 'admin'`; enforcement em servidor e SQL.

## Logs

- `logServerInfo` / warn / error em actions criticas (mudanca de plano, creditos, avisos).

## Links

- [API catalogo](../api/catalogo-completo.md)
- [Seguranca](../seguranca/README.md)

[Voltar](../README.md)
