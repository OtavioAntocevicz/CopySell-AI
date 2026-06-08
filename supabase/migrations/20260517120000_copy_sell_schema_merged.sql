-- =============================================================================
-- CopySell AI - schema Supabase consolidado (deploy unico).
-- Inclui: MVP, planos v2, cadastro perfil, billing_requests, RPC creditos,
-- plano free com 5 geracoes/ciclo, hardening RLS de billing/uso mensal.
--
-- Novos ambientes: executar apenas este arquivo no SQL Editor do Supabase.
-- Bases ja migradas incrementalmente: nao reexecutar sem plano de merge.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Planos (antes de FK plan_id em profiles)
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id text primary key,
  name text not null,
  description text,
  limits jsonb not null default '{}'::jsonb,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.plans (id, name, description, limits, display_order)
values
  (
    'free',
    'Free',
    'Plano inicial',
    jsonb_build_object(
      'monthlyGenerations', 100,
      'dailyGenerations', 20,
      'maxImageBytes', 2097152,
      'features', jsonb_build_array('ml_listing', 'export_csv')
    ),
    0
  ),
  (
    'pro',
    'Pro',
    'Uso intensivo',
    jsonb_build_object(
      'monthlyGenerations', 500,
      'dailyGenerations', 80,
      'maxImageBytes', 2097152,
      'features', jsonb_build_array('ml_listing', 'export_csv', 'priority_queue')
    ),
    1
  ),
  (
    'business',
    'Business',
    'Equipes',
    jsonb_build_object(
      'monthlyGenerations', 5000,
      'dailyGenerations', 200,
      'maxImageBytes', 5242880,
      'features', jsonb_build_array('ml_listing', 'export_csv', 'priority_queue', 'dedicated_support')
    ),
    2
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2) Perfis
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  default_marketplace text not null default 'mercado_livre',
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists email text;

alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'admin'));

alter table public.profiles
  add column if not exists plan_id text not null default 'free'
  references public.plans (id);

alter table public.profiles
  add column if not exists subscription_status text not null default 'active'
  check (subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'paused'));

alter table public.profiles
  add column if not exists trial_ends_at timestamptz;

alter table public.profiles
  add column if not exists billing_provider text;

alter table public.profiles
  add column if not exists external_subscription_id text;

alter table public.profiles
  add column if not exists current_period_end timestamptz;

alter table public.profiles
  add column if not exists blocked_at timestamptz;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and (p.email is null or p.email = '');

-- ---------------------------------------------------------------------------
-- 3) Créditos (stub)
-- ---------------------------------------------------------------------------
create table if not exists public.credit_balances (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0
);

-- ---------------------------------------------------------------------------
-- 4) Listings
-- ---------------------------------------------------------------------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  marketplace text not null default 'mercado_livre',
  product_name text not null,
  category text not null,
  image_path text not null,
  image_mime text not null,
  image_sha256 text,
  outputs jsonb not null default '{}'::jsonb,
  model text,
  prompt_version text,
  status text not null check (status in ('completed', 'failed')),
  error_code text,
  created_at timestamptz not null default now()
);

alter table public.listings
  add column if not exists seller_notes text;

alter table public.listings
  add column if not exists outputs_ai_snapshot jsonb;

update public.listings
set outputs_ai_snapshot = outputs
where outputs_ai_snapshot is null
  and status = 'completed'
  and outputs is not null
  and outputs <> '{}'::jsonb;

create index if not exists listings_user_created_idx
  on public.listings (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 5) Behavior events
-- ---------------------------------------------------------------------------
create table if not exists public.listing_behavior_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  edit_duration_ms integer,
  generation_to_save_ms integer,
  metrics jsonb not null,
  diff jsonb not null
);

create index if not exists listing_behavior_events_listing_created_idx
  on public.listing_behavior_events (listing_id, created_at desc);

create index if not exists listing_behavior_events_user_created_idx
  on public.listing_behavior_events (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 6) Uso mensal
-- ---------------------------------------------------------------------------
create table if not exists public.user_usage_monthly (
  user_id uuid not null references auth.users (id) on delete cascade,
  period text not null,
  generations_completed integer not null default 0,
  images_uploaded integer not null default 0,
  listings_created integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, period)
);

create index if not exists user_usage_monthly_period_idx
  on public.user_usage_monthly (period);

-- ---------------------------------------------------------------------------
-- 7) Funções (antes de policies e triggers que as usam)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and pr.role = 'admin'
  );
$$;

