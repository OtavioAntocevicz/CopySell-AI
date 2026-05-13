# Fluxos

## Jornadas de usuario

### Cadastro e primeiro uso

1. `/signup` -> Supabase cria `auth.users` -> trigger cria `profiles` + `credit_balances`.
2. `/dashboard/novo` -> primeira geracao (respeitando free tier e limites).

### Upgrade de plano (manual)

1. `/dashboard/planos` -> usuario escolhe plano e envia telefone.
2. `billing_requests` pendente.
3. Admin em `/admin/avisos` trata e ajusta `profiles` / creditos conforme processo interno.

### Suporte

1. `/dashboard/solicitacoes` ou formulario dedicado -> `kind = support`.

## Fluxos de sistema

- **Sincronia free expirado**: `syncFreeTierExpiry` em `canUserGenerate` pode setar `expired`.
- **Consumo**: ver diagrama em [arquitetura/diagramas](../arquitetura/diagramas.md).

## Links

- [Billing](../billing/README.md)
- [Auth](../auth/README.md)

[Voltar](../README.md)
