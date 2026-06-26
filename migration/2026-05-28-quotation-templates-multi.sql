-- Allow multiple active templates per project.
-- Run in pgAdmin if your DB already has the older unique index.

DROP INDEX IF EXISTS uniq_active_quotation_template_per_project;

-- Optional: helpful lookup
CREATE INDEX IF NOT EXISTS idx_quotation_templates_project_active
  ON quotation_templates(project_id, is_active);

