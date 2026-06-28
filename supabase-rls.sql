-- ============================================================
-- TraderPro — Migração de Segurança: RLS + user_id
-- Execute no Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- PASSO 0: descubra o seu UUID (copie o valor de "id")
SELECT id, email FROM auth.users;

-- ⚠ Substitua 'SEU-UUID-AQUI' pelo id copiado acima em TODOS os UPDATE abaixo


-- ============================================================
-- TABELA: trades
-- ============================================================

-- 1. Adiciona coluna user_id (nullable primeiro para migrar dados)
ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Associa todos os registros existentes ao seu usuário
UPDATE trades
  SET user_id = 'SEU-UUID-AQUI'
  WHERE user_id IS NULL;

-- 3. Torna a coluna obrigatória e define o default para novos inserts
ALTER TABLE trades
  ALTER COLUMN user_id SET DEFAULT auth.uid(),
  ALTER COLUMN user_id SET NOT NULL;

-- 4. Ativa RLS
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- 5. Remove políticas antigas (se existirem)
DROP POLICY IF EXISTS "trades_select_own" ON trades;
DROP POLICY IF EXISTS "trades_insert_own" ON trades;
DROP POLICY IF EXISTS "trades_update_own" ON trades;
DROP POLICY IF EXISTS "trades_delete_own" ON trades;

-- 6. Cria políticas: cada usuário só acessa seus próprios dados
CREATE POLICY "trades_select_own" ON trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "trades_insert_own" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades_update_own" ON trades
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades_delete_own" ON trades
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- TABELA: journal_entries
-- ============================================================

ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE journal_entries
  SET user_id = 'SEU-UUID-AQUI'
  WHERE user_id IS NULL;

ALTER TABLE journal_entries
  ALTER COLUMN user_id SET DEFAULT auth.uid(),
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_select_own" ON journal_entries;
DROP POLICY IF EXISTS "journal_insert_own" ON journal_entries;
DROP POLICY IF EXISTS "journal_update_own" ON journal_entries;
DROP POLICY IF EXISTS "journal_delete_own" ON journal_entries;

CREATE POLICY "journal_select_own" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "journal_insert_own" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "journal_update_own" ON journal_entries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "journal_delete_own" ON journal_entries
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- TABELA: rules
-- ============================================================

ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE rules
  SET user_id = 'SEU-UUID-AQUI'
  WHERE user_id IS NULL;

ALTER TABLE rules
  ALTER COLUMN user_id SET DEFAULT auth.uid(),
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rules_select_own" ON rules;
DROP POLICY IF EXISTS "rules_insert_own" ON rules;
DROP POLICY IF EXISTS "rules_update_own" ON rules;
DROP POLICY IF EXISTS "rules_delete_own" ON rules;

CREATE POLICY "rules_select_own" ON rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "rules_insert_own" ON rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rules_update_own" ON rules
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rules_delete_own" ON rules
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- TABELA: risk_settings
-- (usa user_id como chave de upsert — cada user tem 1 linha)
-- ============================================================

ALTER TABLE risk_settings
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE risk_settings
  SET user_id = 'SEU-UUID-AQUI'
  WHERE user_id IS NULL;

ALTER TABLE risk_settings
  ALTER COLUMN user_id SET DEFAULT auth.uid(),
  ALTER COLUMN user_id SET NOT NULL;

-- Garante que cada usuário tem no máximo 1 linha de configuração
ALTER TABLE risk_settings
  DROP CONSTRAINT IF EXISTS risk_settings_user_id_key;

ALTER TABLE risk_settings
  ADD CONSTRAINT risk_settings_user_id_key UNIQUE (user_id);

ALTER TABLE risk_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "risk_select_own" ON risk_settings;
DROP POLICY IF EXISTS "risk_insert_own" ON risk_settings;
DROP POLICY IF EXISTS "risk_update_own" ON risk_settings;
DROP POLICY IF EXISTS "risk_delete_own" ON risk_settings;

CREATE POLICY "risk_select_own" ON risk_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "risk_insert_own" ON risk_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "risk_update_own" ON risk_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "risk_delete_own" ON risk_settings
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- VERIFICAÇÃO FINAL
-- Rode estas queries depois da migração para confirmar
-- ============================================================

-- Deve mostrar RLS = true para todas as 4 tabelas
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'journal_entries', 'rules', 'risk_settings');

-- Deve listar as 16 políticas criadas (4 por tabela)
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'journal_entries', 'rules', 'risk_settings')
ORDER BY tablename, cmd;

-- Deve mostrar 0 linhas sem user_id
SELECT 'trades' AS tabela, COUNT(*) AS sem_user_id FROM trades WHERE user_id IS NULL
UNION ALL
SELECT 'journal_entries', COUNT(*) FROM journal_entries WHERE user_id IS NULL
UNION ALL
SELECT 'rules', COUNT(*) FROM rules WHERE user_id IS NULL
UNION ALL
SELECT 'risk_settings', COUNT(*) FROM risk_settings WHERE user_id IS NULL;
