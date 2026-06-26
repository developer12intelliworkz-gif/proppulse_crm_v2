CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS project_structure VARCHAR(50),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Inventory setup: NULL until user completes Project Setup (no DB defaults)
ALTER TABLE projects
  ALTER COLUMN project_type DROP DEFAULT;
ALTER TABLE projects
  ALTER COLUMN project_structure DROP DEFAULT;
ALTER TABLE projects
  ALTER COLUMN project_type DROP NOT NULL;
ALTER TABLE projects
  ALTER COLUMN project_structure DROP NOT NULL;

CREATE TABLE IF NOT EXISTS project_hierarchy_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES project_hierarchy_nodes(id) ON DELETE CASCADE,
  type_code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_project_hierarchy_nodes_project
  ON project_hierarchy_nodes(project_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_project_hierarchy_nodes_parent
  ON project_hierarchy_nodes(parent_id)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_project_hierarchy_l3_name
  ON project_hierarchy_nodes(project_id, UPPER(BTRIM(name)))
  WHERE parent_id IS NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_project_hierarchy_l4_name
  ON project_hierarchy_nodes(project_id, parent_id, UPPER(BTRIM(name)))
  WHERE parent_id IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS project_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  hierarchy_node_id UUID NOT NULL REFERENCES project_hierarchy_nodes(id) ON DELETE RESTRICT,
  unit_number VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'booked', 'sold', 'blocked')),
  carpet_area_sqft NUMERIC(12,2) NOT NULL CHECK (carpet_area_sqft > 0),
  super_builtup_area_sqft NUMERIC(12,2) CHECK (super_builtup_area_sqft IS NULL OR super_builtup_area_sqft >= 0),
  facing VARCHAR(100),
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  price NUMERIC(14,2) CHECK (price IS NULL OR price >= 0),
  lead_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT project_units_amenities_array CHECK (jsonb_typeof(amenities) = 'array')
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_project_units_project_unit_number
  ON project_units(project_id, UPPER(BTRIM(unit_number)))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_project_units_node
  ON project_units(hierarchy_node_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_project_units_status
  ON project_units(project_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_project_units_lead
  ON project_units(lead_id)
  WHERE deleted_at IS NULL AND lead_id IS NOT NULL;