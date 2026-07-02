-- Area unit system: canonical storage in sq.ft (carpet_area_sqft / super_builtup_area_sqft)
-- Display/entry units stored in carpet_area_unit / super_builtup_area_unit columns.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS default_area_unit TEXT NOT NULL DEFAULT 'sqft';

ALTER TABLE unit_types
  ADD COLUMN IF NOT EXISTS area_fields_mode TEXT NOT NULL DEFAULT 'carpet_only';

ALTER TABLE project_units
  ADD COLUMN IF NOT EXISTS area_fields_override TEXT,
  ADD COLUMN IF NOT EXISTS area_unit_override TEXT;

COMMENT ON COLUMN projects.default_area_unit IS
  'Default display/entry area unit for this project (sqft, sqyd, sqm, acre, bigha, sector). Values stored in project_units.*_sqft columns are always canonical sq.ft.';

COMMENT ON COLUMN unit_types.area_fields_mode IS
  'Which area field applies to this unit type: carpet_only or super_only.';

UPDATE projects SET default_area_unit = 'sqft' WHERE default_area_unit IS NULL;
UPDATE unit_types SET area_fields_mode = 'carpet_only' WHERE area_fields_mode IS NULL OR area_fields_mode = 'both';
