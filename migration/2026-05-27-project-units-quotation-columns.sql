-- Add columns expected by Project Setup + Quotation module (safe if already exist)
-- Run in pgAdmin on your CRM database.

ALTER TABLE project_units
  ADD COLUMN IF NOT EXISTS carpet_area_sqft NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS super_builtup_area_sqft NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS price NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS lead_id INTEGER,
  ADD COLUMN IF NOT EXISTS facing VARCHAR(100),
  ADD COLUMN IF NOT EXISTS amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Optional: backfill from older column names if you had them
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_units' AND column_name = 'carpet_area'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_units' AND column_name = 'carpet_area_sqft'
  ) THEN
    UPDATE project_units
    SET carpet_area_sqft = carpet_area
    WHERE carpet_area_sqft IS NULL AND carpet_area IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_units' AND column_name = 'assigned_lead_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_units' AND column_name = 'lead_id'
  ) THEN
    UPDATE project_units
    SET lead_id = assigned_lead_id::integer
    WHERE lead_id IS NULL AND assigned_lead_id IS NOT NULL
      AND assigned_lead_id ~ '^[0-9]+$';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_project_units_lead
  ON project_units(lead_id)
  WHERE deleted_at IS NULL AND lead_id IS NOT NULL;
