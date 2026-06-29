-- Link users to a brand registered under their company

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);

CREATE INDEX IF NOT EXISTS idx_users_brand_id ON users(brand_id);
