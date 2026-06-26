-- Amenities master-detail + unit type labels + expanded unit fields

CREATE TABLE IF NOT EXISTS amenity_master (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_amenities (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amenity_id INTEGER NOT NULL REFERENCES amenity_master(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, amenity_id)
);

CREATE INDEX IF NOT EXISTS idx_project_amenities_project
  ON project_amenities(project_id);

ALTER TABLE unit_types
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE unit_types SET is_active = true WHERE is_active IS NULL;

ALTER TABLE project_units
  ADD COLUMN IF NOT EXISTS carpet_area_unit TEXT DEFAULT 'sqft',
  ADD COLUMN IF NOT EXISTS super_builtup_area_unit TEXT DEFAULT 'sqft',
  ADD COLUMN IF NOT EXISTS base_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS total_price NUMERIC,
  ADD COLUMN IF NOT EXISTS has_parking BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS parking_count INTEGER;

UPDATE project_units
SET carpet_area_unit = COALESCE(carpet_area_unit, 'sqft'),
    super_builtup_area_unit = COALESCE(super_builtup_area_unit, 'sqft'),
    has_parking = COALESCE(has_parking, false)
WHERE carpet_area_unit IS NULL
   OR super_builtup_area_unit IS NULL
   OR has_parking IS NULL;
