-- Rebuild amenities as project-scoped records (replaces amenity_master + junction table)

DROP TABLE IF EXISTS project_amenities CASCADE;
DROP TABLE IF EXISTS amenity_master CASCADE;

CREATE TABLE project_amenities (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_selected BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_project_amenities_unique_name
  ON project_amenities (project_id, LOWER(TRIM(name)));

CREATE INDEX idx_project_amenities_project_id
  ON project_amenities (project_id);
