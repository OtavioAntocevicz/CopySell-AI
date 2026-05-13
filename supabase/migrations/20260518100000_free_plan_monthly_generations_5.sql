-- Plano free: cota do período gratuito 20 → 5 (gerações no ciclo mensal do free).
-- Roda após o schema consolidado; idempotente para ambientes já com merged atualizado.
update public.plans
set
  limits = jsonb_set(
    limits,
    '{monthlyGenerations}',
    '5'::jsonb,
    true
  )
where id = 'free';
