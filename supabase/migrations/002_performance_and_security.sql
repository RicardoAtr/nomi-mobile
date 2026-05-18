-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_tx_user_fecha
  ON transactions(created_by, fecha DESC)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_budgets_user_mes
  ON budgets(owner_id, mes, anio);

CREATE INDEX IF NOT EXISTS idx_goals_owner_active
  ON savings_goals(owner_id)
  WHERE is_completed = false;

-- RLS habilitado en todas las tablas sensibles
ALTER TABLE transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals  ENABLE ROW LEVEL SECURITY;

-- Función helper para reutilizar en policies
CREATE OR REPLACE FUNCTION auth_uid() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT auth.uid() $$;

-- Policies básicas (idempotentes)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'transactions' AND policyname = 'own_transactions'
  ) THEN
    CREATE POLICY own_transactions ON transactions
      FOR ALL USING (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'accounts' AND policyname = 'own_accounts'
  ) THEN
    CREATE POLICY own_accounts ON accounts
      FOR ALL USING (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'budgets' AND policyname = 'own_budgets'
  ) THEN
    CREATE POLICY own_budgets ON budgets
      FOR ALL USING (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'savings_goals' AND policyname = 'own_goals'
  ) THEN
    CREATE POLICY own_goals ON savings_goals
      FOR ALL USING (owner_id = auth.uid());
  END IF;
END $$;
