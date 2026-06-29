-- Company registration fields + brands table

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS pan_card TEXT,
  ADD COLUMN IF NOT EXISTS gst_no TEXT,
  ADD COLUMN IF NOT EXISTS registered_office_address TEXT,
  ADD COLUMN IF NOT EXISTS head_office_address TEXT,
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS contact_number_1 TEXT,
  ADD COLUMN IF NOT EXISTS contact_number_2 TEXT,
  ADD COLUMN IF NOT EXISTS company_location_search TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS approvals JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  brand_logo TEXT,
  brand_display_name TEXT NOT NULL,
  website TEXT,
  contact_number TEXT,
  facebook_link TEXT,
  instagram_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_company_id ON brands(company_id);
