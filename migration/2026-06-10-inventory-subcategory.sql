-- Store exact inventory subcategory key (flat_apartment, shop, etc.) on projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS inventory_subcategory TEXT;
