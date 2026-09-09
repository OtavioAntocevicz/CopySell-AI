-- Segredos de aplicacao (ex.: chave Gemini rotacionavel pelo admin).
-- Acesso apenas via service_role no servidor; RLS bloqueia cliente anon/authenticated.

create table if not exists public.app_secrets (
  key text primary key,
  value_encrypted text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.app_secrets is
  'Segredos server-side criptografados. Chaves sensíveis — nunca SELECT via anon/authenticated.';

alter table public.app_secrets enable row level security;

-- Sem policies: usuarios comuns nao leem/escrevem. service_role bypassa RLS.