grant execute on function public.is_admin () to authenticated;

create or replace function public.increment_own_usage (
  p_period text,
  p_generations integer,
  p_images integer,
  p_listings integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  if p_period is null or length(trim(p_period)) = 0 then
    raise exception 'invalid period';
  end if;

  if p_generations < 0 or p_generations > 1
    or p_images < 0 or p_images > 1
    or p_listings < 0 or p_listings > 1
  then
    raise exception 'invalid increment values';
  end if;

  if p_generations = 0 and p_images = 0 and p_listings = 0 then
    raise exception 'at least one increment required';
  end if;

  insert into public.user_usage_monthly as u (
    user_id,
    period,
    generations_completed,
    images_uploaded,
    listings_created
  )
  values (uid, p_period, p_generations, p_images, p_listings)
  on conflict (user_id, period) do update set
    generations_completed = u.generations_completed + excluded.generations_completed,
    images_uploaded = u.images_uploaded + excluded.images_uploaded,
    listings_created = u.listings_created + excluded.listings_created,
    updated_at = now();
end;
$$;

revoke all on function public.increment_own_usage (text, integer, integer, integer) from public;
grant execute on function public.increment_own_usage (text, integer, integer, integer) to authenticated;

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, plan_id, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.email,
    'free',
    'user'
  );
  insert into public.credit_balances (user_id, balance)
  values (new.id, 0);
  return new;
end;
$$;

create or replace function public.profiles_privileged_update_guard ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- SQL Editor / service_role: sem JWT, auth.uid() é NULL - necessário para
  -- o primeiro promote admin e manutenção (não aplica a sessões `authenticated`).
  if auth.uid () is null then
    return new;
  end if;

  if public.is_admin () then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'cannot change profile id';
  end if;

  if new.role is distinct from old.role
    or new.plan_id is distinct from old.plan_id
    or new.blocked_at is distinct from old.blocked_at
    or new.subscription_status is distinct from old.subscription_status
    or new.billing_provider is distinct from old.billing_provider
    or new.external_subscription_id is distinct from old.external_subscription_id
    or new.current_period_end is distinct from old.current_period_end
    or new.trial_ends_at is distinct from old.trial_ends_at
  then
    raise exception 'profile privileged fields can only be changed by admin';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_privileged_update_guard on public.profiles;
create trigger profiles_privileged_update_guard
  before update on public.profiles
  for each row
  execute function public.profiles_privileged_update_guard ();

-- ---------------------------------------------------------------------------
-- 8) RLS + policies
-- ---------------------------------------------------------------------------
alter table public.plans enable row level security;

drop policy if exists "plans_select_authenticated" on public.plans;
create policy "plans_select_authenticated"
  on public.plans for select
  to authenticated
  using (true);

drop policy if exists "plans_update_admin" on public.plans;
create policy "plans_update_admin"
  on public.plans for update
  to authenticated
  using (public.is_admin ());

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin ());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin ());

alter table public.credit_balances enable row level security;

drop policy if exists "credit_balances_select_own" on public.credit_balances;
create policy "credit_balances_select_own"
  on public.credit_balances for select
  using (auth.uid() = user_id);

alter table public.listings enable row level security;

drop policy if exists "listings_select_own" on public.listings;
drop policy if exists "listings_select_admin" on public.listings;
drop policy if exists "listings_select" on public.listings;
create policy "listings_select"
  on public.listings for select
  using (auth.uid() = user_id or public.is_admin ());

drop policy if exists "listings_insert_own" on public.listings;
create policy "listings_insert_own"
  on public.listings for insert
  with check (auth.uid() = user_id);

drop policy if exists "listings_update_own" on public.listings;
create policy "listings_update_own"
  on public.listings for update
  using (auth.uid() = user_id);

drop policy if exists "listings_delete_own" on public.listings;
create policy "listings_delete_own"
  on public.listings for delete
  using (auth.uid() = user_id);

alter table public.listing_behavior_events enable row level security;

drop policy if exists "listing_behavior_events_select_own" on public.listing_behavior_events;
drop policy if exists "listing_behavior_events_select_admin" on public.listing_behavior_events;
drop policy if exists "listing_behavior_events_select" on public.listing_behavior_events;
create policy "listing_behavior_events_select"
  on public.listing_behavior_events for select
  using (
    auth.uid() = user_id
    or public.is_admin ()
  );

drop policy if exists "listing_behavior_events_insert_own" on public.listing_behavior_events;
create policy "listing_behavior_events_insert_own"
  on public.listing_behavior_events for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and l.user_id = auth.uid()
    )
  );

