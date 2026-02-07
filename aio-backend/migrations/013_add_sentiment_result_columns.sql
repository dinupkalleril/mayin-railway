BEGIN;

ALTER TABLE sentiment_analyses
ADD COLUMN IF NOT EXISTS overall_sentiment TEXT,
ADD COLUMN IF NOT EXISTS positive_aspects JSONB,
ADD COLUMN IF NOT EXISTS negative_aspects JSONB,
ADD COLUMN IF NOT EXISTS competitor_comparison JSONB,
ADD COLUMN IF NOT EXISTS improvement_strategies JSONB,
ADD COLUMN IF NOT EXISTS web_presence_score INTEGER;

COMMIT;
