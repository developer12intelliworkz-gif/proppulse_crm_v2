-- Video gallery custom categories (groups with URLs per category)

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS gallery_video_groups JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Migrate legacy flat gallery_videos into a default group when groups are empty
UPDATE projects
SET gallery_video_groups = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'name', 'General',
    'videos', gallery_videos
  )
)
WHERE (gallery_video_groups IS NULL OR gallery_video_groups = '[]'::jsonb)
  AND gallery_videos IS NOT NULL
  AND gallery_videos != '[]'::jsonb;
