-- Quotation module schema (PostgreSQL)
-- Uses existing tables: projects, project_units, leads

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- One row per year to generate QT-YYYY-NNNNN safely in a transaction.
CREATE TABLE IF NOT EXISTS quotation_number_sequences (
  year INTEGER PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  has_terrace_units BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_templates_project
  ON quotation_templates(project_id);

-- NOTE:
-- This module now supports multiple templates per project (named).
-- Do NOT enforce "only one active template per project".
-- If you previously created uniq_active_quotation_template_per_project manually,
-- drop it in your database with:
--   DROP INDEX IF EXISTS uniq_active_quotation_template_per_project;

CREATE TABLE IF NOT EXISTS quotation_particulars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES quotation_templates(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  calculation_type VARCHAR(50) NOT NULL,
  value NUMERIC(10,4) NOT NULL,
  applies_to VARCHAR(50) NOT NULL DEFAULT 'unit',
  include_in_subtotal BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_optional BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_particulars_template
  ON quotation_particulars(template_id);

CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES quotation_templates(id) ON DELETE RESTRICT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  unit_id INTEGER NOT NULL REFERENCES project_units(id) ON DELETE CASCADE,
  lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  quotation_number VARCHAR(100) UNIQUE,
  client_name VARCHAR(255),
  quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  base_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  carpet_area NUMERIC(10,2),
  super_builtup_area NUMERIC(10,2),
  terrace_area NUMERIC(10,2),
  unit_rate NUMERIC(10,2),
  terrace_rate NUMERIC(10,2),
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  particulars_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotations_project
  ON quotations(project_id);

CREATE INDEX IF NOT EXISTS idx_quotations_unit
  ON quotations(unit_id);

CREATE INDEX IF NOT EXISTS idx_quotations_lead
  ON quotations(lead_id);

-- Enforce: only one accepted quotation per unit.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_accepted_quotation_per_unit
  ON quotations(unit_id)
  WHERE status = 'accepted';