alter table public.user_usage_monthly enable row level security;

drop policy if exists "user_usage_monthly_select_own" on public.user_usage_monthly;
drop policy if exists "user_usage_monthly_select_admin" on public.user_usage_monthly;
drop policy if exists "user_usage_monthly_select" on public.user_usage_monthly;
create policy "user_usage_monthly_select"
  on public.user_usage_monthly for select
  using (auth.uid() = user_id or public.is_admin ());

drop policy if exists "user_usage_monthly_insert_own" on public.user_usage_monthly;
drop policy if exists "user_usage_monthly_update_own" on public.user_usage_monthly;

drop policy if exists "user_usage_monthly_delete_admin" on public.user_usage_monthly;
create policy "user_usage_monthly_delete_admin"
  on public.user_usage_monthly for delete
  using (public.is_admin ());

-- ---------------------------------------------------------------------------
-- 9) Novo usuário (auth)
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();

-- ---------------------------------------------------------------------------
-- 10) Storage - bucket privado de imagens
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', false)
on conflict (id) do nothing;

drop policy if exists "product_images_insert_own" on storage.objects;
create policy "product_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and split_part(name, '/', 1) = 'users'
    and split_part(name, '/', 2) = auth.uid()::text
  );

drop policy if exists "product_images_select_own" on storage.objects;
create policy "product_images_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'product-images'
    and split_part(name, '/', 1) = 'users'
    and split_part(name, '/', 2) = auth.uid()::text
  );

drop policy if exists "product_images_update_own" on storage.objects;
create policy "product_images_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and split_part(name, '/', 1) = 'users'
    and split_part(name, '/', 2) = auth.uid()::text
  );

drop policy if exists "product_images_delete_own" on storage.objects;
create policy "product_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and split_part(name, '/', 1) = 'users'
    and split_part(name, '/', 2) = auth.uid()::text
  );

-- ========== Legado 20260513140000: planos, ciclo, handle_new_user, RLS anon plans ==========

-- Planos v2: sem limite diário; ciclo mensal por âncora de assinatura; free 30 dias; status de assinatura.

-- ---------------------------------------------------------------------------
-- Status de assinatura (active | inactive | expired | canceled)
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_subscription_status_check;

update public.profiles
set subscription_status = case
  when subscription_status in ('trialing', 'past_due', 'paused') then 'active'
  else subscription_status
end;

alter table public.profiles
  add constraint profiles_subscription_status_check
  check (subscription_status in ('active', 'inactive', 'expired', 'canceled'));

-- ---------------------------------------------------------------------------
-- Ciclo de cobrança / free tier
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists billing_cycle_anchor_at timestamptz;

alter table public.profiles
  add column if not exists free_tier_ends_at timestamptz;

alter table public.profiles
  add column if not exists billing_interval text;

alter table public.profiles
  drop constraint if exists profiles_billing_interval_check;

alter table public.profiles
  add constraint profiles_billing_interval_check
  check (
    billing_interval is null
    or billing_interval in ('month', 'year')
  );

update public.profiles
set billing_cycle_anchor_at = coalesce(billing_cycle_anchor_at, created_at)
where billing_cycle_anchor_at is null;

update public.profiles
set free_tier_ends_at = created_at + interval '30 days'
where free_tier_ends_at is null
  and plan_id = 'free';

update public.profiles
set free_tier_ends_at = null
where plan_id <> 'free';

-- ---------------------------------------------------------------------------
-- Catálogo de planos (limites mensais + imagens por geração)
-- ---------------------------------------------------------------------------
update public.plans
set
  name = 'Free',
  description = 'Um mês gratuito para experimentar. Depois, escolha um plano pago.',
  limits = jsonb_build_object(
    'monthlyGenerations', 5,
    'maxImagesPerGeneration', 1,
    'maxImageBytes', 2097152,
    'features', jsonb_build_array('ml_listing')
  ),
  display_order = 0
where id = 'free';

update public.plans
set
  name = 'Pro',
  description = 'Uso profissional com suporte prioritário básico.',
  limits = jsonb_build_object(
    'monthlyGenerations', 75,
    'maxImagesPerGeneration', 3,
    'maxImageBytes', 2097152,
    'features', jsonb_build_array('ml_listing', 'export_csv', 'priority_support_basic')
  ),
  display_order = 1
where id = 'pro';

