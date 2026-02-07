-- MIGRATION: Add missing columns to visibility_scans for error handling and timestamps
ALTER TABLE visibility_scans ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE visibility_scans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE visibility_scans ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
