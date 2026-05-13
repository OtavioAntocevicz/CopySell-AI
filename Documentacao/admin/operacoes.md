# Operacoes administrativas

## Usuarios

- Alterar plano, status de assinatura, bloqueio.
- Resetar uso do **periodo atual** (apaga linha em `user_usage_monthly`).
- Creditar pacotes via RPC `admin_add_extra_credits`.

## Avisos (billing_requests)

- Tipos: assinatura, creditos, suporte.
- Acoes: abrir modal com `AdminUserManagePanel`, ir para usuario na tabela com highlight, marcar done/dismissed.

## Planos (dados)

- Ajuste de `plans.limits` impacta `resolvePlanLimits` no app - coordenar com QA.

## Links

- [Componentes admin](../componentes/modulos-principais.md)
- [Billing](../billing/README.md)