update public.plans
set
  name = 'Business',
  description = 'Equipes e maior prioridade nas gerações.',
  limits = jsonb_build_object(
    'monthlyGenerations', 150,
    'maxImagesPerGeneration', 5,
    'maxImageBytes', 5242880,
    'features', jsonb_build_array('ml_listing', 'export_csv', 'priority_queue', 'priority_support')
  ),
  display_order = 2
where id = 'business';

-- ---------------------------------------------------------------------------
-- Trigger novo usuário: âncora + término do free tier (30 dias)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    email,
    plan_id,
    role,
    billing_cycle_anchor_at,
    free_tier_ends_at,
    billing_interval,
    subscription_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.email,
    'free',
    'user',
    now(),
    now() + interval '30 days',
    null,
    'active'
  );
  insert into public.credit_balances (user_id, balance)
  values (new.id, 0);
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Guard: campos de ciclo / assinatura só admin
-- ---------------------------------------------------------------------------
create or replace function public.profiles_privileged_update_guard ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid () is null then
    return new;
  end if;

  if public.is_admin () then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'cannot change profile id';
  end if;

  if new.role is distinct from old.role
    or new.plan_id is distinct from old.plan_id
    or new.blocked_at is distinct from old.blocked_at
    or new.subscription_status is distinct from old.subscription_status
    or new.billing_provider is distinct from old.billing_provider
    or new.external_subscription_id is distinct from old.external_subscription_id
    or new.current_period_end is distinct from old.current_period_end
    or new.trial_ends_at is distinct from old.trial_ends_at
    or new.billing_cycle_anchor_at is distinct from old.billing_cycle_anchor_at
    or new.free_tier_ends_at is distinct from old.free_tier_ends_at
    or new.billing_interval is distinct from old.billing_interval
  then
    raise exception 'profile privileged fields can only be changed by admin';
  end if;

  return new;
end;
$$;

-- user_usage_monthly.period agora armazena ISO do início do ciclo de uso (UTC).

-- ---------------------------------------------------------------------------
-- Catálogo de planos legível sem login (página pública /planos)
-- ---------------------------------------------------------------------------
drop policy if exists "plans_select_anon" on public.plans;
create policy "plans_select_anon"
  on public.plans for select
  to anon
  using (active = true);

-- ========== Legado 20260514103000: campos cadastro + handle_new_user ==========

-- Campos extras de cadastro (nome, telefone, perfil de venda no ML) + trigger handle_new_user.

alter table public.profiles
  add column if not exists first_name text;

alter table public.profiles
  add column if not exists last_name text;

alter table public.profiles
  add column if not exists phone text;

alter table public.profiles
  add column if not exists company_name text;

alter table public.profiles
  add column if not exists seller_segment text;

update public.profiles
set seller_segment = null
where seller_segment is not null
  and trim(seller_segment) = '';

alter table public.profiles
  drop constraint if exists profiles_seller_segment_check;

alter table public.profiles
  add constraint profiles_seller_segment_check
  check (
    seller_segment is null
    or seller_segment in ('b2b', 'b2c', 'both')
  );

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first text;
  v_last text;
  v_phone text;
  v_company text;
  v_segment text;
  v_display text;
begin
  v_first := nullif(trim(new.raw_user_meta_data ->> 'first_name'), '');
  v_last := nullif(trim(new.raw_user_meta_data ->> 'last_name'), '');
  v_phone := nullif(trim(new.raw_user_meta_data ->> 'phone'), '');
  v_company := nullif(trim(new.raw_user_meta_data ->> 'company_name'), '');
  v_segment := lower(trim(coalesce(new.raw_user_meta_data ->> 'seller_segment', '')));
  if v_segment not in ('b2b', 'b2c', 'both') then
    v_segment := null;
  end if;

  v_display := nullif(trim(concat_ws(' ', v_first, v_last)), '');
  if v_display is null then
    v_display := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
  end if;
  if v_display is null then
    v_display := split_part(new.email, '@', 1);
  end if;

  insert into public.profiles (
    id,
    display_name,
    email,
    plan_id,
    role,
    first_name,
    last_name,
    phone,
    company_name,
    seller_segment,
    billing_cycle_anchor_at,
    free_tier_ends_at,
    billing_interval,
    subscription_status
  )
  values (
    new.id,
    v_display,
    new.email,
    'free',
    'user',
    v_first,
    v_last,
    v_phone,
    v_company,
    v_segment,
    now(),
    now() + interval '30 days',
    null,
    'active'
  );
  insert into public.credit_balances (user_id, balance)
  values (new.id, 0);
  return new;
