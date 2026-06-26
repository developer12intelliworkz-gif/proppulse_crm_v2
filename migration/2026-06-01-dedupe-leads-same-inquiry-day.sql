-- Remove duplicate active leads: same email + phone on the same inquiry day (IST).
-- Keeps the row with the highest id (most recent insert).

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY
        LOWER(TRIM(COALESCE(email, ''))),
        TRIM(COALESCE(phone, '')),
        ((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata')::date
      ORDER BY id DESC
    ) AS rn
  FROM leads
  WHERE is_active = TRUE
    AND (NULLIF(TRIM(email), '') IS NOT NULL OR NULLIF(TRIM(phone), '') IS NOT NULL)
)
UPDATE leads
SET
  is_active = FALSE,
  deleted_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
