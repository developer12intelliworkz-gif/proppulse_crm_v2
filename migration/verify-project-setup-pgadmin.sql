-- =============================================================================
-- PROJECT SETUP — pgAdmin verification (database: crm per api/.env)
-- =============================================================================
-- Run each section in pgAdmin: Query Tool → paste → Execute (F5)
--
-- LEVEL MEANING (inventory setup, NOT the 6-step create-project wizard):
--   L1 = projects.project_type     (RESIDENTIAL, COMMERCIAL, ...)
--   L2 = projects.project_structure (TOWER_BASED, SECTOR_BASED, ...)
--   L3 = project_hierarchy_nodes   (Tower, Sector, Phase, ...)
--   Units = project_units
--
-- Config codes are defined in: api/config/projectConfig.js
-- =============================================================================

-- 1) Confirm setup columns exist and allow NULL (REQUIRED)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
  AND column_name IN ('project_type', 'project_structure', 'name', 'id', 'deleted_at')
ORDER BY column_name;

-- is_nullable MUST be YES for project_type and project_structure
-- column_default MUST be NULL for both
-- If NOT NULL or has DEFAULT → run: migration/2026-05-23-fix-project-setup-defaults.sql

-- If columns are missing, run: migration/2026-03-24-project-units.sql

-- 2) List ALL projects — see L1/L2 values (NULL = setup not done)
SELECT
  id,
  name,
  project_type AS l1_project_type,
  project_structure AS l2_project_structure,
  CASE
    WHEN project_type IS NULL AND project_structure IS NULL THEN 'NOT STARTED'
    WHEN project_type IS NOT NULL AND project_structure IS NULL THEN 'PARTIAL (L1 only — L2 missing)'
    WHEN project_type IS NULL AND project_structure IS NOT NULL THEN 'INVALID (L2 without L1)'
    ELSE 'BOTH SET (app may skip to Tower/Sector setup)'
  END AS setup_status,
  created_at,
  updated_at
FROM projects
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- 3) Dholera Aryan specifically
SELECT
  id,
  name,
  project_type AS l1_project_type,
  project_structure AS l2_project_structure,
  deleted_at
FROM projects
WHERE name ILIKE '%Dholera%' OR name ILIKE '%Aryan%'
ORDER BY created_at DESC;

-- 4) Valid L1 codes (must match exactly — uppercase)
-- RESIDENTIAL | COMMERCIAL | INDUSTRIAL | MIXED_USE | LAND

-- 5) Hierarchy nodes (L3) per project
SELECT
  p.name AS project_name,
  p.project_type,
  p.project_structure,
  h.id AS node_id,
  h.type_code,
  h.name AS node_name,
  h.parent_id
FROM project_hierarchy_nodes h
JOIN projects p ON p.id = h.project_id
WHERE h.deleted_at IS NULL
  AND p.deleted_at IS NULL
ORDER BY p.name, h.parent_id NULLS FIRST, h.name;

-- 6) RESET initial setup for one project (run after replacing the name)
-- UPDATE projects
-- SET project_type = NULL, project_structure = NULL, updated_at = NOW()
-- WHERE name = 'Dholera Aryan' AND deleted_at IS NULL;

-- 7) RESET for ALL projects (careful — only for dev)
-- UPDATE projects
-- SET project_type = NULL, project_structure = NULL, updated_at = NOW()
-- WHERE deleted_at IS NULL;
