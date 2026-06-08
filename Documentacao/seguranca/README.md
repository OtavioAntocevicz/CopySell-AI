# Seguranca

## Camadas

1. **RLS Postgres**: todas as tabelas de dados de usuario protegidas por `auth.uid()` e/ou `is_admin()`.
2. **Trigger `profiles_privileged_update_guard`**: impede usuario de alterar plano, role, bloqueio, etc.
3. **Storage policies**: path obrigatorio `users/{uid}/...`.
4. **Server Actions**: validacao de entrada e checagem de sessao antes de mutar.
5. **Billing hardening** (incluido no schema merged `20260517120000_copy_sell_schema_merged.sql`): sem UPDATE direto em `credit_balances` / `user_usage_monthly` para usuarios; RPCs `increment_own_usage` e `decrement_own_extra_credit` validadas.
6. **OAuth callback**: parametro `next` sanitizado em `src/lib/safe-redirect-path.ts`.

## Upload

- MIME allowlist (`ALLOWED_IMAGE_MIMES`).
- Tamanho maximo global e por plano.
- Objetos privados - leitura apenas dono (e admin conforme policy).

## Sanitizacao e validacao

- Zod em formularios criticos (listing, perfil, billing requests).
- Pos-processamento semantico reduz claims perigosos (`dangerous-claims`, etc.).

## Anti-spam / rate limit

- **Limites de negocio**: geracoes por ciclo + creditos.
- **Rate limit HTTP**: nao implementado globalmente nesta versao - considerar WAF / edge limiter ao escalar.

## Variaveis

- Ver [deploy/variaveis-ambiente.md](../deploy/variaveis-ambiente.md).

## Checklist Supabase (producao)

Configurar manualmente no **Dashboard Supabase** antes do lancamento publico:

| Item | Onde | Acao |
|------|------|------|
| Redirect URLs | Authentication > URL Configuration | Incluir `https://SEU-DOMINIO/auth/callback` e `http://localhost:3000/auth/callback` |
| Confirmacao de e-mail | Authentication > Providers > Email | Habilitar se ainda nao estiver ativo |
| Senha minima | Authentication > Providers > Email | Recomendado: minimo 8 caracteres |
| Rate limit de auth | Authentication > Rate Limits | Ativar protecao contra brute force |
| Migrations | SQL / CLI | Aplicar `20260517120000_copy_sell_schema_merged.sql` (arquivo unico) |
| Teste RLS | Manual | Rodar checklist em `supabase/tests/rls_billing_hardening.sql` |
| Segredos | Hosting (Vercel etc.) | `GEMINI_API_KEY` apenas no servidor; nunca em `NEXT_PUBLIC_*` |

## Testes de RLS

- Automatizado (estrutura da migration): `src/server/security/rls-billing-expectations.test.ts`
- Manual (JWT de usuario comum): `supabase/tests/rls_billing_hardening.sql`

## Links

- [Banco RLS](../banco/tabelas-e-relacoes.md)
- [IA custos e abuso](../ia/modelo-prompts-e-resiliencia.md)

[Voltar](../README.md)
