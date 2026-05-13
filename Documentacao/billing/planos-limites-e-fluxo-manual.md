# Planos, limites e fluxo manual

## Estados do usuario (conceituais)

| Estado | Condicao tipica | Pode gerar? |
|--------|-----------------|-------------|
| Free trial | `plan_id = free`, `subscription_status = active`, dentro de `free_tier_ends_at` | Sim, ate limite do plano free |
| Free expirado | Apos `free_tier_ends_at` | Nao (`expired` apos sync) |
| Pro/Business ativo | Plano pago, `subscription_status = active` | Sim, ate limite mensal do ciclo |
| Limite mensal atingido | Uso ciclo >= cap | Sim **se** tiver credito extra; senao nao |
| Bloqueado | `blocked_at` setado | Nao |
| Inativo / cancelado | status != active (conforme regra em `canUserGenerate`) | Nao |

## Ciclo de uso

- Ancora: `billing_cycle_anchor_at` (ou `created_at` como fallback).
- Periodo atual: calculado em `usage/billing-period.ts`; chave armazenada em `user_usage_monthly.period`.

## Upgrade / downgrade

- **Hoje**: admin altera `plan_id` e campos relacionados, ou usuario abre pedido em `billing_requests`.
- **Webhooks / gateway**: nao implementados - documentar quando existir integracao.

## Creditos extras

- Compra solicitada via UI -> linha `billing_requests` tipo `credit_purchase`.
- Admin confirma e executa `adminAddExtraCreditsToUser` (RPC).
- Consumo na geracao quando limite mensal esgotado (ver `usage-service.ts`).

## Links

- [Fluxos: jornada billing](../fluxos/README.md)
- [Admin](../admin/README.md)
