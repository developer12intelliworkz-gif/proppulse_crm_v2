-- =============================================================================
-- FIX: project_type / project_structure were NOT NULL with DEFAULT values
-- Every new project was auto-set to RESIDENTIAL + TOWER_BASED, so Project Setup
-- skipped Level 1 & 2 even when the user never configured them.
-- =============================================================================

-- 1) Remove defaults (if any)
ALTER TABLE projects
  ALTER COLUMN project_type DROP DEFAULT;

ALTER TABLE projects
  ALTER COLUMN project_structure DROP DEFAULT;

-- 2) Allow NULL until user completes Project Setup
ALTER TABLE projects
  ALTER COLUMN project_type DROP NOT NULL;

ALTER TABLE projects
  ALTER COLUMN project_structure DROP NOT NULL;

-- 3) Clear auto-filled values on existing projects (re-do setup in the app)
UPDATE projects
SET
  project_type = NULL,
  project_structure = NULL,
  updated_at = NOW()
WHERE deleted_at IS NULL;

-- 4) Verify (run in pgAdmin after this script)
-- SELECT name, project_type, project_structure FROM projects WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 10;
