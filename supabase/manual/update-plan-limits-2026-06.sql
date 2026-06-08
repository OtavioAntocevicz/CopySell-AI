-- Atualiza limites de geracoes nos planos (ambiente ja existente).
-- Free: 5 (inalterado) | Pro: 75 | Business: 150

update public.plans
set limits = jsonb_set(limits, '{monthlyGenerations}', '5'::jsonb, true)
where id = 'free';

update public.plans
set limits = jsonb_set(limits, '{monthlyGenerations}', '75'::jsonb, true)
where id = 'pro';

update public.plans
set limits = jsonb_set(limits, '{monthlyGenerations}', '150'::jsonb, true)
where id = 'business';
