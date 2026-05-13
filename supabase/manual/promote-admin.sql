-- Executar no Supabase → SQL Editor (bloco inteiro).
-- 1) Corrige o trigger: no SQL Editor auth.uid() é NULL; o guard antigo bloqueava o UPDATE de role.
-- 2) Promove a conta indicada a admin (troque o UUID se precisar).

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

-- UUID: confira em Authentication → Users → User UID (conta recriada).
update public.profiles
set role = 'admin'
where id = '28705a6f-800e-4967-ad8e-121600c6bee5';

-- select id, email, role from public.profiles where id = '28705a6f-800e-4967-ad8e-121600c6bee5';
