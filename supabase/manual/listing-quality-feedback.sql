-- Patch para bancos já provisionados (SQL Editor).
-- Tabela de avaliação manual pós-geração (benchmark 15 produtos).

create table if not exists public.listing_quality_feedback (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  issue_tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, user_id)
);

create index if not exists listing_quality_feedback_user_created_idx
  on public.listing_quality_feedback (user_id, created_at desc);

create index if not exists listing_quality_feedback_listing_idx
  on public.listing_quality_feedback (listing_id);

alter table public.listing_quality_feedback enable row level security;

drop policy if exists "listing_quality_feedback_select" on public.listing_quality_feedback;
create policy "listing_quality_feedback_select"
  on public.listing_quality_feedback for select
  using (auth.uid() = user_id or public.is_admin ());

drop policy if exists "listing_quality_feedback_insert_own" on public.listing_quality_feedback;
create policy "listing_quality_feedback_insert_own"
  on public.listing_quality_feedback for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and l.user_id = auth.uid()
        and l.status = 'completed'
    )
  );

drop policy if exists "listing_quality_feedback_update_own" on public.listing_quality_feedback;
create policy "listing_quality_feedback_update_own"
  on public.listing_quality_feedback for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
