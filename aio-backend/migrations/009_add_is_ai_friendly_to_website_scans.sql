-- MIGRATION: Add is_ai_friendly to website_scans
ALTER TABLE website_scans ADD COLUMN IF NOT EXISTS is_ai_friendly BOOLEAN;
