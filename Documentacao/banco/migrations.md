# Migrations

## Arquivo atual

| Arquivo | Descricao |
|---------|-----------|
| `supabase/migrations/20260517120000_copy_sell_schema_merged.sql` | **Squash** de todas as migrations anteriores (schema MVP + planos v2 + perfil + billing_requests + RPCs de credito + kind `support`). |

## Historico (removido do repo, conteudo fundido)

As seguintes migrations foram **absorvidas** no arquivo merged (nao existem mais como arquivos separados):

1. `20260512150000_copy_sell_schema` - tabelas base, RLS inicial, triggers, storage.
2. `20260513140000_plans_billing_cycles` - status de assinatura, ciclo, atualizacao de planos, policy anon em `plans`, `handle_new_user` v2.
3. `20260514103000_profile_registration_fields` - colunas cadastro, `handle_new_user` v3 com segmento.
4. `20260515120000_extra_credits_billing_requests` - RPC decrement, tabela `billing_requests`.
5. `20260516120000_admin_credits_rls_support_kind` - RPC admin credito, RLS `credit_balances`, kind `support`.

## Boas praticas para novos ambientes

- **Novo projeto Supabase**: aplicar apenas o arquivo merged apos `supabase db reset` (ou fluxo equivalente).
- **Projeto ja migrado com arquivos antigos**: **nao** apagar linhas do historico de migrations no servidor sem plano; o merged e a fonte de verdade para **novos clones**.

## Como adicionar nova migration daqui pra frente

1. Crie `supabase/migrations/YYYYMMDDHHMMSS_descricao.sql`.
2. Use idempotencia (`if not exists`, `drop policy if exists`).
3. Documente neste arquivo a secao "Historico incremental" em formato de lista com data e proposito.

## Links

- [Banco README](./README.md)
- [Manutencao: novas tabelas](../manutencao/README.md)
