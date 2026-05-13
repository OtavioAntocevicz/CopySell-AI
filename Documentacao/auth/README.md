# Autenticacao

## Conteudo

- [Sessao e middleware](./sessao-e-middleware.md)

## Modelo

- **Provedor**: Supabase Auth (`auth.users`).
- **Perfil de aplicacao**: linha em `public.profiles` criada por trigger `handle_new_user` no insert em `auth.users`.
- **Roles**: coluna `profiles.role` (`user` padrao, `admin` para equipe interna).
- **Sessao web**: cookies HTTP gerenciados por `@supabase/ssr` (server + middleware refresh).

## Protecao de rotas

- **Usuario**: layouts do dashboard assumem sessao; paginas sensivelmente checam `getUser()`.
- **Admin**: `requireAdmin()` em Server Actions e queries admin; policies SQL usam `is_admin()`.

## JWT / cookies

Detalhes de implementacao Next.js + SSR: ver doc de sessao.

## Links

- [API: callback OAuth](../api/catalogo-completo.md)
- [Seguranca](../seguranca/README.md)

[Voltar](../README.md)
