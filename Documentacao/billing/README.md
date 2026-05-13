# Billing e planos

## Conteudo

- [Planos, limites e fluxo manual](./planos-limites-e-fluxo-manual.md)

## Visao geral

- **Planos**: `free`, `pro`, `business` - limites em `public.plans.limits` + camada estatica `PLAN_CATALOG` / `EXTRA_CREDIT_PACKS` para precos de pacotes.
- **Cobranca online**: nao integrada; fluxo **manual** via `billing_requests` ate gateway.
- **Creditos extras**: saldo em `credit_balances`; consumo com RPC `decrement_own_extra_credit`.

## Links

- [Uso e limites (codigo)](../backend/servicos-internos.md)
- [API actions](../api/catalogo-completo.md)

[Voltar](../README.md)
