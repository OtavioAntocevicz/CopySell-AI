# Banco de dados (Postgres / Supabase)

## Conteudo

- [Tabelas e relacoes](./tabelas-e-relacoes.md)
- [Migrations](./migrations.md)

## Principios

- **RLS** ativo nas tabelas expostas ao PostgREST.
- **Chaves**: `profiles.id` = `auth.users.id`.
- **Storage** RLS alinhado a prefixo `users/{uid}/...`.

## Links

- [Seguranca: RLS](../seguranca/README.md)
- [Billing: uso de dados](../billing/README.md)

[Voltar](../README.md)
