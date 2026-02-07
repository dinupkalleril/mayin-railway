-- MIGRATION: Ensure all columns for scan results exist in visibility_scans table
ALTER TABLE visibility_scans ADD COLUMN IF NOT EXISTS score INTEGER;
ALTER TABLE visibility_scans ADD COLUMN IF NOT EXISTS mentioned_count INTEGER;
ALTER TABLE visibility_scans ADD COLUMN IF NOT EXISTS competitors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE visibility_scans ADD COLUMN IF NOT EXISTS prompts_and_answers JSONB DEFAULT '[]'::jsonb;

-- Re-adding columns from previous migrations just in case they were missed
ALTER TABLE visibility_scans ADD COLUMN IF NOT EXISTS model_version VARCHAR(100);
ALTER TABLE visibility_scans ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE visibility_scans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE visibility_scans ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
