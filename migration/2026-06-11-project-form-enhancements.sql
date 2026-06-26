-- Project form enhancements: logo, media gallery, document folders, portal fields

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_logo TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery_videos JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS marketing_brochures TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rera_documents TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS portal_selection TEXT,
  ADD COLUMN IF NOT EXISTS portal_reference_key TEXT,
  ADD COLUMN IF NOT EXISTS portal_sync_status TEXT;

-- Migrate legacy brochure_uploads into marketing_brochures when empty
UPDATE projects
SET marketing_brochures = brochure_uploads
WHERE marketing_brochures IS NULL
   OR cardinality(marketing_brochures) = 0
  AND brochure_uploads IS NOT NULL
  AND cardinality(brochure_uploads) > 0;
