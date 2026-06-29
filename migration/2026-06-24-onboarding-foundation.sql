-- Onboarding foundation: user↔brand many-to-many + company/brand onboarding fields

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- brand_description for onboarding step 2
ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS brand_description TEXT;

-- Many-to-many: users ↔ brands (users also keep brand_id as active/primary brand)
CREATE TABLE IF NOT EXISTS user_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, brand_id)
);

CREATE INDEX IF NOT EXISTS idx_user_brands_user_id ON user_brands(user_id);
CREATE INDEX IF NOT EXISTS idx_user_brands_brand_id ON user_brands(brand_id);

-- Backfill junction from existing users.brand_id
INSERT INTO user_brands (user_id, brand_id, is_primary)
SELECT u.id, u.brand_id, TRUE
FROM users u
WHERE u.brand_id IS NOT NULL
  AND u.deleted_at IS NULL
ON CONFLICT (user_id, brand_id) DO NOTHING;
