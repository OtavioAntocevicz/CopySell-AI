-- Testes manuais de RLS (billing / uso)
-- Aplicar supabase/migrations/20260517120000_copy_sell_schema_merged.sql antes de rodar.
--
-- Como executar:
-- 1. Crie um usuario de teste comum (nao admin) e faca login no app.
-- 2. No Supabase SQL Editor, substitua :user_id pelo UUID do usuario.
-- 3. Para simular JWT de usuario, use o SQL Editor autenticado como o usuario
--    OU teste via DevTools no browser (recomendado para validar RLS real).
--
-- Resultado esperado: todas as mutacoes diretas abaixo devem FALHAR.

-- ---------------------------------------------------------------------------
-- A) Inflar creditos (deve falhar)
-- ---------------------------------------------------------------------------
-- Via client JS (DevTools, sessao de usuario comum):
-- await supabase.from('credit_balances').update({ balance: 999999 }).eq('user_id', uid)

-- ---------------------------------------------------------------------------
-- B) Zerar uso mensal (deve falhar)
-- ---------------------------------------------------------------------------
-- await supabase.from('user_usage_monthly').update({ generations_completed: 0 }).eq('user_id', uid)

-- ---------------------------------------------------------------------------
-- C) Inserir linha de uso fake (deve falhar)
-- ---------------------------------------------------------------------------
-- await supabase.from('user_usage_monthly').insert({ user_id: uid, period: '...', generations_completed: 0 })

-- ---------------------------------------------------------------------------
-- D) RPC com valores negativos (deve falhar)
-- ---------------------------------------------------------------------------
-- await supabase.rpc('increment_own_usage', { p_period: '2026-06-01T00:00:00.000Z', p_generations: -1, p_images: 0, p_listings: 0 })

-- ---------------------------------------------------------------------------
-- E) RPC com incremento valido (deve funcionar)
-- ---------------------------------------------------------------------------
-- await supabase.rpc('increment_own_usage', { p_period: '2026-06-01T00:00:00.000Z', p_generations: 1, p_images: 1, p_listings: 1 })

-- ---------------------------------------------------------------------------
-- F) Decrementar credito extra com saldo > 0 (deve funcionar)
-- ---------------------------------------------------------------------------
-- await supabase.rpc('decrement_own_extra_credit')

-- ---------------------------------------------------------------------------
-- G) Leitura do proprio saldo e uso (deve funcionar)
-- ---------------------------------------------------------------------------
-- await supabase.from('credit_balances').select('balance').eq('user_id', uid).single()
-- await supabase.from('user_usage_monthly').select('*').eq('user_id', uid)
