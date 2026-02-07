-- MIGRATION: Add model_version column to existing visibility_scans table
ALTER TABLE visibility_scans ADD COLUMN IF NOT EXISTS model_version VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_visibility_scans_model_version ON visibility_scans(model_version);

-- MIGRATION: Add new columns to website_scans for enhanced AI visibility analysis
ALTER TABLE website_scans ADD COLUMN IF NOT EXISTS ai_visibility_factors JSONB DEFAULT '{}'::jsonb;
ALTER TABLE website_scans ADD COLUMN IF NOT EXISTS priority_actions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE website_scans ADD COLUMN IF NOT EXISTS content_gaps JSONB DEFAULT '[]'::jsonb;
ALTER TABLE website_scans ADD COLUMN IF NOT EXISTS competitive_insights TEXT;

-- MIGRATION: Add new columns to sentiment_analyses for AI visibility strategies
ALTER TABLE sentiment_analyses ADD COLUMN IF NOT EXISTS ai_visibility_strategies JSONB DEFAULT '{}'::jsonb;
ALTER TABLE sentiment_analyses ADD COLUMN IF NOT EXISTS citation_opportunities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sentiment_analyses ADD COLUMN IF NOT EXISTS content_topics JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sentiment_analyses ADD COLUMN IF NOT EXISTS industry_publications JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sentiment_analyses ADD COLUMN IF NOT EXISTS key_messages JSONB DEFAULT '[]'::jsonb;

-- MIGRATION: Add columns from visibility_scans to sentiment_analyses for consistency
ALTER TABLE sentiment_analyses ADD COLUMN IF NOT EXISTS ai_model VARCHAR(50);
ALTER TABLE sentiment_analyses ADD COLUMN IF NOT EXISTS score INTEGER;
