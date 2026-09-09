-- Canais de marketplace, multi-imagem e consumo atômico de geração.

alter table public.listings
  add column if not exists image_paths jsonb not null default '[]'::jsonb;

comment on column public.listings.image_paths is
  'Paths adicionais no bucket product-images (além de image_path principal).';

-- Permite contabilizar até 5 imagens por geração.
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
    or p_images < 0 or p_images > 5
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

-- Consome uma geração de forma atômica (plano ou crédito extra). Retorna fonte ou lança exceção.
create or replace function public.consume_generation_if_allowed (
  p_period text,
  p_images integer default 1
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_plan_id text;
  v_status text;
  v_blocked timestamptz;
  v_monthly_cap integer;
  v_monthly_used integer;
  v_extra integer;
  v_limits jsonb;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  if p_period is null or length(trim(p_period)) = 0 then
    raise exception 'invalid period';
  end if;

  if p_images < 1 or p_images > 5 then
    raise exception 'invalid image count';
  end if;

  select blocked_at, plan_id, subscription_status
    into v_blocked, v_plan_id, v_status
  from public.profiles
  where id = uid
  for update;

  if not found then
    raise exception 'profile missing';
  end if;

  if v_blocked is not null then
    raise exception 'user blocked';
  end if;

  select balance into v_extra
  from public.credit_balances
  where user_id = uid
  for update;

  v_extra := coalesce(v_extra, 0);

  if v_status <> 'active' and v_extra <= 0 then
    raise exception 'subscription inactive';
  end if;

  select limits into v_limits
  from public.plans
  where id = coalesce(v_plan_id, 'free');

  v_monthly_cap := coalesce((v_limits ->> 'monthlyGenerations')::integer, 20);

  select generations_completed into v_monthly_used
  from public.user_usage_monthly
  where user_id = uid and period = p_period
  for update;

  v_monthly_used := coalesce(v_monthly_used, 0);

  if v_status = 'active' and v_monthly_used < v_monthly_cap then
    perform public.increment_own_usage(p_period, 1, p_images, 1);
    return 'plan';
  end if;

  if v_extra <= 0 then
    raise exception 'monthly limit';
  end if;

  update public.credit_balances
  set balance = balance - 1, updated_at = now()
  where user_id = uid and balance > 0;

  if not found then
    raise exception 'extra credit decrement failed';
  end if;

  perform public.increment_own_usage(p_period, 0, p_images, 1);
  return 'credit';
end;
$$;

revoke all on function public.consume_generation_if_allowed (text, integer) from public;
grant execute on function public.consume_generation_if_allowed (text, integer) to authenticated;
