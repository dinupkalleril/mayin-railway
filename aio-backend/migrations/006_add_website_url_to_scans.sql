-- MIGRATION: Add website_url to website_scans
-- This migration adds the website_url column to the website_scans table if it does not already exist.
-- This is necessary for databases created before this column was added to the schema.

ALTER TABLE website_scans ADD COLUMN IF NOT EXISTS website_url VARCHAR(500);