end;
$$;

-- ========== Legado 20260515120000: creditos + billing_requests ==========

-- Créditos extras (saldo em credit_balances.balance, não expiram) + solicitações manuais (planos / pacotes).

-- ---------------------------------------------------------------------------
-- RPC: decrementa 1 crédito extra do usuário autenticado (atomicamente).
-- Retorna novo saldo, ou -1 se não havia saldo.
-- ---------------------------------------------------------------------------
create or replace function public.decrement_own_extra_credit ()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_bal integer;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  update public.credit_balances
  set balance = balance - 1
  where user_id = uid
    and balance > 0
  returning balance into new_bal;

  if new_bal is null then
    return -1;
  end if;

  return new_bal;
end;
$$;

revoke all on function public.decrement_own_extra_credit () from public;
grant execute on function public.decrement_own_extra_credit () to authenticated;

-- ---------------------------------------------------------------------------
-- Solicitações de cobrança / upgrade (fluxo manual até gateway).
-- ---------------------------------------------------------------------------
create table if not exists public.billing_requests (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('plan_subscribe', 'credit_purchase')),
  status text not null default 'pending' check (status in ('pending', 'done', 'dismissed')),
  phone text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  handled_at timestamptz,
  admin_note text
);

create index if not exists billing_requests_status_created_idx
  on public.billing_requests (status, created_at desc);

alter table public.billing_requests enable row level security;

drop policy if exists "billing_requests_insert_own" on public.billing_requests;
create policy "billing_requests_insert_own"
  on public.billing_requests for insert
  to authenticated
  with check (auth.uid () = user_id);

drop policy if exists "billing_requests_select_own" on public.billing_requests;
create policy "billing_requests_select_own"
  on public.billing_requests for select
  to authenticated
  using (auth.uid () = user_id);

drop policy if exists "billing_requests_select_admin" on public.billing_requests;
create policy "billing_requests_select_admin"
  on public.billing_requests for select
  to authenticated
  using (public.is_admin ());

drop policy if exists "billing_requests_update_admin" on public.billing_requests;
create policy "billing_requests_update_admin"
  on public.billing_requests for update
  to authenticated
  using (public.is_admin ())
  with check (public.is_admin ());

-- ========== Legado 20260516120000: admin RPC + RLS + kind support ==========

-- Créditos: RPC admin (upsert atômico) + RLS para update próprio (RPC decrement) + leitura admin.
-- billing_requests: tipo "support" (chamados gerais).

-- ---------------------------------------------------------------------------
-- RPC: admin soma créditos extras ao saldo do usuário alvo (atômico).
-- ---------------------------------------------------------------------------
create or replace function public.admin_add_extra_credits (p_target uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new integer;
begin
  if auth.uid () is null then
    raise exception 'not authenticated';
  end if;
  if not public.is_admin () then
    raise exception 'forbidden';
  end if;
  if p_amount < 1 or p_amount > 100000 then
    raise exception 'invalid amount';
  end if;

  insert into public.credit_balances (user_id, balance)
  values (p_target, p_amount)
  on conflict (user_id) do update set
    balance = public.credit_balances.balance + excluded.balance
  returning balance into v_new;

  return v_new;
end;
$$;

grant execute on function public.admin_add_extra_credits (uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- credit_balances: leitura admin; mutacao apenas via RPC (decrement) ou admin
-- ---------------------------------------------------------------------------
drop policy if exists "credit_balances_select_admin" on public.credit_balances;
create policy "credit_balances_select_admin"
  on public.credit_balances for select
  to authenticated
  using (public.is_admin ());

drop policy if exists "credit_balances_update_own" on public.credit_balances;

drop policy if exists "credit_balances_update_admin" on public.credit_balances;
create policy "credit_balances_update_admin"
  on public.credit_balances for update
  to authenticated
  using (public.is_admin ())
  with check (public.is_admin ());

drop policy if exists "credit_balances_insert_admin" on public.credit_balances;
create policy "credit_balances_insert_admin"
  on public.credit_balances for insert
  to authenticated
  with check (public.is_admin ());

-- ---------------------------------------------------------------------------
-- billing_requests: incluir kind "support"
-- ---------------------------------------------------------------------------
alter table public.billing_requests drop constraint if exists billing_requests_kind_check;

alter table public.billing_requests
  add constraint billing_requests_kind_check
  check (
    kind in ('plan_subscribe', 'credit_purchase', 'support')
  );

