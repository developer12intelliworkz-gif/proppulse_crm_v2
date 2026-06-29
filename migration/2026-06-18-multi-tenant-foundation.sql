-- Multi-tenant foundation (shared DB, row-level isolation)
-- Backward-compatible: nullable company_id, backfilled to default company.
-- Keeps existing columns (deleted_at, is_active, roles_permissions_id, etc.).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ---------- Users: tenant + lifecycle + reporting line ----------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('invited','active','suspended','inactive','terminated')),
  ADD COLUMN IF NOT EXISTS replaced_by_user_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS deactivation_reason TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Backfill company_id for existing rows (default company)
UPDATE users
SET company_id = '60c06a65-d9cb-4df7-89fc-4a77004a353d'::uuid
WHERE company_id IS NULL;

-- Sync lifecycle status from legacy flags
UPDATE users
SET status = CASE
  WHEN deleted_at IS NOT NULL THEN 'terminated'
  WHEN is_active = FALSE THEN 'inactive'
  ELSE 'active'
END;

-- ---------- Leads: tenant scope + assignment timestamp ----------
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id),
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_company_id ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_brand_id ON leads(brand_id);

UPDATE leads
SET company_id = '60c06a65-d9cb-4df7-89fc-4a77004a353d'::uuid
WHERE company_id IS NULL;

UPDATE leads
SET assigned_at = COALESCE(assigned_at, updated_at, created_at)
WHERE assigned_to IS NOT NULL AND assigned_at IS NULL;

-- ---------- Projects: tenant + optional brand link ----------
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);

CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_brand_id ON projects(brand_id);

UPDATE projects
SET company_id = '60c06a65-d9cb-4df7-89fc-4a77004a353d'::uuid
WHERE company_id IS NULL;

-- ---------- Reassignment trail (extends existing lead_assignment_history if present) ----------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lead_assignment_history'
  ) THEN
    CREATE TABLE lead_assignment_history (
      id            BIGSERIAL PRIMARY KEY,
      lead_id       INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      from_user_id  UUID REFERENCES users(id),
      to_user_id    UUID NOT NULL REFERENCES users(id),
      reason        VARCHAR(40) NOT NULL
                    CHECK (reason IN ('initial','manual_reassign','user_offboarding','load_balance')),
      reassigned_by UUID REFERENCES users(id),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Legacy schema uses old_assigned_to / new_assigned_to / assigned_by
ALTER TABLE lead_assignment_history
  ADD COLUMN IF NOT EXISTS from_user_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS to_user_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reassigned_by UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_assign_hist_lead ON lead_assignment_history(lead_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_assignment_history' AND column_name = 'to_user_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_assign_hist_to_user ON lead_assignment_history(to_user_id)';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_assignment_history' AND column_name = 'new_assigned_to'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_assign_hist_new_user ON lead_assignment_history(new_assigned_to)';
  END IF;
END $$;

-- ---------- Offboarding summary ----------
CREATE TABLE IF NOT EXISTS user_offboarding_events (
  id                  BIGSERIAL PRIMARY KEY,
  offboarded_user_id  UUID NOT NULL REFERENCES users(id),
  replacement_user_id UUID REFERENCES users(id),
  reason              TEXT,
  leads_reassigned    INTEGER NOT NULL DEFAULT 0,
  performed_by        UUID REFERENCES users(id),
  performed_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offboarding_user ON user_offboarding_events(offboarded_user_id);

-- ---------- Generic audit log ----------
CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGSERIAL PRIMARY KEY,
  actor_id   UUID REFERENCES users(id),
  entity     VARCHAR(40) NOT NULL,
  entity_id  TEXT,
  action     VARCHAR(40) NOT NULL,
  before     JSONB,
  after      JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity, entity_id);

-- ---------- Offboarding function (atomic reassignment) ----------
CREATE OR REPLACE FUNCTION reassign_user_work(
    p_from_user    UUID,
    p_to_user      UUID,
    p_performed_by UUID,
    p_reason       TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF p_from_user = p_to_user THEN
        RAISE EXCEPTION 'Replacement user must differ from offboarded user';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_to_user AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Replacement user not found';
    END IF;

    INSERT INTO lead_assignment_history (
      lead_id, old_assigned_to, new_assigned_to, assigned_by, reason, assigned_at, created_at
    )
    SELECT id, assigned_to, p_to_user, p_performed_by, 'user_offboarding', now(), now()
    FROM leads
    WHERE assigned_to = p_from_user
      AND deleted_at IS NULL;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    UPDATE leads
       SET assigned_to = p_to_user,
           assigned_at = now(),
           updated_at  = now()
     WHERE assigned_to = p_from_user
       AND deleted_at IS NULL;

    UPDATE users
       SET manager_id = p_to_user,
           updated_at = now()
     WHERE manager_id = p_from_user
       AND deleted_at IS NULL;

    UPDATE users
       SET status              = 'terminated',
           is_active           = FALSE,
           replaced_by_user_id = p_to_user,
           deactivated_at      = now(),
           deactivated_by      = p_performed_by,
           deactivation_reason = p_reason,
           updated_at          = now()
     WHERE id = p_from_user;

    INSERT INTO user_offboarding_events
        (offboarded_user_id, replacement_user_id, reason, leads_reassigned, performed_by)
    VALUES (p_from_user, p_to_user, p_reason, v_count, p_performed_by);

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;
