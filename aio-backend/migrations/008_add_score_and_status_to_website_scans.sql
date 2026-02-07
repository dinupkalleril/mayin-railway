-- MIGRATION: Add score and status to website_scans
ALTER TABLE website_scans ADD COLUMN IF NOT EXISTS score INTEGER;
ALTER TABLE website_scans ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
