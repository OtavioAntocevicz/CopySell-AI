# Migrations

## Arquivo atual (deploy unico)

| Arquivo | Descricao |
|---------|-----------|
| [`supabase/migrations/20260517120000_copy_sell_schema_merged.sql`](../../supabase/migrations/20260517120000_copy_sell_schema_merged.sql) | **Schema completo** para novos ambientes: MVP, planos v2, perfil, billing, plano free com 5 geracoes/ciclo, hardening RLS de billing/uso. |

## Como aplicar no Supabase

1. Abra o **SQL Editor** do projeto Supabase.
2. Cole o conteudo integral do arquivo merged acima.
3. Execute uma unica vez em ambiente novo.

**Ambientes ja migrados** com arquivos incrementais antigos: nao reexecute o merged inteiro sem plano; aplique apenas o diff necessario ou recrie o projeto.

## Historico (absorvido no merged)

As migrations abaixo foram **fundidas** no arquivo unico e **removidas** do repositorio:

| Arquivo removido | Conteudo absorvido |
|------------------|-------------------|
| `20260518100000_free_plan_monthly_generations_5.sql` | Plano free com `monthlyGenerations: 5` (secao de catalogo no merged) |
| `20260608130000_rls_billing_hardening.sql` | RPCs `increment_own_usage` / `decrement_own_extra_credit` hardened; sem UPDATE direto em `credit_balances` e `user_usage_monthly` |

Squash anterior (20260512-20260516) ja estava no merged base.

## Como adicionar nova migration daqui pra frente

1. Crie `supabase/migrations/YYYYMMDDHHMMSS_descricao.sql` **ou** atualize o merged se for ambiente sempre novo.
2. Use idempotencia (`if not exists`, `drop policy if exists`).
3. Documente neste arquivo na secao "Historico incremental".

## Links

- [Banco README](./README.md)
- [Seguranca RLS](../seguranca/README.md)
- [Manutencao: novas tabelas](../manutencao/README.md)
