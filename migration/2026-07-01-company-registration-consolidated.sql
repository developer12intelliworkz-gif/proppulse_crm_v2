-- Consolidated company registration fields

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS approval_notes TEXT;
