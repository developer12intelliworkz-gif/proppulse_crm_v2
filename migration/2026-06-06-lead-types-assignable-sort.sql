-- Lead source assignability and display order
ALTER TABLE lead_types
  ADD COLUMN IF NOT EXISTS is_assignable BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Backfill sort_order from created_at order for existing rows
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) - 1 AS rn
  FROM lead_types
  WHERE deleted_at IS NULL
)
UPDATE lead_types lt
SET sort_order = ordered.rn
FROM ordered
WHERE lt.id = ordered.id AND lt.sort_order = 0;
